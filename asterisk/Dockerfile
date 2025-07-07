FROM alpine:3.18

LABEL maintainer="Seu Nome <seu-email@example.com>"

# Install Asterisk with SRTP support, openssl, and other dependencies
RUN apk add --no-cache --update \
    asterisk=18.24.3-r1 \
    asterisk-srtp=18.24.3-r1 \
    openssl \
    tini

# Generate self-signed TLS certificate for WSS
RUN mkdir -p /etc/asterisk/keys && \
    openssl req -x509 -nodes -newkey rsa:2048 -keyout /etc/asterisk/keys/asterisk.pem -out /etc/asterisk/keys/asterisk.pem -days 3650 -subj "/CN=clicktocall.local" && \
    chown asterisk:asterisk /etc/asterisk/keys/asterisk.pem

# Copy configuration files
COPY etc/ /etc/asterisk/

# Copy the startup script
COPY run.sh /

# Permissions
RUN chmod +x /run.sh && \
    chown -R asterisk:asterisk /etc/asterisk/ && \
    chown asterisk:asterisk /run.sh

# Expose necessary ports
EXPOSE 8088 8089 5038

# Define o ponto de entrada para o container
ENTRYPOINT ["/sbin/tini", "--"]

# Comando padrão para iniciar o Asterisk
CMD ["/run.sh"] 