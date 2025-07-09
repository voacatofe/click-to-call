#!/bin/bash

# Script WSS para configurar WebSocket Secure no Click-to-Call (WSL2)
# Uso: ./scripts/setup-wss.sh [modo]
# Modos: ws, wss, test, help

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

show_help() {
    print_color $CYAN "🔐 Script de Configuração WSS - Click-to-Call (WSL2)"
    echo ""
    print_color $YELLOW "Uso:"
    echo "  ./scripts/setup-wss.sh ws      # Modo desenvolvimento (WS apenas)"
    echo "  ./scripts/setup-wss.sh wss     # Modo produção (WS + WSS)"
    echo "  ./scripts/setup-wss.sh test    # Testar conectividade"
    echo "  ./scripts/setup-wss.sh help    # Mostrar esta ajuda"
    echo ""
    print_color $GREEN "Exemplos:"
    echo "  # Iniciar apenas com WS para desenvolvimento rápido"
    echo "  ./scripts/setup-wss.sh ws"
    echo ""
    echo "  # Iniciar com WS + WSS para testar produção"
    echo "  ./scripts/setup-wss.sh wss"
    echo ""
    echo "  # Testar se ambos protocolos estão funcionando"
    echo "  ./scripts/setup-wss.sh test"
}

start_ws_mode() {
    print_color $GREEN "🚀 Iniciando modo WS (desenvolvimento)..."
    
    # Parar containers atuais
    print_color $YELLOW "Parando containers atuais..."
    docker-compose down -v || true
    
    # Iniciar com configuração WS
    print_color $YELLOW "Iniciando containers com WS..."
    docker-compose up -d
    
    # Aguardar containers ficarem saudáveis
    print_color $YELLOW "Aguardando containers ficarem saudáveis..."
    sleep 10
    
    # Verificar status
    print_color $CYAN "Status dos containers:"
    docker-compose ps
    
    echo ""
    print_color $GREEN "✅ Modo WS iniciado!"
    print_color $CYAN "🌐 Frontend: http://localhost:3000"
    print_color $CYAN "🔗 WebSocket: ws://localhost:8088/ws"
    echo ""
    print_color $YELLOW "Para testar: ./scripts/setup-wss.sh test"
}

start_wss_mode() {
    print_color $GREEN "🔐 Iniciando modo WSS (produção)..."
    
    # Parar containers atuais
    print_color $YELLOW "Parando containers atuais..."
    docker-compose down -v || true
    docker-compose -f docker-compose-wss.yml down -v || true
    
    # Verificar se arquivo WSS existe
    if [[ ! -f "docker-compose-wss.yml" ]]; then
        print_color $RED "❌ Arquivo docker-compose-wss.yml não encontrado!"
        print_color $YELLOW "Usando configuração padrão..."
        docker-compose up -d
    else
        # Iniciar com configuração WSS
        print_color $YELLOW "Iniciando containers com WSS..."
        docker-compose -f docker-compose-wss.yml up -d
    fi
    
    # Aguardar containers ficarem saudáveis
    print_color $YELLOW "Aguardando containers e geração de certificados..."
    sleep 20
    
    # Verificar status
    print_color $CYAN "Status dos containers:"
    if [[ -f "docker-compose-wss.yml" ]]; then
        docker-compose -f docker-compose-wss.yml ps
    else
        docker-compose ps
    fi
    
    # Verificar certificados
    echo ""
    print_color $CYAN "Verificando certificados..."
    docker exec asterisk-clicktocall-wss ls -la /etc/asterisk/keys/ 2>/dev/null || \
    docker exec click-to-call-asterisk-1 ls -la /etc/asterisk/keys/ 2>/dev/null || \
    print_color $YELLOW "⚠️  Container Asterisk não encontrado ou certificados não localizados"
    
    echo ""
    print_color $GREEN "✅ Modo WSS iniciado!"
    print_color $CYAN "🌐 Frontend: http://localhost:3000 (WS) ou https://localhost:3000 (WSS)"
    print_color $CYAN "🔗 WebSocket: ws://localhost:8088/ws"
    print_color $CYAN "🔐 WebSocket Secure: wss://localhost:8089/ws"
    echo ""
    print_color $YELLOW "⚠️  Para HTTPS, aceite o certificado auto-assinado no navegador"
    print_color $YELLOW "Para testar: ./scripts/setup-wss.sh test"
}

