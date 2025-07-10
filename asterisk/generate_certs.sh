#!/bin/sh
set -e

CERT_DIR="/etc/asterisk/keys"
CERT_FILE="$CERT_DIR/asterisk.pem"

# Cria o diretório se ele não existir
mkdir -p "$CERT_DIR"

# Verifica se o certificado já existe
if [ ! -f "$CERT_FILE" ]; then
    echo "Gerando novos certificados para Asterisk..."
    
    # Gera o certificado autoassinado
    openssl req -x509 -nodes -newkey rsa:4096 -days 3650 \
        -keyout "$CERT_FILE" \
        -out "$CERT_FILE" \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall/CN=clicktocall.local"
        
    echo "Ajustando permissões do certificado..."
    chmod 600 "$CERT_FILE"
else
    echo "Certificados já existem."
fi 