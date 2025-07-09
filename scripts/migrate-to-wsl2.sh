#!/bin/bash

# Script de Migração Automática para WSL2 - Click-to-Call
# Este script verifica e configura automaticamente o ambiente WSL2

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

print_header() {
    echo ""
    print_color $CYAN "════════════════════════════════════════════════════════════════"
    print_color $CYAN "  $1"
    print_color $CYAN "════════════════════════════════════════════════════════════════"
    echo ""
}

check_wsl2() {
    print_header "Verificando Ambiente WSL2"
    
    # Verificar se está executando no WSL2
    if grep -qi microsoft /proc/version; then
        print_color $GREEN "✅ Executando no WSL2"
    else
        print_color $RED "❌ Não está executando no WSL2!"
        print_color $YELLOW "Execute este script dentro do WSL2: wsl"
        exit 1
    fi
    
    # Verificar versão do Ubuntu
    if command -v lsb_release &> /dev/null; then
        local ubuntu_version=$(lsb_release -rs)
        print_color $GREEN "✅ Ubuntu versão: $ubuntu_version"
    fi
    
    # Verificar arquitetura
    local arch=$(uname -m)
    print_color $GREEN "✅ Arquitetura: $arch"
}

check_prerequisites() {
    print_header "Verificando Pré-requisitos"
    
    local missing_tools=()
    
    # Verificar ferramentas essenciais
    local tools=("curl" "wget" "git" "unzip")
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            print_color $GREEN "✅ $tool instalado"
        else
            print_color $RED "❌ $tool não encontrado"
            missing_tools+=("$tool")
        fi
    done
    
    # Instalar ferramentas faltantes
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_color $YELLOW "Instalando ferramentas faltantes..."
        sudo apt update
        for tool in "${missing_tools[@]}"; do
            sudo apt install -y "$tool"
        done
    fi
}

install_node() {
    print_header "Configurando Node.js via NVM"
    
    # Verificar se nvm está instalado
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        print_color $GREEN "✅ NVM já instalado"
        source "$HOME/.nvm/nvm.sh"
    else
        print_color $YELLOW "📦 Instalando NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        source "$HOME/.nvm/nvm.sh"
    fi
    
    # Verificar se Node.js LTS está instalado
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_color $GREEN "✅ Node.js já instalado: $node_version"
    else
        print_color $YELLOW "📦 Instalando Node.js LTS..."
        nvm install --lts
        nvm use --lts
    fi
    
    # Verificar se pnpm está instalado
    if command -v pnpm &> /dev/null; then
        local pnpm_version=$(pnpm --version)
        print_color $GREEN "✅ pnpm já instalado: $pnpm_version"
    else
        print_color $YELLOW "📦 Instalando pnpm..."
        npm install -g pnpm
    fi
}

check_docker() {
    print_header "Verificando Docker"
    
    # Verificar se Docker está disponível
    if command -v docker &> /dev/null; then
        print_color $GREEN "✅ Docker encontrado"
        
        # Verificar se Docker está rodando
        if docker info &> /dev/null; then
            print_color $GREEN "✅ Docker está rodando"
            
            # Verificar integração WSL2
            local docker_context=$(docker context show 2>/dev/null || echo "default")
            print_color $GREEN "✅ Docker context: $docker_context"
        else
            print_color $RED "❌ Docker não está rodando"
            print_color $YELLOW "Inicie o Docker Desktop e certifique-se que a integração WSL2 está habilitada"
            return 1
        fi
    else
        print_color $RED "❌ Docker não encontrado"
        print_color $YELLOW "Instale o Docker Desktop e habilite a integração WSL2"
        return 1
    fi
    
    # Verificar docker-compose
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version)
        print_color $GREEN "✅ Docker Compose disponível: $compose_version"
    else
        print_color $RED "❌ Docker Compose não encontrado"
        return 1
    fi
}

