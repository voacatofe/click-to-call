# Script PowerShell simplificado para Click-to-Call (WSS apenas)
# Uso: .\scripts\setup-wss.ps1 [ação]

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "test", "logs", "help")]
    [string]$Acao = "help"
)

function Show-Help {
    Write-Host "🔐 Click-to-Call WSS - Script Simplificado" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup-wss.ps1 start   # Iniciar sistema (WSS)"
    Write-Host "  .\scripts\setup-wss.ps1 stop    # Parar sistema"
    Write-Host "  .\scripts\setup-wss.ps1 test    # Testar conectividade"
    Write-Host "  .\scripts\setup-wss.ps1 logs    # Ver logs"
    Write-Host "  .\scripts\setup-wss.ps1 help    # Mostrar ajuda"
    Write-Host ""
    Write-Host "Sistema usa apenas WSS (WebSocket Secure) via HTTPS" -ForegroundColor Green
}

function Start-System {
    Write-Host "🚀 Iniciando Click-to-Call (WSS)..." -ForegroundColor Green
    
    # Verificar Docker
    try {
        docker version | Out-Null
    } catch {
        Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
        return
    }
    
    # Gerar certificados se necessário
    Write-Host "Gerando certificados SSL..." -ForegroundColor Yellow
    docker-compose run --rm --no-deps cert-generator
    
    # Parar e iniciar containers
    Write-Host "Iniciando containers..." -ForegroundColor Yellow
    docker-compose down -v
    docker-compose up -d
    
    Write-Host "Aguardando containers..." -ForegroundColor Yellow
    Start-Sleep 15
    
    # Status
    Write-Host "Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "✅ Sistema iniciado!" -ForegroundColor Green
    Write-Host "🌐 Frontend: https://localhost:3000" -ForegroundColor Cyan
    Write-Host "� WebSocket: wss://localhost:8089/ws" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Aceite o certificado auto-assinado no navegador" -ForegroundColor Yellow
}

function Stop-System {
    Write-Host "🛑 Parando Click-to-Call..." -ForegroundColor Yellow
    docker-compose down -v
    Write-Host "✅ Sistema parado!" -ForegroundColor Green
}

function Test-System {
    Write-Host "🧪 Testando sistema..." -ForegroundColor Cyan
    
    # Containers
    $containers = docker-compose ps --services --filter "status=running"
    Write-Host "Containers ativos: $($containers -join ', ')" -ForegroundColor Green
    
    # Portas
    $wss = Test-NetConnection -ComputerName localhost -Port 8089 -WarningAction SilentlyContinue
    $web = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue
    
    Write-Host "WSS (8089): $(if($wss.TcpTestSucceeded){'✅ OK'}else{'❌ FALHA'})" -ForegroundColor $(if($wss.TcpTestSucceeded){'Green'}else{'Red'})
    Write-Host "Web (3000): $(if($web.TcpTestSucceeded){'✅ OK'}else{'❌ FALHA'})" -ForegroundColor $(if($web.TcpTestSucceeded){'Green'}else{'Red'})
    
    Write-Host ""
    Write-Host "Para testar: https://localhost:3000" -ForegroundColor Cyan
}

function Show-Logs {
    Write-Host "📋 Logs do sistema:" -ForegroundColor Cyan
    docker-compose logs -f
}

# Executar ação
switch ($Acao) {
    "start" { Start-System }
    "stop" { Stop-System }
    "test" { Test-System }
    "logs" { Show-Logs }
    "help" { Show-Help }
    default { Show-Help }
} 