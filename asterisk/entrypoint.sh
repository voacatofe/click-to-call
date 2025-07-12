#!/bin/sh
set -e

# Configurações de usuário e grupo (se fornecidas)
if [ -n "$ASTERISK_UID" ] && [ -n "$ASTERISK_GID" ]; then
    # Altera o UID e GID do usuário asterisk se as variáveis estiverem definidas
    echo "Changing Asterisk user/group to $ASTERISK_UID:$ASTERISK_GID"
    deluser asterisk
    addgroup -g "$ASTERISK_GID" asterisk
    adduser -D -H -u "$ASTERISK_UID" -G asterisk asterisk
else
    echo "Running with default Asterisk user/group."
fi

# Ajusta as permissões dos diretórios
chown -R asterisk:asterisk /etc/asterisk /var/lib/asterisk /var/log/asterisk /var/run/asterisk /var/spool/asterisk

# Adicionando o '-f' para rodar em primeiro plano e o '-c' para logar no console
# Isto é crucial para que os logs sejam capturados pelo Docker/EasyPanel
if [ "$1" = "asterisk" ]; then
  exec su-exec asterisk tini -s -- asterisk -f -c -vvvv
fi

exec "$@" 