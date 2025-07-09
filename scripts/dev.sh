#!/bin/bash

# Click-to-Call Development Helper Script for WSL2
# Automação para desenvolvimento com melhor performance no WSL2

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para output colorido
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Verificar pré-requisitos
check_prerequisites() {
    print_color $BLUE "🔍 Verificando pré-requisitos..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_color $RED "❌ Docker não encontrado. Instale o Docker."
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_color $RED "❌ Docker Compose não encontrado."
        exit 1
    fi
    
    # Verificar se Docker está rodando
    if ! docker info &> /dev/null; then
        print_color $RED "❌ Docker não está rodando. Inicie o Docker."
        exit 1
    fi
    
    # Verificar Node.js (opcional)
    if ! command -v node &> /dev/null; then
        print_color $YELLOW "⚠️  Node.js não encontrado. Recomendado para desenvolvimento local."
    fi
    
    # Verificar pnpm (opcional)
    if ! command -v pnpm &> /dev/null; then
        print_color $YELLOW "⚠️  pnpm não encontrado. Recomendado para desenvolvimento local."
    fi
    
    print_color $GREEN "✅ Pré-requisitos verificados."
}

# Configurar ambiente
setup_environment() {
    print_color $BLUE "🚀 Configurando ambiente..."
    
    # Criar arquivos .env se não existirem
    create_env_if_missing() {
        local env_file=$1
        local example_file="${env_file}.example"
        
        if [[ ! -f "$env_file" && -f "$example_file" ]]; then
            print_color $YELLOW "📝 Criando $env_file a partir do exemplo..."
            cp "$example_file" "$env_file"
        fi
    }
    
    create_env_if_missing "apps/api/.env"
    create_env_if_missing "apps/web/.env"
    create_env_if_missing ".env"
    
    print_color $YELLOW "⚠️  IMPORTANTE: Configure suas credenciais nos arquivos .env antes de continuar!"
    print_color $BLUE "📁 Arquivos para editar:"
    print_color $BLUE "   - apps/api/.env (Supabase, RD Station, JWT secrets)"
    print_color $BLUE "   - apps/web/.env (URLs públicas)"
    print_color $BLUE "   - .env (TaskMaster AI, se necessário)"
    
    print_color $GREEN "✅ Ambiente configurado. Execute './scripts/dev.sh start' para iniciar os serviços."
}

# Iniciar serviços
start_services() {
    print_color $BLUE "🚀 Iniciando serviços..."
    
    if [[ -n "$SERVICE" ]]; then
        print_color $YELLOW "🔧 Iniciando serviço específico: $SERVICE"
        docker-compose up --build "$SERVICE"
    else
        print_color $YELLOW "🔧 Iniciando todos os serviços..."
        docker-compose up --build -d
        
        print_color $YELLOW "⏳ Aguardando serviços ficarem prontos..."
        sleep 10
        
        show_status
    fi
}

# Parar serviços
stop_services() {
    print_color $BLUE "🛑 Parando serviços..."
    docker-compose down
    print_color $GREEN "✅ Serviços parados."
}

# Reiniciar serviços
restart_services() {
    print_color $BLUE "🔄 Reiniciando serviços..."
    stop_services
    start_services
}

# Mostrar status
show_status() {
    print_color $BLUE "📊 Status dos serviços:"
    docker-compose ps
    
    print_color $BLUE "\n🌐 URLs de acesso:"
    print_color $GREEN "   Frontend: http://localhost:3000"
    print_color $GREEN "   API: http://localhost:3001"
    print_color $GREEN "   Health Check: http://localhost:3001/api/health"
    print_color $GREEN "   Asterisk HTTP: http://localhost:8088"
    print_color $GREEN "   Asterisk WSS: wss://localhost:8089"
    
    # Testar health checks
    print_color $BLUE "\n🔍 Verificando health checks..."
    
    # Teste API
    if curl -s --max-time 5 "http://localhost:3001/api/health" > /dev/null 2>&1; then
        print_color $GREEN "   ✅ API: Ativa"
    else
        print_color $RED "   ❌ API: Não responsiva"
    fi
    
    # Teste Frontend
    if curl -s --max-time 5 "http://localhost:3000" > /dev/null 2>&1; then
        print_color $GREEN "   ✅ Frontend: Ativo"
    else
        print_color $RED "   ❌ Frontend: Não responsivo"
    fi
}

