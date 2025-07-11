# =============================================================================
# Script Robusto para Geração de Certificados SSL/TLS e DTLS
# Suporta desenvolvimento local e produção com EasyPanel
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "production", "auto")]
    [string]$Environment = "auto",
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "clicktocall-ctc.2w4klq.easypanel.host",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput
)

# Configurações
$ErrorActionPreference = "Stop"
$CertsDir = "./asterisk/certs"
$KeysDir = "/etc/asterisk/keys"

# Cores para output
$Colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Debug = "DarkGray"
}

function Write-Log {
    param([string]$Message, [string]$Level = "Info")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = $Colors[$Level]
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-OpenSSL {
    try {
        $null = Get-Command openssl -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

function Test-Docker {
    try {
        $result = docker version 2>$null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function New-OpenSSLCertificate {
    param(
        [string]$CertPath,
        [string]$KeyPath,
        [string]$CommonName,
        [int]$Days = 365
    )
    
    Write-Log "Gerando certificado para: $CommonName" "Info"
    
    # Gerar chave privada
    openssl genrsa -out $KeyPath 2048
    if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar chave privada" }
    
    # Gerar certificado
    $subject = "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall/OU=VoIP/CN=$CommonName"
    openssl req -new -x509 -key $KeyPath -out $CertPath -days $Days -subj $subject
    if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar certificado" }
    
    Write-Log "Certificado gerado: $CertPath" "Success"
}

function New-DockerCertificate {
    param(
        [string]$CertPath,
        [string]$KeyPath,
        [string]$CommonName,
        [int]$Days = 365
    )
    
    Write-Log "Gerando certificado via Docker para: $CommonName" "Info"
    
    $certsVolume = (Resolve-Path $CertsDir).Path.Replace('\', '/').Replace('C:', '/c')
    
    # Gerar chave privada
    docker run --rm -v "${certsVolume}:/certs" alpine/openssl genrsa -out "/certs/$(Split-Path $KeyPath -Leaf)" 2048
    if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar chave via Docker" }
    
    # Gerar certificado
    $subject = "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall/OU=VoIP/CN=$CommonName"
    docker run --rm -v "${certsVolume}:/certs" alpine/openssl req -new -x509 -key "/certs/$(Split-Path $KeyPath -Leaf)" -out "/certs/$(Split-Path $CertPath -Leaf)" -days $Days -subj $subject
    if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar certificado via Docker" }
    
    Write-Log "Certificado gerado via Docker: $CertPath" "Success"
}

function Test-Certificate {
    param([string]$CertPath)
    
    if (!(Test-Path $CertPath)) {
        return $false
    }
    
    try {
        if (Test-OpenSSL) {
            $output = openssl x509 -in $CertPath -noout -dates 2>$null
            return $LASTEXITCODE -eq 0
        }
        return $true
    }
    catch {
        return $false
    }
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

Write-Log "🔐 Iniciando geração robusta de certificados SSL/TLS" "Info"
Write-Log "Ambiente: $Environment | Domínio: $Domain" "Info"

# Detectar ambiente automaticamente
if ($Environment -eq "auto") {
    if ($env:NODE_ENV -eq "production" -or $Domain -ne "localhost") {
        $Environment = "production"
    } else {
        $Environment = "development"
    }
    Write-Log "Ambiente detectado automaticamente: $Environment" "Warning"
}

# Criar diretório de certificados
if (!(Test-Path $CertsDir)) {
    New-Item -ItemType Directory -Path $CertsDir -Force | Out-Null
    Write-Log "Diretório criado: $CertsDir" "Info"
}

# Definir caminhos dos certificados
$asteriskCert = Join-Path $CertsDir "asterisk.crt"
$asteriskKey = Join-Path $CertsDir "asterisk.key"

# Verificar se certificados já existem
if (!$Force -and (Test-Path $asteriskCert) -and (Test-Path $asteriskKey)) {
    if (Test-Certificate $asteriskCert) {
        Write-Log "Certificados válidos já existem. Use -Force para regenerar." "Warning"
        
        if (Test-OpenSSL) {
            Write-Log "Detalhes do certificado existente:" "Info"
            openssl x509 -in $asteriskCert -noout -subject -dates
        }
        exit 0
    } else {
        Write-Log "Certificados existem mas são inválidos. Regenerando..." "Warning"
    }
}

# Escolher método de geração
$useDocker = $false
if (Test-OpenSSL) {
    Write-Log "OpenSSL encontrado localmente" "Info"
} elseif (Test-Docker) {
    Write-Log "OpenSSL não encontrado. Usando Docker..." "Warning"
    $useDocker = $true
} else {
    Write-Log "Nem OpenSSL nem Docker estão disponíveis!" "Error"
    Write-Log "Instale OpenSSL ou Docker para continuar." "Error"
    exit 1
}

try {
    # Gerar certificados baseado no ambiente
    switch ($Environment) {
        "development" {
            Write-Log "🔧 Gerando certificados para DESENVOLVIMENTO" "Info"
            $commonName = "localhost"
            
            if ($useDocker) {
                New-DockerCertificate -CertPath $asteriskCert -KeyPath $asteriskKey -CommonName $commonName -Days 365
            } else {
                New-OpenSSLCertificate -CertPath $asteriskCert -KeyPath $asteriskKey -CommonName $commonName -Days 365
            }
        }
        
        "production" {
            Write-Log "🚀 Gerando certificados para PRODUÇÃO" "Info"
            $commonName = $Domain
            
            if ($useDocker) {
                New-DockerCertificate -CertPath $asteriskCert -KeyPath $asteriskKey -CommonName $commonName -Days 365
            } else {
                New-OpenSSLCertificate -CertPath $asteriskCert -KeyPath $asteriskKey -CommonName $commonName -Days 365
            }
        }
    }
    
    # Verificar certificados gerados
    if ((Test-Path $asteriskCert) -and (Test-Path $asteriskKey)) {
        Write-Log "✅ Certificados gerados com sucesso!" "Success"
        
        # Mostrar detalhes se OpenSSL disponível
        if (Test-OpenSSL -and $VerboseOutput) {
            Write-Log "📋 Detalhes do certificado:" "Info"
            openssl x509 -in $asteriskCert -noout -subject -dates -fingerprint
        }
        
        # Mostrar instruções de uso
        Write-Log "" "Info"
        Write-Log "📁 Certificados salvos em: $CertsDir" "Info"
        Write-Log "🔑 Chave privada: asterisk.key" "Info"
        Write-Log "📜 Certificado: asterisk.crt" "Info"
        Write-Log "" "Info"
        
        if ($Environment -eq "development") {
            Write-Log "🔧 Para desenvolvimento local:" "Info"
            Write-Log "   docker-compose up --build" "Info"
        } else {
            Write-Log "🚀 Para produção (EasyPanel):" "Info"
            Write-Log "   1. Deploy via EasyPanel" "Info"
            Write-Log "   2. EasyPanel faz SSL termination (WSS)" "Info"
            Write-Log "   3. Asterisk usa estes certificados para DTLS (mídia)" "Info"
        }
        
    } else {
        throw "Certificados não foram criados corretamente"
    }
    
} catch {
    Write-Log "❌ Erro ao gerar certificados: $($_.Exception.Message)" "Error"
    exit 1
}

Write-Log "🎉 Processo concluído com sucesso!" "Success" 