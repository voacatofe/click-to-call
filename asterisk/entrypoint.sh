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

echo "Ajustando permissões..."
chown -R asterisk:asterisk /etc/asterisk/

echo "Iniciando o Asterisk..."
exec asterisk -f -c 