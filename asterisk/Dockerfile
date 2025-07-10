FROM alpine:3.18

# Instala Asterisk, SRTP (para áudio seguro) e outros pacotes essenciais
RUN apk add --no-cache --update \
    asterisk=18.24.3-r1 \
    asterisk-srtp=18.24.3-r1 \
    asterisk-sounds-en \
    openssl \
    tini

# Baixa e instala os sons em inglês de alta qualidade (formato wav)
# Isso garante que arquivos como 'beep' e 'hello-world' estejam disponíveis
ADD https://downloads.asterisk.org/pub/telephony/sounds/asterisk-core-sounds-en-wav-current.tar.gz /tmp/sounds.tar.gz
RUN mkdir -p /var/lib/asterisk/sounds/en && \
    tar -xzf /tmp/sounds.tar.gz -C /var/lib/asterisk/sounds/en --strip-components=1 && \
    rm /tmp/sounds.tar.gz

# Copia as configurações e o script de entrada
COPY etc/ /etc/asterisk/
COPY entrypoint.sh /run.sh

# Ajusta as permissões e torna o script executável
RUN chmod +x /run.sh && \
    chown -R asterisk:asterisk /etc/asterisk/ && \
    chown asterisk:asterisk /run.sh

# Define o ponto de entrada e o comando padrão
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/run.sh"] 