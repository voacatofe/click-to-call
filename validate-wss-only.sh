#!/bin/bash

# =============================================================================
# SCRIPT DE VALIDAÇÃO WSS-ONLY
# =============================================================================
# Garante que APENAS WSS está configurado (sem WS inseguro)

echo "🔐 Validando configuração WSS-only..."
echo "===================================="

ERRORS=0

# 1. Verificar se configurações WS foram removidas
echo "1. Verificando remoção de configurações WS inseguras..."

if grep -r "protocol=ws" asterisk/etc/ | grep -v "protocol=wss"; then
    echo "   ❌ FALHA: Configurações WS (inseguras) ainda presentes!"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Configurações WS removidas"
fi

if grep -r "transport-ws\|agent.*-ws" asterisk/etc/ | grep -v "wss"; then
    echo "   ❌ FALHA: Endpoints WS ainda configurados!"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Endpoints WS removidos"
fi

# 2. Verificar porta 8088 (WS) removida
echo "2. Verificando remoção da porta WS (8088)..."

if grep -r "8088" docker-compose.yml; then
    echo "   ❌ FALHA: Porta 8088 (WS) ainda exposta!"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Porta WS (8088) removida"
fi

# 3. Verificar configurações WSS presentes
echo "3. Verificando configurações WSS..."

if grep -q "protocol=wss" asterisk/etc/pjsip*.conf; then
    echo "   ✅ Configuração WSS presente"
else
    echo "   ❌ FALHA: Configuração WSS não encontrada!"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "8089" docker-compose.yml; then
    echo "   ✅ Porta WSS (8089) configurada"
else
    echo "   ❌ FALHA: Porta WSS não exposta!"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar certificados WSS
echo "4. Verificando certificados WSS..."

if grep -q "cert_file.*asterisk.crt" asterisk/etc/pjsip*.conf && grep -q "priv_key_file.*asterisk.key" asterisk/etc/pjsip*.conf; then
    echo "   ✅ Certificados WSS configurados"
else
    echo "   ❌ FALHA: Certificados WSS não configurados!"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verificar endpoints WSS no frontend
echo "5. Verificando frontend WSS-only..."

if grep -q "agent-1001-wss" apps/web/src/components/*.tsx; then
    echo "   ✅ Frontend usando endpoints WSS"
else
    echo "   ❌ FALHA: Frontend não configurado para WSS!"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "wss://" apps/web/src/components/*.tsx; then
    echo "   ✅ Frontend forçando protocolo WSS"
else
    echo "   ❌ FALHA: Frontend não força WSS!"
    ERRORS=$((ERRORS + 1))
fi

# RESUMO
echo ""
echo "📊 RESUMO DA VALIDAÇÃO WSS-ONLY"
echo "==============================="

if [ $ERRORS -eq 0 ]; then
    echo "✅ SUCESSO: Configuração WSS-only validada!"
    echo ""
    echo "🔒 Seu sistema está configurado de forma SEGURA:"
    echo "   • Apenas WSS (criptografado) habilitado"
    echo "   • Configurações WS (inseguras) removidas" 
    echo "   • Compatível com ambiente HTTPS"
    echo "   • Certificados SSL configurados"
    echo ""
    echo "🚀 Para iniciar (WSS-only):"
    echo "   docker-compose up"
else
    echo "❌ FALHAS: $ERRORS problema(s) de segurança encontrado(s)!"
    echo ""
    echo "⚠️  ATENÇÃO: Sistema não está seguro para ambiente HTTPS!"
    echo "🔧 Corrija os problemas antes de usar em produção."
fi

echo ""
echo "🔍 Validação WSS-only concluída!"
exit $ERRORS