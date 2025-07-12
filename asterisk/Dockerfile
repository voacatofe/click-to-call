FROM alpine:3.18

ARG ASTERISK_VERSION=18.24.3-r1

# Instala Asterisk, SRTP e dependências
RUN apk add --no-cache --update \
    asterisk=${ASTERISK_VERSION} \
    asterisk-srtp=${ASTERISK_VERSION} \
    asterisk-sounds-en \
    openssl \
    tini \
    gosu

# Instala sons em inglês
ADD https://downloads.asterisk.org/pub/telephony/sounds/asterisk-core-sounds-en-wav-current.tar.gz /tmp/sounds.tar.gz
RUN mkdir -p /var/lib/asterisk/sounds/en && \
    tar -xzf /tmp/sounds.tar.gz -C /var/lib/asterisk/sounds/en --strip-components=1 && \
    rm /tmp/sounds.tar.gz

# Copia configurações
COPY etc/ /etc/asterisk/

# Copia entrypoint e dá permissões
COPY entrypoint.sh /run.sh
RUN chmod +x /run.sh

# Expõe as portas necessárias
EXPOSE 8088 8089 5038
EXPOSE 10000-10200/udp

ENTRYPOINT ["/run.sh"]
CMD ["asterisk"] 