#!/bin/sh
set -e

# Substitui a senha padrão pela variável de ambiente no arquivo pjsip.conf
if [ -n "$AGENT_1001_PASSWORD" ]; then
    echo "Configurando senha do agente usando variável de ambiente..."
    sed -i "s/password=changeme/password=$AGENT_1001_PASSWORD/g" /etc/asterisk/pjsip.conf
    echo "Senha configurada com sucesso."
else
    echo "AVISO: Variável AGENT_1001_PASSWORD não definida, usando senha padrão."
fi

# Inicia o Asterisk em modo de console, em primeiro plano
# A flag -f impede que ele vá para o background
# A flag -c fornece um console se você se conectar ao contêiner (docker attach)
exec asterisk -f -c 