#!/bin/bash

# Script para gerar certificados DTLS para mídia WebRTC
# EasyPanel cuida da sinalização (WSS), mas ainda precisamos de DTLS para mídia

set -e

CERTS_DIR="./certs"
ASTERISK_KEYS_DIR="/etc/asterisk/keys"

echo "🔐 Gerando certificados DTLS para mídia WebRTC..."

# Criar diretório se não existir
mkdir -p "$CERTS_DIR"

# Gerar chave privada
echo "📝 Gerando chave privada..."
openssl genrsa -out "$CERTS_DIR/asterisk.key" 2048

# Gerar certificado auto-assinado para DTLS
echo "📜 Gerando certificado DTLS..."
openssl req -new -x509 -key "$CERTS_DIR/asterisk.key" -out "$CERTS_DIR/asterisk.crt" -days 365 -subj "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall/OU=VoIP/CN=asterisk.local"

# Verificar os certificados
echo "✅ Verificando certificados gerados..."
openssl x509 -in "$CERTS_DIR/asterisk.crt" -text -noout | grep -E "(Subject:|Not After|Serial Number)"

# Permissões corretas
chmod 644 "$CERTS_DIR/asterisk.crt"
chmod 600 "$CERTS_DIR/asterisk.key"

echo ""
echo "🎉 Certificados DTLS gerados com sucesso!"
echo "📁 Local: $CERTS_DIR/"
echo "🔑 Chave: asterisk.key"
echo "📜 Certificado: asterisk.crt"
echo ""
echo "💡 Nota: EasyPanel cuida da sinalização WSS, estes certificados são apenas para criptografar a mídia (áudio/vídeo)."
echo ""
echo "🚀 Para usar no Docker, execute:"
echo "   docker-compose up --build" 