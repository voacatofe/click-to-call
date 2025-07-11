**Certificados TLS grátis (Let’s Encrypt) para Asterisk com WSS no Docker** 

Para habilitar *WebSocket Secure* (WSS) em Asterisk rodando em Docker, é possível usar certificados TLS gratuitos do Let’s Encrypt. O fluxo básico envolve gerar os certificados no VPS (usando o certbot ), armazená-los no host, montá-los no container e configurar o Asterisk. A seguir um guia passo-a-passo técnico com comandos e exemplos. 

**1\. Gerar certificados TLS com Certbot** 

1\.    
**Instalar o Certbot** (no VPS, não dentro do container): 

sudo apt update 

sudo apt install certbot 

2\.    
**Gerar certificado para seu domínio** (por exemplo click-to-call.dominio.com ): sudo certbot certonly \--standalone \-d click-to-call.dominio.com 

Esse comando interrompe temporariamente qualquer serviço na porta 80 para validar o domínio via HTTP-01 challenge e obter os arquivos em /etc/letsencrypt/live/click-to call.dominio.com/ . Certifique-se de que o DNS do domínio aponte para o IP do VPS e que o firewall permita acesso na porta 80 para o processo de validação.  

3\.    
**Renovação automática**: Após obter o certificado, configure uma tarefa cron para renovar 

periodicamente (Let’s Encrypt vence a cada \~90 dias): 

sudo crontab \-e 

\# Adicionar linha: 

0 12 \* \* \* certbot renew \--quiet 

1   
Isso tenta renovar diariamente ao meio-dia (sem desligar o serviço) . Você pode personalizar o horário conforme necessário. 

**2\. Armazenar certificados no host** 

Por padrão, o Certbot salva os certificados em /etc/letsencrypt/live/\<domínio\>/ fullchain.pem (certificado \+ intermediários) e privkey.pem (chave privada). Não mova nem apague esses arquivos, mas você pode copiá-los ou montá-los diretamente no container.  

Uma prática comum é **montar o diretório do Let’s Encrypt** dentro do container. Por exemplo, no docker-compose.yml de produção:  

1  
services: 

asterisk: 

\# ... 

volumes: 

\- /etc/letsencrypt/live/click-to-call.dominio.com:/etc/asterisk/keys:ro 

Isso monta o diretório contendo fullchain.pem e privkey.pem para /etc/asterisk/keys 2   
dentro do container (somente leitura) . Assim, o Asterisk verá os arquivos ali. Em vez de copiar para o contêiner, o volume garante que a atualização no host reflita no container. 

**3\. Configurar o Asterisk para usar os certificados** 

**3.1. http.conf – servidor HTTPS do Asterisk** 

No arquivo de configuração HTTP do Asterisk ( /etc/asterisk/http.conf ), ative o TLS e aponte para os certificados montados. Exemplo mínimo: 

\[general\] 

tlsenable=yes 

tlsbindaddr=0.0.0.0:8089 ; porta do WSS (HTTPS) 

tlscertfile=/etc/asterisk/keys/fullchain.pem 

tlsprivatekey=/etc/asterisk/keys/privkey.pem 

tlsclientmethod=tlsv1\_2 

Nesse exemplo, o Asterisk irá aceitar conexões HTTPS na porta **8089** (padrão WebSocket seguro) com o certificado Let’s Encrypt montado. Em resumo: habilite tlsenable , defina tlsbindaddr para 0.0.0.0:8089 e aponte tlscertfile / tlsprivatekey para os arquivos dentro do container 

3   
. 

**3.2. pjsip.conf – transporte WSS** 

No pjsip.conf , crie um transporte do tipo wss referenciando os mesmos arquivos. Por exemplo: 

\[transport-ws\] 

type=transport 

protocol=ws 

bind=0.0.0.0:8088 

\[transport-wss\] 

type=transport 

protocol=wss 

bind=0.0.0.0:8089 

cert\_file=/etc/asterisk/keys/fullchain.pem 

priv\_key\_file=/etc/asterisk/keys/privkey.pem 

external\_media\_address=click-to-call.dominio.com 

external\_signaling\_address=click-to-call.dominio.com 

2  
4   
Aqui \[transport-wss\] fica na porta 8089 e usa fullchain.pem e privkey.pem montados . Os campos external\_media\_address e external\_signaling\_address devem ser seu domínio público, garantindo que o Asterisk anuncie o FQDN correto para os clientes WebRTC. Além disso, em cada endpoint WebRTC, habilite webrtc=yes e media\_encryption=dtls para usar TLS/DTLS junto 4   
ao WSS . 

**3.3. Exemplo de endpoint (pjsip)** 

\[agent-1001-wss\] 

type=endpoint 

transport=transport-wss 

webrtc=yes 

media\_encryption=dtls 

dtls\_auto\_generate\_cert=no 

; se desejar usar fingerprint em vez de verificar CA: 

