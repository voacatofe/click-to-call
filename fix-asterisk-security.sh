#!/bin/bash

echo "🔧 APLICANDO CORREÇÕES DE SEGURANÇA ASTERISK"
echo "=============================================="
echo ""
echo "⚠️  ESTE SCRIPT APLICARÁ CORREÇÕES BASEADAS NA DOCUMENTAÇÃO OFICIAL"
echo "⚠️  BACKUP DOS ARQUIVOS SERÁ CRIADO AUTOMATICAMENTE"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Função para criar backup
create_backup() {
    local file=$1
    if [[ -f "$file" ]]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${BLUE}📋 Backup criado:${NC} ${file}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
}

# Função para aplicar correção
apply_fix() {
    echo -e "${GREEN}✅ APLICANDO:${NC} $1"
}

echo -e "${YELLOW}🎯 INICIANDO CORREÇÕES CRÍTICAS...${NC}"
echo ""

# =============================================================================
# 1. CORRIGIR ARQUIVO RTP.CONF (CRÍTICO)
# =============================================================================
echo -e "${BLUE}🔧 Corrigindo configurações RTP...${NC}"
RTP_FILE="asterisk/etc/rtp.conf"

if [[ -f "$RTP_FILE" ]]; then
    create_backup "$RTP_FILE"
    
    apply_fix "Expandindo range RTP de 100 para 10.000 portas"
    
    cat > "$RTP_FILE" << 'EOF'
[general]
; CORRIGIDO: Range expandido para evitar falhas "488 Not Acceptable Here"
rtpstart=10000
rtpend=20000
; ICE support para WebRTC
icesupport=yes
stunaddr=stun:stun.l.google.com:19302
; Configurações de segurança adicionais
strictrtp=yes
rtpchecksums=yes
; Habilitar reuso de portas para prevenir problemas de binding RTCP
rtpreuseenable=yes
EOF
    
    echo -e "${GREEN}✅ rtp.conf atualizado com range 10000-20000${NC}"
else
    echo -e "${RED}❌ Arquivo rtp.conf não encontrado${NC}"
fi

# =============================================================================
# 2. CORRIGIR ARQUIVO MANAGER.CONF (CRÍTICO)
# =============================================================================
echo ""
echo -e "${BLUE}🔧 Corrigindo configurações AMI...${NC}"
MANAGER_FILE="asterisk/etc/manager.conf"

if [[ -f "$MANAGER_FILE" ]]; then
    create_backup "$MANAGER_FILE"
    
    apply_fix "Removendo permissão 'command' perigosa do AMI"
    
    cat > "$MANAGER_FILE" << 'EOF'
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1
displayconnects = no
; ADICIONADO: Configurações de segurança
httptimeout = 60
authtimeout = 30
authlimit = 50

[admin]
secret = ${AMI_SECRET:-changeme_update_this}
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.255
permit=172.16.0.0/255.240.0.0
; CORRIGIDO: Removida permissão 'command' por segurança
read = system,call,log,verbose,dtmf,reporting,cdr
write = system,call,log,verbose,dtmf,reporting,cdr
EOF
    
    echo -e "${GREEN}✅ manager.conf atualizado - permissão 'command' removida${NC}"
else
    echo -e "${RED}❌ Arquivo manager.conf não encontrado${NC}"
fi

# =============================================================================
# 3. CORRIGIR ARQUIVO PJSIP-UNIFIED.CONF (CRÍTICO)
# =============================================================================
echo ""
echo -e "${BLUE}🔧 Corrigindo configurações PJSIP...${NC}"
PJSIP_FILE="asterisk/etc/pjsip-unified.conf"

if [[ -f "$PJSIP_FILE" ]]; then
    create_backup "$PJSIP_FILE"
    
    apply_fix "Corrigindo certificados DTLS e configurações WebRTC"
    
    cat > "$PJSIP_FILE" << 'EOF'
;============================ TRANSPORTE WSS SEGURO ============================
[transport-wss]
type=transport
protocol=wss
bind=127.0.0.1:8089
; Certificados para WSS
cert_file=/etc/asterisk/keys/asterisk.crt
priv_key_file=/etc/asterisk/keys/asterisk.key
; ADICIONADO: Configurações de segurança TLS
method=tlsv1_2
cipher=ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256
; CORRIGIDO: External addresses para variáveis de ambiente
external_media_address=${EXTERNAL_IP:-127.0.0.1}
external_signaling_address=${EXTERNAL_IP:-127.0.0.1}

;============================ ENDPOINT WSS SEGURO ============================
; AOR compartilhado para WSS
[agent-1001]
type=aor
max_contacts=10  ; Permitir múltiplas conexões WSS
remove_existing=yes

; Auth compartilhado
[agent-1001]
type=auth
auth_type=userpass
username=agent-1001
password=${AGENT_1001_PASSWORD:-changeme_update_this}

; Endpoint para WSS (produção segura)
[agent-1001-wss]
type=endpoint
aors=agent-1001
auth=agent-1001
transport=transport-wss
context=from-internal
; Configuração completa WebRTC com DTLS SEGURO
webrtc=yes
use_avpf=yes
media_encryption=dtls
dtls_verify=fingerprint
dtls_setup=actpass
; CORRIGIDO: Usar certificados reais ao invés de auto-gerados
dtls_cert_file=/etc/asterisk/keys/asterisk.crt
dtls_private_key=/etc/asterisk/keys/asterisk.key
dtls_ca_file=/etc/asterisk/keys/asterisk.crt
; ADICIONADO: Suporte ICE obrigatório para NAT
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes
disallow=all
allow=opus,ulaw,alaw
rtp_symmetric=yes
force_rport=yes
direct_media=no
timers=yes
timers_min_se=90
timers_sess_expires=1800
; ADICIONADO: Proteção contra DoS DTLS
dtls_rekey=300
EOF
    
    echo -e "${GREEN}✅ pjsip-unified.conf atualizado com configurações seguras${NC}"
