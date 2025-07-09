#!/bin/bash

echo "🚀 SETUP AMBIENTE DE DESENVOLVIMENTO - Click-to-Call"
echo "====================================================="
echo ""
echo "Este script configurará automaticamente o ambiente de desenvolvimento"
echo "com todas as correções de segurança aplicadas."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Função para reportar status
report_step() {
    echo -e "${BLUE}🔧 EXECUTANDO:${NC} $1"
}

report_success() {
    echo -e "${GREEN}✅ SUCESSO:${NC} $1"
}

report_warning() {
    echo -e "${YELLOW}⚠️  ATENÇÃO:${NC} $1"
}

# =============================================================================
# 1. VERIFICAR PRÉ-REQUISITOS
# =============================================================================
report_step "Verificando pré-requisitos..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado. Instale o Docker primeiro.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não encontrado. Instale o Docker Compose primeiro.${NC}"
    exit 1
fi

report_success "Docker e Docker Compose encontrados"

# =============================================================================
# 2. CONFIGURAR ARQUIVO .ENV
# =============================================================================
if [[ ! -f ".env" ]]; then
    report_step "Criando arquivo .env para desenvolvimento..."
    
    cat > ".env" << 'EOF'
# =============================================================================
# AMBIENTE DE DESENVOLVIMENTO - Click-to-Call
# =============================================================================

# Senhas Asterisk (seguras para desenvolvimento)
AMI_SECRET=dev_ami_secret_2024_secure
AGENT_1001_PASSWORD=dev_agent_password_2024_secure

# IP Externo para desenvolvimento local
EXTERNAL_IP=127.0.0.1

# Node.js API
NODE_ENV=development
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ASTERISK_HOST=localhost
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_AGENT_PASSWORD=dev_agent_password_2024_secure
NEXT_PUBLIC_FORCE_PROTOCOL=wss
EOF

    report_success "Arquivo .env criado com configurações de desenvolvimento"
else
    report_warning "Arquivo .env já existe - não será sobrescrito"
fi

# =============================================================================
# 3. VALIDAR CONFIGURAÇÕES DE SEGURANÇA
# =============================================================================
report_step "Validando configurações de segurança Asterisk..."

if [[ -f "./validate-asterisk-security.sh" ]]; then
    chmod +x ./validate-asterisk-security.sh
    if ./validate-asterisk-security.sh >/dev/null 2>&1; then
        report_success "Todas as configurações de segurança validadas"
    else
        report_warning "Algumas validações falharam - verifique manualmente"
    fi
else
    report_warning "Script de validação não encontrado"
fi

# =============================================================================
# 4. CONSTRUIR E INICIAR CONTAINERS
# =============================================================================
report_step "Construindo e iniciando containers..."

# Parar containers existentes
docker-compose down 2>/dev/null

# Construir containers
if docker-compose build; then
    report_success "Containers construídos com sucesso"
else
    echo -e "${RED}❌ Erro ao construir containers${NC}"
    exit 1
fi

# Iniciar containers
if docker-compose up -d; then
    report_success "Containers iniciados com sucesso"
else
    echo -e "${RED}❌ Erro ao iniciar containers${NC}"
    exit 1
fi

# =============================================================================
# 5. AGUARDAR INICIALIZAÇÃO
# =============================================================================
report_step "Aguardando inicialização dos serviços..."

# Aguardar Asterisk
echo -n "Aguardando Asterisk..."
for i in {1..30}; do
    if docker-compose logs asterisk 2>/dev/null | grep -q "Asterisk Ready"; then
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Aguardar API
echo -n "Aguardando API..."
for i in {1..30}; do
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Aguardar Frontend
echo -n "Aguardando Frontend..."
for i in {1..30}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# =============================================================================
# 6. VERIFICAR STATUS DOS SERVIÇOS
# =============================================================================
report_step "Verificando status dos serviços..."

echo ""
echo "📊 STATUS DOS SERVIÇOS:"
echo "======================="

# Verificar Asterisk
if docker-compose ps asterisk | grep -q "Up"; then
    report_success "Asterisk: Online"
    
    # Verificar WSS
    if docker-compose exec -T asterisk asterisk -rx "http show status" | grep -q "Secure HTTP Server Status.*Enabled"; then
        report_success "WSS (WebSocket Secure): Ativo"
    else
        report_warning "WSS: Status incerto"
    fi
    
    # Verificar PJSIP
    if docker-compose exec -T asterisk asterisk -rx "pjsip show transports" | grep -q "transport-wss"; then
        report_success "PJSIP WSS Transport: Configurado"
    else
        report_warning "PJSIP: Verificar configuração"
    fi
else
    echo -e "${RED}❌ Asterisk: Offline${NC}"
fi

# Verificar API
if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    report_success "API: Online (http://localhost:3001)"
else
    echo -e "${RED}❌ API: Offline${NC}"
fi

# Verificar Frontend
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    report_success "Frontend: Online (http://localhost:3000)"
else
    echo -e "${RED}❌ Frontend: Offline${NC}"
fi

# =============================================================================
# 7. INSTRUÇÕES FINAIS
# =============================================================================
echo ""
echo -e "${GREEN}🎉 AMBIENTE DE DESENVOLVIMENTO CONFIGURADO!${NC}"
echo "=============================================="
echo ""
echo -e "${BLUE}📱 ACESSO AOS SERVIÇOS:${NC}"
echo "   • Frontend: http://localhost:3000"
echo "   • API: http://localhost:3001"
echo "   • Asterisk WSS: wss://localhost:8089/ws"
echo ""
echo -e "${BLUE}🔧 CREDENCIAIS DE DESENVOLVIMENTO:${NC}"
echo "   • Agent: agent-1001"
echo "   • Password: dev_agent_password_2024_secure"
echo ""
echo -e "${BLUE}🐛 COMANDOS ÚTEIS PARA DEBUG:${NC}"
echo "   • Ver logs: docker-compose logs -f [service]"
echo "   • Entrar no Asterisk: docker-compose exec asterisk asterisk -rvvv"
echo "   • Restartar serviço: docker-compose restart [service]"
echo "   • Parar tudo: docker-compose down"
echo ""
echo -e "${BLUE}🔍 VALIDAÇÃO DE SEGURANÇA:${NC}"
echo "   • Executar: ./validate-asterisk-security.sh"
echo ""
echo -e "${YELLOW}⚠️  LEMBRETE PARA PRODUÇÃO:${NC}"
echo "   • Altere EXTERNAL_IP no .env para seu IP público"
echo "   • Use senhas fortes e únicas"
echo "   • Configure SSL/TLS adequado"
echo ""
echo -e "${GREEN}🚀 Pronto para desenvolver!${NC}"