#!/bin/sh
set -e

echo "Gerando arquivos de configuração a partir dos templates..."

# Itera sobre todos os arquivos .template no diretório
for template_path in /etc/asterisk/*.template; do
  # Define o nome do arquivo de configuração final
  config_file=$(echo "$template_path" | sed 's/\.template$//')
  
  echo "Processando $template_path -> $config_file"
  
  # Copia o template para o arquivo final
  cp "$template_path" "$config_file"
  
  # Substitui as variáveis de ambiente no arquivo final
if [ -n "$AGENT_1001_PASSWORD" ]; then
    sed -i "s|\${AGENT_1001_PASSWORD}|$AGENT_1001_PASSWORD|g" "$config_file"
fi
if [ -n "$EXTERNAL_IP" ]; then
    sed -i "s|\${EXTERNAL_IP}|$EXTERNAL_IP|g" "$config_file"
  fi
  if [ -n "$AMI_SECRET" ]; then
    sed -i "s|\${AMI_SECRET}|$AMI_SECRET|g" "$config_file"
fi
done

# Gerar certificados autoassinados se não existirem
echo "Verificando certificados SSL..."
mkdir -p /etc/asterisk/keys

if [ ! -f /etc/asterisk/keys/asterisk.crt ] || [ ! -f /etc/asterisk/keys/asterisk.key ]; then
    echo "Gerando certificados autoassinados..."
    openssl req -x509 -nodes -newkey rsa:2048 \
        -keyout /etc/asterisk/keys/asterisk.key \
        -out /etc/asterisk/keys/asterisk.crt \
        -days 365 \
        -subj "/C=BR/ST=State/L=City/O=Organization/CN=asterisk.local"
    
    # Criar também o arquivo .pem combinado para DTLS
    cat /etc/asterisk/keys/asterisk.key /etc/asterisk/keys/asterisk.crt > /etc/asterisk/keys/asterisk.pem
    
    echo "Certificados gerados com sucesso!"
fi

echo "Ajustando permissões..."
chown -R asterisk:asterisk /etc/asterisk/

echo "Iniciando o Asterisk..."
exec asterisk -f -c 