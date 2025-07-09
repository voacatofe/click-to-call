#!/bin/bash

echo "🔍 VALIDAÇÃO DE SEGURANÇA ASTERISK - Análise de Inconsistências"
echo "=================================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Função para reportar problemas
report_issue() {
    echo -e "${RED}❌ PROBLEMA:${NC} $1"
    ((ISSUES_FOUND++))
}

report_warning() {
    echo -e "${YELLOW}⚠️  ATENÇÃO:${NC} $1"
}

report_ok() {
    echo -e "${GREEN}✅ OK:${NC} $1"
}

echo ""
echo "🎯 VALIDANDO CONFIGURAÇÕES PJSIP ESPECÍFICAS..."
echo "==============================================="

# 1. Verificar dtls_auto_generate_cert (CRÍTICO)
if grep -q "dtls_auto_generate_cert=yes" asterisk/etc/pjsip-unified.conf 2>/dev/null; then
    report_issue "dtls_auto_generate_cert=yes encontrado - certificados auto-gerados são inseguros"
    echo "   📋 Solução: Usar certificados reais com dtls_cert_file=/etc/asterisk/keys/asterisk.crt"
else
    report_ok "Não encontrado dtls_auto_generate_cert=yes"
fi

# 2. Verificar ice_support
if grep -q "ice_support=yes" asterisk/etc/pjsip-unified.conf 2>/dev/null; then
    report_ok "ice_support habilitado"
else
    report_issue "ice_support=yes ausente - necessário para conectividade NAT adequada"
fi

# 3. Verificar external_*_address
if grep -q "external.*address=localhost" asterisk/etc/pjsip-unified.conf 2>/dev/null; then
    report_issue "external_*_address=localhost inválido para produção"
    echo "   📋 Solução: Usar IP público real ou variável de ambiente"
else
    report_ok "Configuração external_*_address parece adequada"
fi

# 4. Verificar method=tlsv1_2 no transport
if grep -q "method=tlsv1_2" asterisk/etc/pjsip-unified.conf 2>/dev/null; then
    report_ok "TLS method configurado"
else
    report_warning "method=tlsv1_2 não encontrado - recomendado para segurança"
fi

echo ""
echo "🎯 VALIDANDO CONFIGURAÇÕES RTP..."
echo "==================================="

# 5. Verificar range de portas RTP
RTP_START=$(grep "rtpstart=" asterisk/etc/rtp.conf 2>/dev/null | cut -d'=' -f2)
RTP_END=$(grep "rtpend=" asterisk/etc/rtp.conf 2>/dev/null | cut -d'=' -f2)

if [[ -n "$RTP_START" && -n "$RTP_END" ]]; then
    RTP_RANGE=$((RTP_END - RTP_START))
    if [[ $RTP_RANGE -lt 1000 ]]; then
        report_issue "Range RTP muito pequeno ($RTP_RANGE portas) - mínimo 1000 recomendado"
        echo "   📋 Causa: falhas 'No route to destination' e '488 Not Acceptable Here'"
        echo "   📋 Solução: rtpstart=10000, rtpend=20000"
    else
        report_ok "Range RTP adequado ($RTP_RANGE portas)"
    fi
else
    report_warning "Não foi possível determinar range RTP"
fi

# 6. Verificar strictrtp
if grep -q "strictrtp=yes" asterisk/etc/rtp.conf 2>/dev/null; then
    report_ok "strictrtp habilitado"
else
    report_warning "strictrtp=yes recomendado para segurança"
fi

echo ""
echo "🎯 VALIDANDO CONFIGURAÇÕES HTTP/WSS..."
echo "======================================="

# 7. Verificar cipher TLS
if grep -q "tlscipher=" asterisk/etc/http-wss.conf 2>/dev/null; then
    report_ok "TLS cipher configurado"
else
    report_warning "tlscipher não especificado - usar ciphers seguros recomendado"
fi

# 8. Verificar enablestatic
if grep -q "enablestatic=no" asterisk/etc/http-wss.conf 2>/dev/null; then
    report_ok "enablestatic=no configurado"
else
    report_warning "enablestatic=no recomendado para segurança"
fi

# 9. Verificar sessionlimit
if grep -q "sessionlimit=" asterisk/etc/http-wss.conf 2>/dev/null; then
    report_ok "sessionlimit configurado"
else
    report_warning "sessionlimit recomendado para prevenir DoS"
fi

echo ""
echo "🎯 VALIDANDO CONFIGURAÇÕES AMI..."
echo "==================================="

