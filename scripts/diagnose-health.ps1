#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script de diagnóstico para Click-to-Call System

.DESCRIPTION
    Verifica a saúde dos serviços e identifica problemas

.EXAMPLE
    .\scripts\diagnose-health.ps1
#>

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color)
    Write-Host "$Color$Message$Reset"
}

Write-ColorOutput "🔍 Diagnóstico do Click-to-Call System" $Blue
Write-ColorOutput "======================================" $Blue

# Verificar se os containers estão rodando
Write-ColorOutput "`n📋 Status dos containers:" $Yellow
docker-compose ps

# Verificar health checks
Write-ColorOutput "`n🏥 Health checks:" $Yellow
Write-ColorOutput "Backend: http://localhost:3001/api/health" $Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5
    Write-ColorOutput "✅ Backend: $($response.StatusCode)" $Green
} catch {
    Write-ColorOutput "❌ Backend: Falha - $($_.Exception.Message)" $Red
}

Write-ColorOutput "Frontend: http://localhost:3000" $Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    Write-ColorOutput "✅ Frontend: $($response.StatusCode)" $Green
} catch {
    Write-ColorOutput "❌ Frontend: Falha - $($_.Exception.Message)" $Red
}

# Verificar logs do backend
Write-ColorOutput "`n📋 Últimos logs do backend:" $Yellow
docker-compose logs --tail=20 backend

# Verificar logs do Asterisk
Write-ColorOutput "`n📋 Últimos logs do Asterisk:" $Yellow
docker-compose logs --tail=20 voip

# Verificar conectividade interna
Write-ColorOutput "`n🔗 Testando conectividade interna:" $Yellow
Write-ColorOutput "Backend → Asterisk AMI (porta 5038):" $Blue
try {
    $result = docker exec clicktocall-backend sh -c "nc -zv voip 5038" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Conexão bem-sucedida" $Green
    } else {
        Write-ColorOutput "❌ Falha na conexão: $result" $Red
    }
} catch {
    Write-ColorOutput "❌ Erro ao testar conexão: $($_.Exception.Message)" $Red
}

# Verificar variáveis de ambiente
Write-ColorOutput "`n🌍 Variáveis de ambiente do backend:" $Yellow
try {
    $envVars = docker exec clicktocall-backend env | Where-Object { $_ -match "ASTERISK|SUPABASE|NODE_ENV|PORT" }
    foreach ($var in $envVars) {
        Write-ColorOutput $var $Blue
    }
} catch {
    Write-ColorOutput "❌ Erro ao obter variáveis: $($_.Exception.Message)" $Red
}

Write-ColorOutput "`n✅ Diagnóstico concluído!" $Green
Write-ColorOutput "Se houver problemas, verifique os logs acima e o arquivo EASYPANEL_CONFIG.md" $Yellow 