# Script PowerShell para gerar certificados DTLS para mídia WebRTC
# EasyPanel cuida da sinalização (WSS), mas ainda precisamos de DTLS para mídia

Write-Host "🔐 Gerando certificados DTLS para mídia WebRTC..." -ForegroundColor Green

$certsDir = "./certs"

# Criar diretório se não existir
if (!(Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
    Write-Host "📁 Diretório $certsDir criado" -ForegroundColor Yellow
}

Write-Host "📝 Gerando chave privada usando Docker..." -ForegroundColor Cyan

# Gerar chave privada usando Docker
docker run --rm -v "${PWD}/asterisk/certs:/certs" alpine/openssl genrsa -out /certs/asterisk.key 2048

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar chave privada" -ForegroundColor Red
    exit 1
}

Write-Host "📜 Gerando certificado DTLS..." -ForegroundColor Cyan

# Gerar certificado auto-assinado para DTLS
docker run --rm -v "${PWD}/asterisk/certs:/certs" alpine/openssl req -new -x509 -key /certs/asterisk.key -out /certs/asterisk.crt -days 365 -subj "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall/OU=VoIP/CN=asterisk.local"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar certificado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Verificando certificados gerados..." -ForegroundColor Cyan

# Verificar se os arquivos foram criados
if ((Test-Path "$certsDir/asterisk.key") -and (Test-Path "$certsDir/asterisk.crt")) {
    Write-Host ""
    Write-Host "🎉 Certificados DTLS gerados com sucesso!" -ForegroundColor Green
    Write-Host "📁 Local: $certsDir/" -ForegroundColor White
    Write-Host "🔑 Chave: asterisk.key" -ForegroundColor White
    Write-Host "📜 Certificado: asterisk.crt" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Nota: EasyPanel cuida da sinalização WSS, estes certificados são apenas para criptografar a mídia (áudio/vídeo)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🚀 Para usar no Docker, execute:" -ForegroundColor Cyan
    Write-Host "   docker-compose up --build" -ForegroundColor White
} else {
    Write-Host "❌ Erro: Certificados não foram gerados corretamente" -ForegroundColor Red
    exit 1
} 