else
    echo -e "${RED}❌ Arquivo pjsip-unified.conf não encontrado${NC}"
fi

# =============================================================================
# 4. CORRIGIR ARQUIVO HTTP-WSS.CONF (MELHORIAS)
# =============================================================================
echo ""
echo -e "${BLUE}🔧 Melhorando configurações HTTP/WSS...${NC}"
HTTP_FILE="asterisk/etc/http-wss.conf"

if [[ -f "$HTTP_FILE" ]]; then
    create_backup "$HTTP_FILE"
    
    apply_fix "Adicionando configurações de segurança HTTP/WSS"
    
    cat > "$HTTP_FILE" << 'EOF'
[general]
enabled=yes
bindaddr=127.0.0.1
bindport=8088
; ADICIONADO: Configurações de segurança
enablestatic=no
sessionlimit=100
; TLS/WSS Configuration (OBRIGATÓRIO)
tlsenable=yes
tlsbindaddr=127.0.0.1:8089
tlscertfile=/etc/asterisk/keys/asterisk.crt
tlsprivatekey=/etc/asterisk/keys/asterisk.key
; ADICIONADO: Cipher adequado para segurança
tlscipher=ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256
EOF
    
    echo -e "${GREEN}✅ http-wss.conf atualizado com configurações de segurança${NC}"
else
    echo -e "${RED}❌ Arquivo http-wss.conf não encontrado${NC}"
fi

# =============================================================================
# 5. CRIAR ARQUIVO .ENV.EXAMPLE ATUALIZADO
# =============================================================================
echo ""
echo -e "${BLUE}🔧 Atualizando arquivo .env.example...${NC}"

cat > ".env.example" << 'EOF'
# =============================================================================
# CONFIGURAÇÃO DE SEGURANÇA ASTERISK - VARIÁVEIS CRÍTICAS
# =============================================================================

# Senhas Asterisk (OBRIGATÓRIO alterar em produção)
AMI_SECRET=your_secure_ami_password_here
AGENT_1001_PASSWORD=your_secure_agent_password_here

# IP Externo para NAT (CRÍTICO para conectividade)
# ALTERAR localhost para IP público real em produção
EXTERNAL_IP=127.0.0.1

# Node.js API
NODE_ENV=development
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ASTERISK_HOST=localhost
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_AGENT_PASSWORD=your_secure_agent_password_here
NEXT_PUBLIC_FORCE_PROTOCOL=wss

# =============================================================================
# INSTRUÇÕES DE SEGURANÇA
# =============================================================================
# 1. ALTERE todas as senhas padrão
# 2. Configure EXTERNAL_IP com seu IP público real
# 3. Use senhas fortes (mínimo 16 caracteres)
# 4. Nunca commite este arquivo com senhas reais
EOF

echo -e "${GREEN}✅ .env.example atualizado com configurações de segurança${NC}"

# =============================================================================
# RESUMO DAS CORREÇÕES
# =============================================================================
echo ""
echo -e "${YELLOW}📋 RESUMO DAS CORREÇÕES APLICADAS:${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ RTP Configuration:${NC}"
echo "   • Range expandido: 5000-5100 → 10000-20000 (10.000 portas)"
echo "   • Adicionado: strictrtp=yes, rtpchecksums=yes"
echo "   • Adicionado: rtpreuseenable=yes (previne problemas RTCP)"
echo ""
echo -e "${GREEN}✅ AMI Security:${NC}"
echo "   • Removida permissão 'command' perigosa"
echo "   • Adicionados timeouts de segurança"
echo "   • Limitações de autenticação configuradas"
echo ""
echo -e "${GREEN}✅ PJSIP WebRTC:${NC}"
echo "   • Removido dtls_auto_generate_cert=yes"
echo "   • Configurados certificados DTLS adequados"
echo "   • Adicionado ice_support=yes"
echo "   • Configurado method=tlsv1_2 e ciphers seguros"
echo "   • Adicionado dtls_rekey=300 (proteção DoS)"
echo ""
echo -e "${GREEN}✅ HTTP/WSS Security:${NC}"
echo "   • Adicionado enablestatic=no"
echo "   • Configurado sessionlimit=100"
echo "   • Ciphers TLS específicos configurados"
echo ""

# =============================================================================
# PRÓXIMOS PASSOS
# =============================================================================
echo -e "${YELLOW}🎯 PRÓXIMOS PASSOS OBRIGATÓRIOS:${NC}"
echo "=================================="
echo ""
echo -e "${RED}🔥 URGENTE:${NC}"
echo "1. Copie .env.example para .env"
echo "2. Configure EXTERNAL_IP com seu IP público real"
echo "3. Altere todas as senhas padrão"
echo "4. Reinicie o container Asterisk"
echo ""
echo -e "${BLUE}📝 Comandos sugeridos:${NC}"
echo "   cp .env.example .env"
echo "   nano .env  # Editar configurações"
echo "   docker-compose restart asterisk"
echo ""
echo -e "${GREEN}✅ RESULTADO ESPERADO:${NC}"
echo "• Fim das falhas '488 Not Acceptable Here'"
echo "• Conexões WebRTC mais estáveis"
echo "• Segurança AMI aprimorada"
echo "• Conformidade com documentação oficial Asterisk"
echo ""
echo -e "${YELLOW}🔗 Para validar as correções, execute:${NC}"
echo "   ./validate-asterisk-security.sh"
echo ""