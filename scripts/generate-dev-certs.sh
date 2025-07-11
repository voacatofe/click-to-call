#!/bin/sh
set -e

# Define o diretório onde os certificados de desenvolvimento serão armazenados
CERT_DIR="certs"

# Verifica se o OpenSSL está instalado
if ! command -v openssl >/dev/null 2>&1; then
    echo "Erro: OpenSSL não encontrado. Por favor, instale-o para gerar os certificados."
    exit 1
fi

# Cria o diretório de certificados se ele não existir
if [ ! -d "$CERT_DIR" ]; then
    echo "Criando o diretório '$CERT_DIR'..."
    mkdir -p "$CERT_DIR"
fi

# Define os caminhos para os arquivos de chave e certificado
KEY_FILE="$CERT_DIR/privkey.pem"
CERT_FILE="$CERT_DIR/fullchain.pem"

# Verifica se os certificados já existem para não sobrescrevê-los
if [ -f "$KEY_FILE" ] && [ -f "$CERT_FILE" ]; then
    echo "INFO: Certificados de desenvolvimento já existem em '$CERT_DIR'. Nenhum foi gerado."
    exit 0
fi

echo "Gerando novos certificados de desenvolvimento para localhost..."

# Gera a chave privada e o certificado auto-assinado em um único comando
# CN=localhost é o importante para o navegador reconhecer em ambiente de dev
openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCallDev/CN=localhost"

echo "Ajustando permissões dos arquivos gerados..."
chmod 600 "$KEY_FILE"

echo "✅ Sucesso! Certificados de desenvolvimento gerados em '$CERT_DIR/'."
echo "Agora você pode executar 'docker-compose up'." 