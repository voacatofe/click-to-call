#!/bin/sh
set -e

PJSIP_CONFIG_FILE="/etc/asterisk/pjsip.conf"
RTP_CONFIG_FILE="/etc/asterisk/rtp.conf"

echo "Gerando arquivos de configuração a partir dos templates..."
cp "${PJSIP_CONFIG_FILE}.template" "$PJSIP_CONFIG_FILE"
cp "${RTP_CONFIG_FILE}.template" "$RTP_CONFIG_FILE"

if [ -n "$AGENT_1001_PASSWORD" ]; then
    echo "Configurando senha do agente..."
    sed -i "s/\${AGENT_1001_PASSWORD}/$AGENT_1001_PASSWORD/g" "$PJSIP_CONFIG_FILE"
fi

if [ -n "$EXTERNAL_IP" ]; then
    echo "Configurando NAT com IP externo: $EXTERNAL_IP"
    sed -i "s/\${EXTERNAL_IP}/$EXTERNAL_IP/g" "$PJSIP_CONFIG_FILE"
    sed -i "s/\${EXTERNAL_IP}/$EXTERNAL_IP/g" "$RTP_CONFIG_FILE"
fi

echo "Ajustando permissões..."
chown -R asterisk:asterisk /etc/asterisk/

echo "Iniciando o Asterisk..."
exec asterisk -f -c 