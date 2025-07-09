#!/bin/bash

# =============================================================================
# SCRIPT DE APLICAÇÃO DE CORREÇÕES DE SEGURANÇA
# =============================================================================
# Execute este script para aplicar as correções críticas de segurança
# ATENÇÃO: Teste em ambiente de desenvolvimento primeiro!

set -e  # Parar em caso de erro

echo "🔒 Aplicando correções de segurança urgentes..."
echo "================================================"

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# =============================================================================
# 1. GERAR SENHAS SEGURAS
# =============================================================================
echo "📝 1. Gerando senhas seguras..."

# Verificar se openssl está disponível
if ! command -v openssl &> /dev/null; then
    echo "❌ Erro: openssl não encontrado. Instale o openssl primeiro."
    exit 1
fi

AMI_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
AGENT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-32)

echo "   ✅ Senhas geradas com sucesso"

# =============================================================================
# 2. CRIAR ARQUIVO DE ENVIRONMENT
# =============================================================================
echo "📄 2. Criando arquivo .env.security..."

cat > .env.security << EOF
# Arquivo gerado automaticamente em $(date)
# IMPORTANTE: Configure estas variáveis no seu ambiente

AMI_SECRET=${AMI_SECRET}
AGENT_1001_PASSWORD=${AGENT_PASSWORD}
JWT_SECRET=${JWT_SECRET}

# Copie estas variáveis para seus arquivos .env apropriados:
# - .env (raiz do projeto)
# - apps/api/.env
# - apps/web/.env
EOF

echo "   ✅ Arquivo .env.security criado"

# =============================================================================
# 3. FAZER BACKUP DAS CONFIGURAÇÕES ATUAIS
# =============================================================================
echo "💾 3. Fazendo backup das configurações atuais..."

BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup dos arquivos de configuração do Asterisk
cp -r asterisk/etc "$BACKUP_DIR/asterisk-etc-backup"
cp docker-compose.yml "$BACKUP_DIR/"
cp scripts/setup-wss.ps1 "$BACKUP_DIR/" 2>/dev/null || true

echo "   ✅ Backup criado em: $BACKUP_DIR"

# =============================================================================
# 4. APLICAR CONFIGURAÇÕES DE ENVIRONMENT VARIABLES NO ASTERISK
# =============================================================================
echo "🔧 4. Configurando variáveis de ambiente nos arquivos do Asterisk..."

# Verificar se os arquivos já foram corrigidos (evitar dupla correção)
if grep -q "changeme_update_this" asterisk/etc/manager.conf; then
    echo "   ⚠️  Arquivos já parecem ter sido corrigidos. Pulando esta etapa."
else
    echo "   ⚠️  AVISO: Os arquivos de configuração do Asterisk foram corrigidos manualmente."
    echo "   ⚠️  As senhas agora usam variáveis de ambiente."
    echo "   ⚠️  Configure as seguintes variáveis no seu ambiente Docker:"
    echo "       AMI_SECRET=${AMI_SECRET}"
    echo "       AGENT_1001_PASSWORD=${AGENT_PASSWORD}"
fi

# =============================================================================
# 5. VALIDAR CORREÇÕES
# =============================================================================
echo "🔍 5. Validando correções aplicadas..."

VALIDATION_ERRORS=0

# Verificar se senhas padrão ainda existem
if grep -r "password=changeme" asterisk/etc/ --exclude-dir=backup-* | grep -v "changeme_update_this"; then
    echo "   ❌ FALHA: Senhas padrão 'changeme' ainda encontradas!"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
else
    echo "   ✅ Senhas padrão removidas"
fi

if grep -r "secret = secret" asterisk/etc/ --exclude-dir=backup-*; then
    echo "   ❌ FALHA: Senha padrão AMI ainda encontrada!"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
else
    echo "   ✅ Senha AMI corrigida"
fi

# Verificar bind addresses
if grep -r "bind=0.0.0.0\|bindaddr=0.0.0.0" asterisk/etc/ --exclude-dir=backup-*; then
    echo "   ❌ FALHA: Bind 0.0.0.0 ainda presente!"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
else
    echo "   ✅ Bind addresses restringidos"
fi

# Verificar se Docker Compose foi corrigido
if grep -q "127.0.0.1:5038:5038" docker-compose.yml; then
    echo "   ✅ Docker Compose corrigido"
else
    echo "   ❌ FALHA: Docker Compose não foi corrigido!"
    VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
fi

# =============================================================================
# 6. RESUMO E PRÓXIMOS PASSOS
# =============================================================================
echo ""
echo "📋 RESUMO DAS CORREÇÕES"
echo "======================"

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo "✅ Todas as correções foram aplicadas com sucesso!"
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "1. Configure as variáveis de ambiente do arquivo .env.security"
    echo "2. Teste o sistema em ambiente de desenvolvimento"
    echo "3. Aplique em produção durante janela de manutenção"
    echo ""
    echo "💡 VARIÁVEIS PARA CONFIGURAR:"
    echo "   AMI_SECRET=${AMI_SECRET}"
    echo "   AGENT_1001_PASSWORD=${AGENT_PASSWORD}"
    echo "   JWT_SECRET=${JWT_SECRET}"
else
    echo "❌ $VALIDATION_ERRORS erro(s) encontrado(s)!"
    echo "⚠️  Revise os problemas acima antes de prosseguir."
    echo ""
    echo "📞 Se precisar de ajuda:"
    echo "1. Verifique se todas as correções manuais foram aplicadas"
    echo "2. Execute novamente após corrigir os problemas"
fi

echo ""
echo "📂 ARQUIVOS IMPORTANTES:"
echo "   - Backup: $BACKUP_DIR"
echo "   - Senhas: .env.security"
echo "   - Logs: Verificar saída acima"

echo ""
echo "⚠️  LEMBRETE: Adicione .env.security ao .gitignore!"
echo "⚠️  NUNCA commite senhas no Git!"

# Adicionar ao .gitignore se não estiver lá
if ! grep -q ".env.security" .gitignore 2>/dev/null; then
    echo ".env.security" >> .gitignore
    echo "   ✅ .env.security adicionado ao .gitignore"
fi

echo ""
echo "🔒 Script de correções concluído!"
echo "================================================"