#!/bin/bash

# =============================================================================
# SCRIPT DE VERIFICAÇÃO RÁPIDA DAS CORREÇÕES DE SEGURANÇA
# =============================================================================

echo "🔍 Verificando correções de segurança..."
echo "========================================"

ERRORS=0

# 1. Verificar senhas padrão
echo "1. Verificando senhas padrão..."
if grep -r "changeme" asterisk/etc/ | grep -v "changeme_update_this" | grep -v ".bak"; then
    echo "   ❌ FALHA: Senhas 'changeme' ainda encontradas!"
    ERRORS=$((ERRORS + 1))
elif grep -r "secret = secret" asterisk/etc/ | grep -v ".bak"; then
    echo "   ❌ FALHA: Senha AMI padrão ainda encontrada!"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Senhas padrão removidas"
fi

# 2. Verificar bind addresses
echo "2. Verificando bind addresses..."
if grep -r "bind.*0\.0\.0\.0\|bindaddr.*0\.0\.0\.0" asterisk/etc/ | grep -v ".bak"; then
    echo "   ❌ FALHA: Bind 0.0.0.0 ainda presente!"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Bind addresses restringidos"
fi

# 3. Verificar Docker Compose
echo "3. Verificando Docker Compose..."
if grep -q "127.0.0.1:5038:5038" docker-compose.yml; then
    echo "   ✅ Docker Compose corrigido"
else
    echo "   ❌ FALHA: Docker Compose não corrigido!"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar duplicações
echo "4. Verificando duplicações..."
PJSIP_LINES=$(wc -l < asterisk/etc/pjsip-unified.conf)
SCRIPT_LINES=$(wc -l < scripts/setup-wss.ps1)

if [ "$PJSIP_LINES" -gt 85 ]; then
    echo "   ❌ POSSÍVEL: pjsip-unified.conf pode ter duplicação ($PJSIP_LINES linhas)"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ pjsip-unified.conf sem duplicação ($PJSIP_LINES linhas)"
fi

if [ "$SCRIPT_LINES" -gt 200 ]; then
    echo "   ❌ POSSÍVEL: setup-wss.ps1 pode ter duplicação ($SCRIPT_LINES linhas)"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ setup-wss.ps1 sem duplicação ($SCRIPT_LINES linhas)"
fi

# 5. Verificar certificados
echo "5. Verificando configuração de certificados..."
if grep -q "asterisk.crt" asterisk/etc/pjsip.conf && grep -q "asterisk.key" asterisk/etc/pjsip.conf; then
    echo "   ✅ Certificados configurados corretamente"
else
    echo "   ❌ FALHA: Certificados não configurados corretamente!"
    ERRORS=$((ERRORS + 1))
fi

# RESUMO
echo ""
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "======================="

if [ $ERRORS -eq 0 ]; then
    echo "✅ SUCESSO: Todas as verificações passaram!"
    echo ""
    echo "🚀 Sistema pronto para uso com as correções aplicadas."
    echo "⚠️  Lembre-se de configurar as variáveis de ambiente:"
    echo "   - AMI_SECRET"
    echo "   - AGENT_1001_PASSWORD"
    echo "   - JWT_SECRET"
else
    echo "❌ FALHAS: $ERRORS problema(s) encontrado(s)!"
    echo ""
    echo "🔧 Execute o script de correções primeiro:"
    echo "   ./apply-security-fixes.sh"
fi

echo ""
echo "🔍 Verificação concluída!"
exit $ERRORS