dtls\_verify=fingerprint 

dtls\_setup=actpass 

aors=agent-1001 

auth=agent-1001-auth 

Certifique-se de ter um token/senha forte para o endpoint (ex.: password=SenhaMuitoForteAqui ) 5   
para reforçar a segurança . 

**4\. Permissões e segurança dos arquivos de chave** 

**Nunca deixe as chaves privadas acessíveis a usuários não autorizados.** Dentro do container, ajuste dono/grupo e permissões de /etc/asterisk/keys/\*.pem . Por exemplo, se o container roda como usuário asterisk:asterisk (UID/GID 1000 ou semelhante), faça no host: 

sudo chown \-R 1000:1000 /etc/letsencrypt/live/click-to-call.dominio.com sudo chmod 600 /etc/letsencrypt/live/click-to-call.dominio.com/privkey.pem 

O blog *Feeding Cloud & Geek* recomenda copiar as chaves para o diretório do Asterisk e aplicar chown  asterisk:asterisk e chmod go-rwx . No nosso caso, montamos como volume, então   
6 

podemos garantir no host que /etc/letsencrypt/live/... tenha dono (por exemplo root) e modo restritivo. Importante: o diretório montado no container é somente leitura ( :ro ), o que evita modificação acidental. 

Em resumo: **restrinja o acesso** às chaves ( chmod 600 ou 700 ) e assegure que o processo do 6   
Asterisk (ou usuário usado) consiga lê-las . Assim, mesmo que o volume seja montado, somente o usuário correto poderá usá-las. 

3  
**5\. Renovação automática e atualização no container** 

O Let’s Encrypt renova os certificados periodicamente (via cron). Depois da renovação, é necessário que o Asterisk *recarregue* o certificado. 

•    
**Agendar certbot renew :** Como visto, configurei cron para certbot renew . Ele atualiza os arquivos em /etc/letsencrypt/live/... automaticamente. 

•    
**Atualizar o container Asterisk:** O Asterisk **não recarrega automaticamente** as chaves TLS em 7   
tempo real . É preciso reiniciar o serviço ou o próprio container para aplicar a nova chave. Duas abordagens comuns: 

•    
Usar um *hook* do Certbot para rodar um comando após renovação, por exemplo: certbot renew \--deploy-hook "docker-compose restart asterisk" 

Isso reinicia o serviço Asterisk no container. 

•    
Ou incluir no cron um *restart* do container após a renovação, por exemplo: 0 3 \* \* \* docker-compose \-f /caminho/docker-compose.yml restart asterisk 

•    
Em um ambiente Docker, outra opção é usar uma imagem com suporte ACME (como mlan/ 

asterisk ): ela monitora um arquivo de certificado e executa sv restart asterisk após 8   
atualização . Mas para quem gerencia manualmente, basta reiniciar o container Asterisk (ou executar core restart now no CLI) quando o Certbot renovar o certificado. O importante é 8   
que o arquivo *in loco* seja recarregado: reiniciar o container garante isso . 

**6\. Firewall, portas e DNS** 

•    
**Firewall e portas do Asterisk:** Abra as portas necessárias: •    
**80/tcp:** usada temporariamente pelo Certbot standalone para desafio HTTP. Deve estar acessível pela Internet durante a renovação do certificado (ou use validação DNS se 80 estiver indisponível). 

•    
**443/tcp:** (opcional) se você tiver outros serviços HTTPS. Não é usada pelo Asterisk, mas o domínio deve resolver para o VPS. 

•    
**8089/tcp:** porta WSS (HTTPS) configurada em http.conf . Libere esta porta para clientes 9   
WebRTC externos . 

•    
**8088/tcp (HTTP)**: porta WS não-criptografada, se usada no fallback (pode ser bloqueada em produção, mas útil para teste). 

•    
**5060/udp-tcp** e **5061/tcp**: SIP/TLS (dependendo de sua configuração).  

•    
**10000–20000/udp**: RTP (áudio/vídeo). Esses devem estar abertos para fluxo de mídia. 

•    
**DNS:** Certifique-se de que click-to-call.dominio.com aponte para o IP público do VPS. O Let’s Encrypt só vai gerar o certificado se o domínio estiver corretamente resolvido. Se o VPS fica 

atrás de NAT, encaminhe a porta 80 e 8089 para ele e aponte o DNS adequadamente. •    
**Consideração adicional:** o domínio deve ter um registro A (ou AAAA) público válido. Durante o desafio HTTP-01, a Let’s Encrypt tentará baixar um arquivo via http://click-to call.dominio.com/.well-known/acme-challenge/… na porta 80\. Portanto, *abra* esta porta ou utilize desafio DNS se preferir (ex.:  

