#!/bin/sh
set -e

# Processa os arquivos de template para gerar as configurações finais
echo "Gerando arquivos de configuração a partir dos templates..."
for template_path in /etc/asterisk/*.template; do
  config_file=$(echo "$template_path" | sed 's/\.template$//')
  echo "Processando $template_path -> $config_file"
  
  cp "$template_path" "$config_file"
  
  # Substitui as variáveis de ambiente no arquivo final
  if [ -n "$AGENT_1001_PASSWORD" ]; then
    sed -i "s|\\\${AGENT_1001_PASSWORD}|$AGENT_1001_PASSWORD|g" "$config_file"
  fi
  if [ -n "$EXTERNAL_IP" ]; then
    sed -i "s|\\\${EXTERNAL_IP}|$EXTERNAL_IP|g" "$config_file"
  fi
  if [ -n "$AMI_SECRET" ]; then
    sed -i "s|\\\${AMI_SECRET}|$AMI_SECRET|g" "$config_file"
  fi
done

# --- Verificação e Geração de Certificados TLS de Fallback ---
CERT_DIR="/etc/asterisk/keys"
REAL_CERT_FILE="$CERT_DIR/fullchain.pem"
REAL_KEY_FILE="$CERT_DIR/privkey.pem"

# Verifica se os certificados reais (montados pelo Easypanel/Docker) existem
if [ ! -f "$REAL_CERT_FILE" ] || [ ! -f "$REAL_KEY_FILE" ]; then
    echo "AVISO: Certificados reais ('fullchain.pem', 'privkey.pem') não encontrados."
    echo "Gerando um certificado auto-assinado de fallback para permitir a inicialização..."
    
    mkdir -p "$CERT_DIR"
    
    # Gera o certificado auto-assinado com os nomes que o http.conf espera
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
        -keyout "$REAL_KEY_FILE" \
        -out "$REAL_CERT_FILE" \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall/CN=localhost.localdomain"
        
    echo "Certificado de fallback gerado. O navegador não confiará neste certificado."
    echo "Em produção, garanta que o volume com os certificados reais esteja montado corretamente."
else
    echo "INFO: Certificados reais encontrados em $CERT_DIR. Usando-os."
fi

echo "Ajustando permissões..."
chown -R asterisk:asterisk /etc/asterisk/

echo "Iniciando o Asterisk..."
exec asterisk -f -c 