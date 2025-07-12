#!/bin/sh
set -e

# --- Aguarda pelos Certificados ---
CERT_FILE="/etc/asterisk/keys/asterisk.crt"
KEY_FILE="/etc/asterisk/keys/asterisk.key"

echo "Aguardando certificados em $CERT_FILE e $KEY_FILE..."
while [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; do
  sleep 2
done
echo "Certificados encontrados."

# --- Processa os Templates de Configuração ---
echo "Processando templates de configuração..."
for template in /etc/asterisk/*.template; do
  if [ -f "$template" ]; then
    config_file=$(echo "$template" | sed 's/\.template$//')
    echo "Gerando $config_file a partir de $template..."
    envsubst < "$template" > "$config_file"
  fi
done

# --- Ajusta Permissões ---
chown -R asterisk:asterisk /etc/asterisk /var/lib/asterisk /var/log/asterisk /var/run/asterisk /var/spool/asterisk

# --- Inicia o Asterisk ---
echo "Iniciando o Asterisk..."
if [ "$1" = "asterisk" ]; then
  exec su-exec asterisk tini -s -- asterisk -f -c -vvvv
fi

exec "$@" 