certbot \-d seu-dominio \--preferred-challenges dns com plugin DNS). 4  
Em resumo, **as mesmas práticas de um PBX exposto ao público** se aplicam: libere no firewall as portas do SIP/RTP/WebRTC citadas, e garanta que o endereço DNS do servidor esteja correto. Por exemplo, o manual da Asterisk diz para *“permitir o tráfego TCP 8089”* no firewall para clientes WebRTC   
9   
. Também verifique que não exista outro serviço ocupando as portas configuradas no http.conf 

e pjsip.conf . 

**7\. Recapitulação de configurações (exemplos)** 

**docker-compose.yml (trecho volumes):** 

asterisk: 

image: asterisk:18-alpine 

\# ... 

volumes: 

\- /etc/letsencrypt/live/click-to-call.dominio.com:/etc/asterisk/keys:ro \- ./asterisk/etc:/etc/asterisk 

\# ... outros volumes (sons, gravações, etc.) 

environment: 

\- ASTERISK\_UID=1000 

\- ASTERISK\_GID=1000 

Este exemplo monta o certificado e define o UID/GID do usuário asterisk . Ajuste conforme sua imagem.  

**/etc/asterisk/http.conf (TLS):** 

\[general\] 

enabled=yes 

bindaddr=0.0.0.0 

bindport=8088 ; porta não-criptografada (WS) 

tlsenable=yes 

tlsbindaddr=0.0.0.0:8089 

tlscertfile=/etc/asterisk/keys/fullchain.pem 

tlsprivatekey=/etc/asterisk/keys/privkey.pem 

**/etc/asterisk/pjsip.conf (WSS):** 

\[transport-ws\] 

type=transport 

protocol=ws 

bind=0.0.0.0:8088 

\[transport-wss\] 

type=transport 

protocol=wss 

bind=0.0.0.0:8089 

5  
cert\_file=/etc/asterisk/keys/fullchain.pem 

priv\_key\_file=/etc/asterisk/keys/privkey.pem 

Após configurar tudo, reinicie o container Asterisk. Dentro do Asterisk CLI ( docker exec \-it  asterisk-clicktocall asterisk \-rx ), você pode verificar:  

\# Verifica certificado carregado (exibe detalhes) 

openssl x509 \-in /etc/asterisk/keys/fullchain.pem \-text \-noout Ou, do host:  

docker exec asterisk-clicktocall openssl s\_client \-connect localhost:8089 \- servername click-to-call.dominio.com 

Esses comandos ajudam a validar que o certificado correto está ativo na porta 8089\. **8\. Boas práticas finais** 

•    
**Use senhas fortes** para todos os endpoints e usuários SIP/WebRTC. Evite senhas fracas ou padrão. 

•    
Mantenha o sistema (host e container) atualizado. O Let’s Encrypt oferece certificados grátis, 

mas a segurança também depende das configurações do servidor. 

•    
**Monitore logs** do Asterisk ( docker logs ) e do Certbot para erros de renovação. •    
**Teste a renovação** manualmente antes de depender só do cron: 

sudo certbot renew \--dry-run 

•    
Se tiver múltiplos domínios (subdomínios), você pode gerar um certificado SAN para todos, ou usar múltiplos. Lembre-se de montar todos no container. 

•    
Documente o procedimento e automatize (scripts ou Ansible) para ambientes de produção. 

Com esses passos, você terá WSS funcionando no Asterisk em Docker com certificados TLS válidos do Let’s Encrypt, sem custos e com renovação automática. As referências abaixo contêm exemplos práticos 1 6 3 8 9   
similares . 

**Fontes:** Documentação interna de WSS do projeto click-to-call ; blog *Feeding Cloud & Geek*   
1 10 4 

6 3   
(configuração de TLS em Asterisk) ; StackOverflow/Asterisk (configuração de http.conf) ; imagem 8 9   
Docker Asterisk (renovação TLS) ; documentação oficial Asterisk (portas WebRTC) .  

1 2 4 5 10   
WSS-IMPLEMENTATION-GUIDE.md 

https://github.com/voacatofe/click-to-call/blob/2c3d8d5c25ab7ca77837c7e4c3003871b90c804e/docs/WSS IMPLEMENTATION-GUIDE.md 

3   
Websocket connection fails with asterisk 11 \- Stack Overflow 

https://stackoverflow.com/questions/26254980/websocket-connection-fails-with-asterisk-11 6  
6   
Using a Let's Encrypt TLS certificate with Asterisk 16.2 

https://feeding.cloud.geek.nz/posts/using-letsencrypt-cert-with-asterisk/ 

7   
Does the built-in HTTPS server reload certificates automatically? \- Asterisk Support \- Asterisk 

Community 

https://community.asterisk.org/t/does-the-built-in-https-server-reload-certificates-automatically/99588 

8   
GitHub \- mlan/docker-asterisk: Docker image providing Asterisk PBX 

https://github.com/mlan/docker-asterisk 

9   
Configuring Asterisk for WebRTC Clients \- Asterisk Documentation 

https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/ 7