# Mostrar logs
show_logs() {
    print_color $BLUE "📋 Visualizando logs..."
    
    if [[ -n "$SERVICE" ]]; then
        print_color $YELLOW "📋 Logs do serviço: $SERVICE"
        docker-compose logs -f "$SERVICE"
    else
        print_color $YELLOW "📋 Logs de todos os serviços:"
        docker-compose logs -f
    fi
}

# Limpar ambiente
clean_environment() {
    print_color $BLUE "🧹 Limpando ambiente..."
    
    # Parar e remover containers
    docker-compose down -v --remove-orphans
    
    # Remover imagens do projeto
    local images=$(docker images --filter "reference=click-to-call*" -q 2>/dev/null)
    if [[ -n "$images" ]]; then
        print_color $YELLOW "🗑️  Removendo imagens do projeto..."
        docker rmi $images -f
    fi
    
    # Limpar volumes órfãos
    print_color $YELLOW "🗑️  Limpando volumes órfãos..."
    docker volume prune -f
    
    # Limpar redes órfãs
    print_color $YELLOW "🗑️  Limpando redes órfãs..."
    docker network prune -f
    
    print_color $GREEN "✅ Ambiente limpo."
}

# Gerar certificados
generate_certificates() {
    print_color $BLUE "🔐 Gerando certificados TLS..."
    docker-compose --profile tools run --rm cert-generator
    print_color $GREEN "✅ Certificados gerados."
}

# Instalar dependências (funcionalidade adicional para WSL2)
install_dependencies() {
    print_color $BLUE "📦 Instalando dependências..."
    
    if command -v pnpm &> /dev/null; then
        print_color $YELLOW "Usando pnpm..."
        pnpm install
    elif command -v npm &> /dev/null; then
        print_color $YELLOW "Usando npm..."
        npm install
    else
        print_color $RED "❌ Nem pnpm nem npm encontrados!"
        exit 1
    fi
    
    print_color $GREEN "✅ Dependências instaladas."
}

# Função de ajuda
show_help() {
    echo "🎯 Click-to-Call Development Helper (WSL2 Optimized)"
    echo ""
    echo "Uso: ./scripts/dev.sh [ACTION] [SERVICE]"
    echo ""
    echo "Ações disponíveis:"
    echo "  setup      - Configurar ambiente inicial"
    echo "  install    - Instalar dependências Node.js"
    echo "  start      - Iniciar serviços (ou serviço específico)"
    echo "  stop       - Parar serviços"
    echo "  restart    - Reiniciar serviços"
    echo "  status     - Mostrar status dos serviços"
    echo "  logs       - Mostrar logs (ou de serviço específico)"
    echo "  clean      - Limpar ambiente Docker"
    echo "  certs      - Gerar certificados TLS"
    echo ""
    echo "Exemplos:"
    echo "  ./scripts/dev.sh setup"
    echo "  ./scripts/dev.sh install"
    echo "  ./scripts/dev.sh start"
    echo "  ./scripts/dev.sh start api"
    echo "  ./scripts/dev.sh logs asterisk"
    echo "  ./scripts/dev.sh clean"
}

# Função principal
main() {
    local action=${1:-help}
    SERVICE=${2:-}
    
    print_color $BLUE "🎯 Click-to-Call Development Helper (WSL2)"
    print_color $YELLOW "Ação: $action"
    
    case $action in
        "setup")
            check_prerequisites
            setup_environment
            ;;
        "install")
            install_dependencies
            ;;
        "start")
            check_prerequisites
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            check_prerequisites
            restart_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "clean")
            clean_environment
            ;;
        "certs")
            generate_certificates
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Executar função principal
main "$@" 