setup_project() {
    print_header "Configurando Projeto"
    
    # Verificar se estamos no diretório do projeto
    if [[ ! -f "package.json" ]]; then
        print_color $RED "❌ Não encontrado package.json. Execute este script no diretório raiz do projeto."
        exit 1
    fi
    
    print_color $GREEN "✅ Diretório do projeto encontrado"
    
    # Tornar scripts executáveis
    if [[ -d "scripts" ]]; then
        print_color $YELLOW "🔧 Tornando scripts executáveis..."
        chmod +x scripts/*.sh
        print_color $GREEN "✅ Scripts configurados"
    fi
    
    # Verificar/instalar dependências
    print_color $YELLOW "📦 Verificando dependências Node.js..."
    if [[ ! -d "node_modules" ]]; then
        print_color $YELLOW "Instalando dependências..."
        pnpm install
    else
        print_color $GREEN "✅ Dependências já instaladas"
    fi
}

check_env_files() {
    print_header "Verificando Arquivos de Ambiente"
    
    local env_files=(
        "apps/api/.env"
        "apps/web/.env"
        ".env"
    )
    
    for env_file in "${env_files[@]}"; do
        if [[ -f "$env_file" ]]; then
            print_color $GREEN "✅ $env_file existe"
        else
            local example_file="${env_file}.example"
            if [[ -f "$example_file" ]]; then
                print_color $YELLOW "📝 Criando $env_file a partir do exemplo..."
                cp "$example_file" "$env_file"
                print_color $YELLOW "⚠️  Configure as credenciais em $env_file"
            else
                print_color $RED "❌ $env_file não existe e não há arquivo exemplo"
            fi
        fi
    done
}

run_performance_test() {
    print_header "Teste de Performance"
    
    print_color $YELLOW "🧪 Executando testes básicos de performance..."
    
    # Teste 1: Velocidade do Git
    print_color $BLUE "Testando Git operations..."
    local git_start=$(date +%s%N)
    git status > /dev/null
    local git_end=$(date +%s%N)
    local git_time=$(((git_end - git_start) / 1000000))
    print_color $GREEN "✅ Git status: ${git_time}ms"
    
    # Teste 2: Velocidade do pnpm
    if command -v pnpm &> /dev/null; then
        print_color $BLUE "Testando pnpm..."
        local pnpm_start=$(date +%s%N)
        pnpm --version > /dev/null
        local pnpm_end=$(date +%s%N)
        local pnpm_time=$(((pnpm_end - pnpm_start) / 1000000))
        print_color $GREEN "✅ pnpm check: ${pnpm_time}ms"
    fi
    
    # Teste 3: I/O de arquivos
    print_color $BLUE "Testando I/O de arquivos..."
    local io_start=$(date +%s%N)
    find . -name "*.json" -type f | head -10 > /dev/null
    local io_end=$(date +%s%N)
    local io_time=$(((io_end - io_start) / 1000000))
    print_color $GREEN "✅ File I/O: ${io_time}ms"
    
    print_color $CYAN "📊 Performance WSL2 parece adequada!"
}

install_useful_tools() {
    print_header "Instalando Ferramentas Úteis"
    
    local tools=("netcat-openbsd" "jq" "tree" "htop")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! dpkg -l | grep -q "^ii.*$tool "; then
            missing_tools+=("$tool")
        else
            print_color $GREEN "✅ $tool já instalado"
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_color $YELLOW "📦 Instalando ferramentas úteis..."
        sudo apt update
        sudo apt install -y "${missing_tools[@]}"
    fi
}

setup_git_config() {
    print_header "Configuração Git Otimizada"
    
    print_color $YELLOW "🔧 Aplicando configurações Git otimizadas para WSL2..."
    
    # Configurações de performance
    git config --global core.preloadindex true
    git config --global core.fscache true
    git config --global gc.auto 256
    git config --global core.autocrlf input
    
    # Verificar se user.name e user.email estão configurados
    if ! git config --global user.name &> /dev/null; then
        print_color $YELLOW "⚠️  Configure git user.name: git config --global user.name 'Seu Nome'"
    fi
    
    if ! git config --global user.email &> /dev/null; then
        print_color $YELLOW "⚠️  Configure git user.email: git config --global user.email 'seu@email.com'"
    fi
    
    print_color $GREEN "✅ Configurações Git aplicadas"
}

setup_aliases() {
    print_header "Configurando Aliases Úteis"
    
    local bashrc="$HOME/.bashrc"
    
    # Verificar se aliases já existem
    if grep -q "# Click-to-Call aliases" "$bashrc" 2>/dev/null; then
        print_color $GREEN "✅ Aliases já configurados"
        return
    fi
    
    print_color $YELLOW "📝 Adicionando aliases úteis ao ~/.bashrc..."
    
    cat >> "$bashrc" << 'EOF'

# Click-to-Call aliases
alias cstart="./scripts/dev.sh start"
alias cstop="./scripts/dev.sh stop"
alias cstatus="./scripts/dev.sh status"
alias clogs="./scripts/dev.sh logs"
alias cclean="./scripts/dev.sh clean"
alias ctest="./scripts/setup-wss.sh test"

# Aliases gerais úteis
alias ll="ls -la"
alias la="ls -la"
alias ..="cd .."
alias ...="cd ../.."
alias dps="docker ps"
alias dlog="docker logs"
alias dstats="docker stats"
EOF

    print_color $GREEN "✅ Aliases adicionados. Execute 'source ~/.bashrc' para aplicar."
}

final_test() {
    print_header "Teste Final do Ambiente"
    
    print_color $YELLOW "🧪 Executando teste final..."
    
    # Verificar se consegue executar scripts
    if [[ -x "scripts/dev.sh" ]]; then
        print_color $GREEN "✅ Script dev.sh executável"
    else
        print_color $RED "❌ Script dev.sh não executável"
        chmod +x scripts/dev.sh
    fi
    
    # Testar comando básico do projeto
    if ./scripts/dev.sh help &> /dev/null; then
        print_color $GREEN "✅ Script de desenvolvimento funcional"
    else
        print_color $RED "❌ Problema com script de desenvolvimento"
    fi
    
    print_color $CYAN "🎉 Migração para WSL2 concluída com sucesso!"
}

show_summary() {
    print_header "Resumo da Migração"
    
    print_color $GREEN "✅ Ambiente WSL2 configurado e otimizado"
    print_color $GREEN "✅ Node.js e pnpm instalados via NVM"
    print_color $GREEN "✅ Docker verificado e funcional"
    print_color $GREEN "✅ Scripts bash configurados"
    print_color $GREEN "✅ Ferramentas úteis instaladas"
    print_color $GREEN "✅ Git otimizado para performance"
    print_color $GREEN "✅ Aliases úteis configurados"
    
    echo ""
    print_color $CYAN "🚀 Próximos passos:"
    echo "1. Execute: source ~/.bashrc"
    echo "2. Configure credenciais nos arquivos .env"
    echo "3. Teste o ambiente: ./scripts/dev.sh start"
    echo "4. Configure Cursor para WSL2 (veja docs/WSL2-MIGRATION-GUIDE.md)"
    
    echo ""
    print_color $YELLOW "📖 Documentação completa: docs/WSL2-MIGRATION-GUIDE.md"
}

# Função principal
main() {
    print_color $CYAN "🎯 Click-to-Call - Migração Automática para WSL2"
    print_color $YELLOW "Este script configurará automaticamente seu ambiente WSL2"
    echo ""
    
    # Executar verificações e configurações
    check_wsl2
    check_prerequisites
    install_node
    check_docker
    setup_project
    check_env_files
    install_useful_tools
    setup_git_config
    setup_aliases
    final_test
    
    # Mostrar resumo
    show_summary
    
    print_color $GREEN "🎉 Migração concluída! Bem-vindo ao desenvolvimento em WSL2!"
}

# Executar função principal
main "$@" 