test_connectivity() {
    print_color $CYAN "🧪 Testando conectividade..."
    echo ""
    
    # Testar containers
    print_color $YELLOW "1. Verificando containers..."
    local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "clicktocall|asterisk" || true)
    if [[ -n "$containers" ]]; then
        echo "$containers" | while read line; do
            print_color $GREEN "   $line"
        done
    else
        print_color $RED "   ❌ Nenhum container encontrado"
        return 1
    fi
    
    echo ""
    print_color $YELLOW "2. Testando conectividade HTTP..."
    if curl -s --max-time 5 "http://localhost:3000" > /dev/null 2>&1; then
        print_color $GREEN "   ✅ HTTP (localhost:3000): Disponível"
    else
        print_color $RED "   ❌ HTTP não disponível"
    fi
    
    echo ""
    print_color $YELLOW "3. Testando API..."
    if curl -s --max-time 5 "http://localhost:3001/health" > /dev/null 2>&1; then
        print_color $GREEN "   ✅ API (localhost:3001): Disponível"
    else
        print_color $RED "   ❌ API não disponível"
    fi
    
    echo ""
    print_color $YELLOW "4. Verificando portas WebSocket..."
    
    # Testar porta WS (8088)
    if nc -z localhost 8088 2>/dev/null; then
        print_color $GREEN "   ✅ WS (localhost:8088): Porta aberta"
    else
        print_color $RED "   ❌ WS (localhost:8088): Porta fechada"
    fi
    
    # Testar porta WSS (8089)
    if nc -z localhost 8089 2>/dev/null; then
        print_color $GREEN "   ✅ WSS (localhost:8089): Porta aberta"
    else
        print_color $YELLOW "   ⚠️  WSS (localhost:8089): Porta fechada (normal se usando modo WS)"
    fi
    
    echo ""
    print_color $YELLOW "5. Verificando logs recentes..."
    
    # Verificar se há erros nos logs
    local asterisk_container=$(docker ps --filter "name=asterisk" --format "{{.Names}}" | head -1)
    if [[ -n "$asterisk_container" ]]; then
        print_color $CYAN "   Container Asterisk: $asterisk_container"
        local logs=$(docker logs "$asterisk_container" --tail 5 2>&1)
        if echo "$logs" | grep -iq "error\|failed\|ERROR\|FAILED"; then
            print_color $YELLOW "   ⚠️  Erros encontrados nos logs (verifique manualmente)"
        else
            print_color $GREEN "   ✅ Logs sem erros aparentes"
        fi
    fi
    
    echo ""
    print_color $CYAN "📋 Resumo do Teste:"
    echo "• Para testar WS:  Acesse http://localhost:3000"
    echo "• Para testar WSS: Acesse https://localhost:3000 (aceite certificado)"
    echo "• Logs Asterisk:   docker logs \$ASTERISK_CONTAINER --follow"
    echo "• Logs completos:  docker-compose logs -f"
}

# Verificar se Docker está rodando
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_color $RED "❌ Docker não está instalado!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_color $RED "❌ Docker não está rodando!"
        print_color $YELLOW "Inicie o Docker e tente novamente."
        exit 1
    fi
}

# Função principal
main() {
    local modo=${1:-help}
    
    check_docker
    
    case $modo in
        "ws")
            start_ws_mode
            ;;
        "wss")
            start_wss_mode
            ;;
        "test")
            test_connectivity
            ;;
        "help"|*)
            show_help
            ;;
    esac
    
    echo ""
    print_color $CYAN "🔗 Links úteis:"
    echo "• Documentação: ./docs/WSS-IMPLEMENTATION-GUIDE.md"
    echo "• Logs: docker-compose logs -f"
    echo "• Status: ./scripts/dev.sh status"
}

# Executar função principal
main "$@" 