# 10. Verificar permissão 'command' perigosa (somente em linhas ativas)
if grep -E "^(read|write).*command" asterisk/etc/manager.conf 2>/dev/null; then
    report_issue "Permissão 'command' encontrada no AMI - permite execução de comandos shell"
    echo "   📋 Risco: Execução remota de comandos no sistema"
    echo "   📋 Solução: Remover 'command' das permissões read/write"
else
    report_ok "Permissão 'command' não encontrada no AMI"
fi

# 11. Verificar timeout configurations
if grep -q "authtimeout\|httptimeout" asterisk/etc/manager.conf 2>/dev/null; then
    report_ok "Timeouts AMI configurados"
else
    report_warning "Configurar timeouts AMI recomendado (authtimeout, httptimeout)"
fi

echo ""
echo "🎯 VALIDANDO PROBLEMAS CONHECIDOS DO ASTERISK..."
echo "================================================="

# 12. Verificar configurações específicas para prevenir falhas conhecidas
if grep -q "rtcp_mux=yes" asterisk/etc/pjsip-unified.conf 2>/dev/null; then
    report_ok "rtcp_mux habilitado"
else
    report_warning "rtcp_mux=yes recomendado para WebRTC"
fi

# 13. Verificar dtls_rekey para proteção DoS
if grep -q "dtls_rekey=" asterisk/etc/pjsip-unified.conf 2>/dev/null; then
    report_ok "dtls_rekey configurado (proteção DoS)"
else
    report_warning "dtls_rekey recomendado para proteção contra DTLS DoS"
fi

# 14. Verificar configuração webrtc=yes
if grep -q "webrtc=yes" asterisk/etc/pjsip-unified.conf 2>/dev/null; then
    report_ok "webrtc=yes encontrado"
else
    report_warning "webrtc=yes não encontrado - necessário para endpoints WebRTC"
fi

echo ""
echo "🎯 VALIDANDO CONFIGURAÇÕES DE CERTIFICADOS..."
echo "=============================================="

# 15. Verificar se certificados estão sendo usados adequadamente
CERT_FILES_PJSIP=$(grep -c "dtls_cert_file\|dtls_private_key" asterisk/etc/pjsip-unified.conf 2>/dev/null || echo "0")
if [[ $CERT_FILES_PJSIP -gt 0 ]]; then
    report_ok "Certificados DTLS configurados no PJSIP"
else
    report_issue "Certificados DTLS não configurados adequadamente no PJSIP"
fi

# 16. Verificar certificados HTTP/WSS
CERT_FILES_HTTP=$(grep -c "tlscertfile\|tlsprivatekey" asterisk/etc/http-wss.conf 2>/dev/null || echo "0")
if [[ $CERT_FILES_HTTP -gt 0 ]]; then
    report_ok "Certificados TLS configurados no HTTP"
else
    report_issue "Certificados TLS não configurados adequadamente no HTTP"
fi

echo ""
echo "🎯 RESUMO DA ANÁLISE ASTERISK..."
echo "=================================="

if [[ $ISSUES_FOUND -eq 0 ]]; then
    echo -e "${GREEN}🎉 EXCELENTE!${NC} Nenhum problema crítico encontrado nas configurações Asterisk."
    echo "   Suas configurações estão alinhadas com a documentação oficial."
elif [[ $ISSUES_FOUND -le 3 ]]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO:${NC} $ISSUES_FOUND problema(s) encontrado(s)."
    echo "   Recomenda-se corrigir os problemas identificados."
elif [[ $ISSUES_FOUND -le 6 ]]; then
    echo -e "${RED}🚨 IMPORTANTE:${NC} $ISSUES_FOUND problemas encontrados."
    echo "   Algumas inconsistências críticas com a documentação oficial detectadas."
else
    echo -e "${RED}🔥 CRÍTICO:${NC} $ISSUES_FOUND problemas encontrados."
    echo "   Múltiplas inconsistências graves com a documentação oficial!"
fi

echo ""
echo "📚 REFERÊNCIAS UTILIZADAS:"
echo "- Asterisk Official PJSIP Documentation"
echo "- Asterisk Security Best Practices"
echo "- WebRTC Security Guidelines"
echo "- Asterisk Troubleshooting Guide"
echo ""
echo "🔗 Para mais detalhes, consulte: ASTERISK_SECURITY_ANALYSIS.md"
echo ""

exit $ISSUES_FOUND