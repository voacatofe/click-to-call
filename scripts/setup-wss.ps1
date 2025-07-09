# Script PowerShell para configurar WSS no Click-to-Call
# Uso: .\scripts\setup-wss.ps1 [modo]
# Modos: ws, wss, test

param(
    [Parameter(Position=0)]
    [ValidateSet("ws", "wss", "test", "help")]
    [string]$Modo = "help"
)

function Show-Help {
    Write-Host "🔐 Script de Configuração WSS - Click-to-Call" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup-wss.ps1 ws      # Modo desenvolvimento (WS apenas)"
    Write-Host "  .\scripts\setup-wss.ps1 wss     # Modo produção (WS + WSS)"
    Write-Host "  .\scripts\setup-wss.ps1 test    # Testar conectividade"
    Write-Host "  .\scripts\setup-wss.ps1 help    # Mostrar esta ajuda"
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Green
    Write-Host "  # Iniciar apenas com WS para desenvolvimento rápido"
    Write-Host "  .\scripts\setup-wss.ps1 ws"
    Write-Host ""
    Write-Host "  # Iniciar com WS + WSS para testar produção"
    Write-Host "  .\scripts\setup-wss.ps1 wss"
    Write-Host ""
    Write-Host "  # Testar se ambos protocolos estão funcionando"
    Write-Host "  .\scripts\setup-wss.ps1 test"
}

function Start-WSMode {
    Write-Host "🚀 Iniciando modo WS (desenvolvimento)..." -ForegroundColor Green
    
    # Parar containers atuais
    Write-Host "Parando containers atuais..." -ForegroundColor Yellow
    docker-compose down -v
    
    # Iniciar com configuração WS
    Write-Host "Iniciando containers com WS..." -ForegroundColor Yellow
    docker-compose up -d
    
    # Aguardar containers ficarem saudáveis
    Write-Host "Aguardando containers ficarem saudáveis..." -ForegroundColor Yellow
    Start-Sleep 10
    
    # Verificar status
    Write-Host "Status dos containers:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "✅ Modo WS iniciado!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔗 WebSocket: ws://localhost:8088/ws" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para testar: .\scripts\setup-wss.ps1 test" -ForegroundColor Yellow
}

function Start-WSSMode {
    Write-Host "🔐 Iniciando modo WSS (produção)..." -ForegroundColor Green
    
    # Parar containers atuais
    Write-Host "Parando containers atuais..." -ForegroundColor Yellow
    docker-compose down -v
    docker-compose -f docker-compose-wss.yml down -v
    
    # Iniciar com configuração WSS
    Write-Host "Iniciando containers com WSS..." -ForegroundColor Yellow
    docker-compose -f docker-compose-wss.yml up -d
    
    # Aguardar containers ficarem saudáveis
    Write-Host "Aguardando containers e geração de certificados..." -ForegroundColor Yellow
    Start-Sleep 20
    
    # Verificar status
    Write-Host "Status dos containers:" -ForegroundColor Cyan
    docker-compose -f docker-compose-wss.yml ps
    
    # Verificar certificados
    Write-Host ""
    Write-Host "Verificando certificados..." -ForegroundColor Cyan
    docker exec asterisk-clicktocall-wss ls -la /etc/asterisk/keys/ 2>$null
    
    Write-Host ""
    Write-Host "✅ Modo WSS iniciado!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:3000 (WS) ou https://localhost:3000 (WSS)" -ForegroundColor Cyan
    Write-Host "🔗 WebSocket: ws://localhost:8088/ws" -ForegroundColor Cyan
    Write-Host "🔐 WebSocket Secure: wss://localhost:8089/ws" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Para HTTPS, aceite o certificado auto-assinado no navegador" -ForegroundColor Yellow
    Write-Host "Para testar: .\scripts\setup-wss.ps1 test" -ForegroundColor Yellow
}

function Test-Connectivity {
    Write-Host "🧪 Testando conectividade..." -ForegroundColor Cyan
    Write-Host ""
    
    # Testar containers
    Write-Host "1. Verificando containers..." -ForegroundColor Yellow
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String "clicktocall|asterisk"
    if ($containers) {
        $containers | ForEach-Object { Write-Host "   $_" -ForegroundColor Green }
    } else {
        Write-Host "   ❌ Nenhum container encontrado" -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "2. Testando conectividade HTTP..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
        Write-Host "   ✅ HTTP (localhost:3000): $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ HTTP não disponível: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "3. Testando API..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing
        Write-Host "   ✅ API (localhost:3001): $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ API não disponível: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "4. Verificando portas WebSocket..." -ForegroundColor Yellow
    
    # Testar porta WS
    $wsPort = Test-NetConnection -ComputerName localhost -Port 8088 -WarningAction SilentlyContinue
    if ($wsPort.TcpTestSucceeded) {
        Write-Host "   ✅ WS (localhost:8088): Porta aberta" -ForegroundColor Green
    } else {
        Write-Host "   ❌ WS (localhost:8088): Porta fechada" -ForegroundColor Red
    }
    
    # Testar porta WSS
    $wssPort = Test-NetConnection -ComputerName localhost -Port 8089 -WarningAction SilentlyContinue
    if ($wssPort.TcpTestSucceeded) {
        Write-Host "   ✅ WSS (localhost:8089): Porta aberta" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WSS (localhost:8089): Porta fechada (normal se usando modo WS)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "5. Verificando logs recentes..." -ForegroundColor Yellow
    
    # Verificar se há erros nos logs
    $asteriskContainer = docker ps --filter "name=asterisk" --format "{{.Names}}" | Select-Object -First 1
    if ($asteriskContainer) {
        Write-Host "   Container Asterisk: $asteriskContainer" -ForegroundColor Cyan
        $logs = docker logs $asteriskContainer --tail 5 2>&1
        if ($logs -match "error|failed|ERROR|FAILED") {
            Write-Host "   ⚠️  Erros encontrados nos logs (verifique manualmente)" -ForegroundColor Yellow
        } else {
            Write-Host "   ✅ Logs sem erros aparentes" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "📋 Resumo do Teste:" -ForegroundColor Cyan
    Write-Host "• Para testar WS:  Acesse http://localhost:3000" -ForegroundColor White
    Write-Host "• Para testar WSS: Acesse https://localhost:3000 (aceite certificado)" -ForegroundColor White
    Write-Host "• Logs Asterisk:   docker logs asterisk-clicktocall-wss --follow" -ForegroundColor White
    Write-Host "• Logs completos:  docker-compose logs -f" -ForegroundColor White
}

# Verificar se Docker está rodando
try {
    docker version | Out-Null
} catch {
    Write-Host "❌ Docker não está rodando ou não está instalado!" -ForegroundColor Red
    Write-Host "Inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
    exit 1
}

# Executar ação baseada no modo
switch ($Modo) {
    "ws" { Start-WSMode }
    "wss" { Start-WSSMode }
    "test" { Test-Connectivity }
    "help" { Show-Help }
    default { Show-Help }
}

Write-Host ""
Write-Host "🔗 Links úteis:" -ForegroundColor Cyan
Write-Host "• Documentação: .\docs\WSS-IMPLEMENTATION-GUIDE.md" -ForegroundColor White
Write-Host "• Logs: docker-compose logs -f" -ForegroundColor White
