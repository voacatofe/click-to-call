FROM alpine:3.18

LABEL maintainer="Seu Nome <seu-email@example.com>"

# Install Asterisk with SRTP support, openssl, and other dependencies
RUN apk add --no-cache --update \
    asterisk=18.24.3-r1 \
    asterisk-srtp=18.24.3-r1 \
    openssl \
    tini

# Generate separate TLS certificate and key files for WSS
RUN mkdir -p /etc/asterisk/keys && \
    openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout /etc/asterisk/keys/asterisk.key \
    -out /etc/asterisk/keys/asterisk.crt \
    -days 365 \
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1" && \
    chmod 600 /etc/asterisk/keys/asterisk.key && \
    chmod 644 /etc/asterisk/keys/asterisk.crt && \
    chown asterisk:asterisk /etc/asterisk/keys/*

# Copy configuration files
COPY etc/ /etc/asterisk/

# Copy the startup script
COPY entrypoint.sh /run.sh

# Permissions
RUN chmod +x /run.sh && \
    chown -R asterisk:asterisk /etc/asterisk/ && \
    chown asterisk:asterisk /run.sh

# Expose necessary ports (only to localhost in docker-compose)
EXPOSE 8088 8089 5038

# Define o ponto de entrada para o container
ENTRYPOINT ["/sbin/tini", "--"]

# Comando padrão para iniciar o Asterisk
CMD ["/run.sh"] 