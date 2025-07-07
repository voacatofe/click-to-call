# Usar uma base Alpine Linux, que é leve e segura
FROM alpine:3.18
LABEL maintainer="Seu Nome <seu-email@example.com>"

# Copiar os arquivos de configuração que criamos para o lugar certo no contêiner
COPY etc/ /etc/asterisk/

# Copiar o script de inicialização
COPY run.sh /

# Instalar o Asterisk pré-compilado do repositório do Alpine
# Isso é muito mais rápido e confiável do que compilar do zero
RUN apk add --no-cache --update asterisk tini \
 && chmod +x /run.sh \
 && chown -R asterisk:asterisk /etc/asterisk \
 && chown asterisk:asterisk /run.sh

# Mudar para o usuário 'asterisk' para maior segurança
USER asterisk:asterisk

# Usar 'tini' para gerenciar o processo do Asterisk corretamente
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar o servidor
CMD ["/run.sh"]

# Verificação de saúde para o Docker saber se o contêiner está funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["sh", "-c", "asterisk -rx 'core show uptime'"] 