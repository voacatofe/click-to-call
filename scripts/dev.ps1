#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script de automação para desenvolvimento do Click-to-Call System

.DESCRIPTION
    Este script facilita tarefas comuns de desenvolvimento como:
    - Inicializar o ambiente
    - Executar serviços
    - Verificar status dos containers
    - Limpar ambiente

.PARAMETER Action
    Ação a ser executada: setup, start, stop, restart, status, logs, clean

.EXAMPLE
    .\scripts\dev.ps1 setup
    .\scripts\dev.ps1 start
    .\scripts\dev.ps1 logs api
    .\scripts\dev.ps1 clean
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("setup", "start", "stop", "restart", "status", "logs", "clean", "certs")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$Service
)

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

function Check-Prerequisites {
    Write-ColorOutput "🔍 Verificando pré-requisitos..." $Blue
    
    # Verificar Docker
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "❌ Docker não encontrado. Instale o Docker Desktop." $Red
        exit 1
    }
    
    # Verificar Docker Compose
    if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "❌ Docker Compose não encontrado." $Red
        exit 1
    }
    
    # Verificar Node.js (opcional para desenvolvimento)
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "⚠️  Node.js não encontrado. Recomendado para desenvolvimento local." $Yellow
    }
    
    # Verificar pnpm (opcional para desenvolvimento)
    if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "⚠️  pnpm não encontrado. Recomendado para desenvolvimento local." $Yellow
    }
    
    Write-ColorOutput "✅ Pré-requisitos verificados." $Green
}

function Setup-Environment {
    Write-ColorOutput "🚀 Configurando ambiente..." $Blue
    
    # Verificar e criar arquivos .env se não existirem
    if (!(Test-Path "apps/api/.env")) {
        Write-ColorOutput "📝 Criando apps/api/.env a partir do exemplo..." $Yellow
        Copy-Item "apps/api/.env.example" "apps/api/.env"
    }
    
    if (!(Test-Path "apps/web/.env")) {
        Write-ColorOutput "📝 Criando apps/web/.env a partir do exemplo..." $Yellow
        Copy-Item "apps/web/.env.example" "apps/web/.env"
    }
    
    if (!(Test-Path ".env")) {
        Write-ColorOutput "📝 Criando .env a partir do exemplo..." $Yellow
        Copy-Item ".env.example" ".env"
    }
    
    Write-ColorOutput "⚠️  IMPORTANTE: Configure suas credenciais nos arquivos .env antes de continuar!" $Yellow
    Write-ColorOutput "📁 Arquivos para editar:" $Blue
    Write-ColorOutput "   - apps/api/.env (Supabase, RD Station, JWT secrets)" $Blue
    Write-ColorOutput "   - apps/web/.env (URLs públicas)" $Blue
    Write-ColorOutput "   - .env (TaskMaster AI, se necessário)" $Blue
    
    Write-ColorOutput "✅ Ambiente configurado. Execute 'dev.ps1 start' para iniciar os serviços." $Green
}

function Start-Services {
    Write-ColorOutput "🚀 Iniciando serviços..." $Blue
    
    if ($Service) {
        Write-ColorOutput "🔧 Iniciando serviço específico: $Service" $Yellow
        docker-compose up --build $Service
    } else {
        Write-ColorOutput "🔧 Iniciando todos os serviços..." $Yellow
        docker-compose up --build -d
        
        Write-ColorOutput "⏳ Aguardando serviços ficarem prontos..." $Yellow
        Start-Sleep -Seconds 10
        
        Show-Status
    }
}

function Stop-Services {
    Write-ColorOutput "🛑 Parando serviços..." $Blue
    docker-compose down
    Write-ColorOutput "✅ Serviços parados." $Green
}

function Restart-Services {
    Write-ColorOutput "🔄 Reiniciando serviços..." $Blue
    Stop-Services
    Start-Services
}

function Show-Status {
    Write-ColorOutput "📊 Status dos serviços:" $Blue
    docker-compose ps
    
    Write-ColorOutput "`n🌐 URLs de acesso:" $Blue
    Write-ColorOutput "   Frontend: http://localhost:3000" $Green
    Write-ColorOutput "   API: http://localhost:3001" $Green
    Write-ColorOutput "   Health Check: http://localhost:3001/api/health" $Green
    Write-ColorOutput "   Asterisk HTTP: http://localhost:8088" $Green
    Write-ColorOutput "   Asterisk WSS: wss://localhost:8089" $Green
    
    # Testar health checks
    Write-ColorOutput "`n🔍 Verificando health checks..." $Blue
    
    try {
        $apiHealth = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
        Write-ColorOutput "   ✅ API: $($apiHealth.status)" $Green
    } catch {
        Write-ColorOutput "   ❌ API: Não responsiva" $Red
    }
    
    try {
        $webHealth = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
        if ($webHealth.StatusCode -eq 200) {
            Write-ColorOutput "   ✅ Frontend: Ativo" $Green
        }
    } catch {
        Write-ColorOutput "   ❌ Frontend: Não responsivo" $Red
    }
}

function Show-Logs {
    Write-ColorOutput "📋 Visualizando logs..." $Blue
    
    if ($Service) {
        Write-ColorOutput "📋 Logs do serviço: $Service" $Yellow
        docker-compose logs -f $Service
    } else {
        Write-ColorOutput "📋 Logs de todos os serviços:" $Yellow
        docker-compose logs -f
    }
}

function Clean-Environment {
    Write-ColorOutput "🧹 Limpando ambiente..." $Blue
    
    # Parar e remover containers
    docker-compose down -v --remove-orphans
    
    # Remover imagens do projeto
    $images = docker images --filter "reference=click-to-call*" -q
    if ($images) {
        Write-ColorOutput "🗑️  Removendo imagens do projeto..." $Yellow
        docker rmi $images -f
    }
    
    # Limpar volumes órfãos
    Write-ColorOutput "🗑️  Limpando volumes órfãos..." $Yellow
    docker volume prune -f
    
    # Limpar redes órfãs
    Write-ColorOutput "🗑️  Limpando redes órfãs..." $Yellow
    docker network prune -f
    
    Write-ColorOutput "✅ Ambiente limpo." $Green
}

function Generate-Certificates {
    Write-ColorOutput "🔐 Gerando certificados TLS..." $Blue
    docker-compose --profile tools run --rm cert-generator
    Write-ColorOutput "✅ Certificados gerados." $Green
}

# Função principal
function Main {
    Write-ColorOutput "🎯 Click-to-Call Development Helper" $Blue
    Write-ColorOutput "Ação: $Action" $Yellow
    
    Check-Prerequisites
    
    switch ($Action) {
        "setup" { Setup-Environment }
        "start" { Start-Services }
        "stop" { Stop-Services }
        "restart" { Restart-Services }
        "status" { Show-Status }
        "logs" { Show-Logs }
        "clean" { Clean-Environment }
        "certs" { Generate-Certificates }
        default { 
            Write-ColorOutput "❌ Ação não reconhecida: $Action" $Red
            exit 1
        }
    }
}

# Executar função principal
Main 