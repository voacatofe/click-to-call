#!/bin/bash

# Script para gerar certificados auto-assinados para desenvolvimento WSS
# ATENÇÃO: Apenas para desenvolvimento! Não usar em produção!

CERT_DIR="/etc/asterisk/keys"
# Usa a variável de ambiente ASTERISK_HOST_DOMAIN ou 'localhost' como padrão.
DOMAIN="${ASTERISK_HOST_DOMAIN:-localhost}"

echo "🔐  Gerando certificados auto-assinados para o domínio: $DOMAIN..."

# Criar diretório se não existir
mkdir -p "$CERT_DIR"

# Gerar chave privada
openssl genrsa -out "$CERT_DIR/asterisk.key" 2048

# Gerar certificado auto-assinado válido por 365 dias
# Usar o domínio correto no Subject e no Subject Alternative Name (SAN)
openssl req -new -x509 -key "$CERT_DIR/asterisk.key" \
    -out "$CERT_DIR/asterisk.crt" \
    -days 365 \
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall-Dev/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN"

# Ajustar permissões
chmod 600 "$CERT_DIR/asterisk.key"
chmod 644 "$CERT_DIR/asterisk.crt"

echo "✅ Certificados gerados:"
echo "   Chave: $CERT_DIR/asterisk.key"
echo "   Cert:  $CERT_DIR/asterisk.crt"
echo ""
echo "⚠️   IMPORTANTE: Estes são certificados auto-assinados!"
echo "   Você precisará aceitar o aviso de segurança no browser."
echo ""
echo "🔍 Para verificar o certificado:"
echo "   openssl x509 -in $CERT_DIR/asterisk.crt -text -noout"