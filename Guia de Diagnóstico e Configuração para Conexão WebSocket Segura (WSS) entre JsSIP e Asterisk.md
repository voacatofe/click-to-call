**Guia de Diagnóstico e Configuração para Conexão WebSocket Segura (WSS) entre JsSIP e Asterisk** 

**Requisitos para o Asterisk aceitar conexões WSS** 

Para suportar clientes WebRTC (como o JsSIP) via WebSocket seguro (WSS), o Asterisk precisa atender a alguns requisitos básicos: 

**Módulos necessários:** Certifique-se de que o Asterisk tenha carregado os módulos de •    
WebSocket e WebRTC. Em particular, habilite o módulo res\_http\_websocket.so (suporte ao protocolo WebSocket no servidor HTTP do Asterisk) e use o driver de SIP **chan\_pjsip** (recomendado em vez do legado chan\_sip). Além disso, para mídia segura, carregue 1   
res\_srtp.so (para criptografia SRTP) e o módulo RTP padrão ( res\_rtp\_asterisk.so ) . Verifique com o comando module show no CLI do Asterisk se esses módulos estão presentes e não bloqueados em modules.conf .  

•    
**Certificados TLS válidos:** O Asterisk deve ter um certificado TLS configurado para seu servidor HTTP. Você pode usar certificados de uma autoridade confiável (por exemplo, Let’s Encrypt) ou um autoassinado para testes. O certificado e a chave privada devem estar nos caminhos configurados e corresponder ao **nome de host** que os clientes usarão. Por exemplo, se os clientes conectam em click-to-call-clicktocal.hvlihi.easypanel.host , o certificado deve cobrir esse domínio.  

**Servidor HTTP interno habilitado:** O Asterisk possui um mini-servidor HTTP embutido,   
•  

necessário para manusear o upgrade para WebSocket. É preciso habilitá-lo e configurá-lo para aceitar **HTTPS na porta 8089** (porta padrão para WSS no Asterisk). Edite o arquivo http.conf do Asterisk configurando, no contexto \[general\] , as opções essenciais: ativar o servidor, definir o bind em todas interfaces, habilitar TLS, porta TLS 8089, e apontar para os arquivos de certificado. Exemplo mínimo em http.conf : 

\[general\] 

enabled=yes 

bindaddr=0.0.0.0 

bindport=8088 ; Porta HTTP (não-segura, se necessário) tlsenable=yes 

tlsbindaddr=0.0.0.0:8089 ; Porta HTTPS para WSS 

tlscertfile=/etc/asterisk/keys/asterisk.crt ; Certificado TLS tlsprivatekey=/etc/asterisk/keys/asterisk.key ; Chave privada TLS 

No exemplo acima, habilitamos HTTP na 8088 (opcional, para WS não seguro em desenvolvimento) e 2   
HTTPS na 8089 com TLS . Após editar, **reinicie o Asterisk** e confirme se o servidor HTTP seguro está ativo com http show status no CLI. A saída deve indicar o bind na porta 8089 e listar o endpoint / 

1  
ws como habilitado, similar a: *“HTTPS Server Enabled and Bound to \[::\]:8089”* e na lista de URIs ativas deve 3 4   
constar /ws \=\> Asterisk HTTP WebSocket . Isso confirma que o Asterisk está pronto para aceitar conexões WSS no caminho /ws . Se /ws não aparecer, o WebSocket não está habilitado corretamente (verifique módulos e config). 

•    
**Porta 8089 acessível:** Assegure-se de que a porta TCP 8089 esteja aberta no firewall (do servidor 

e de qualquer camada de nuvem ou container). No Docker Compose fornecido, a porta 8089 já 5   
está mapeada para o host , mas é preciso que o provedor (easypanel) não bloqueie essa porta. Você pode verificar localmente com netstat \-tulpn | grep 8089 ou ss \-lntp no 6   
container/host para confirmar que o Asterisk está escutando nessa porta . Do exterior, teste a conectividade usando ferramentas de cliente: por exemplo, usando OpenSSL para verificar o handshake TLS:  

openssl s\_client \-connect click-to-call-clicktocal.hvlihi.easypanel.host: 8089 \-servername click-to-call-clicktocal.hvlihi.easypanel.host 

Esse comando tentará estabelecer uma conexão TLS e exibirá detalhes do certificado. Ele ajuda a diagnosticar problemas de certificado (por exemplo, nome CN/SAN não correspondente ou cadeia inválida). Idealmente deve mostrar Verify return code: 0 (ok) para um certificado válido ou detalhes de erro se houver falha. Conforme a documentação interna do projeto, este teste pode ser 7   
feito dentro do container Docker também .  

•    
**Transporte PJSIP para WSS:** Configure no pjsip.conf um transporte do tipo wss . Embora o servidor HTTP faça o handshake do WebSocket, o PJSIP precisa de um transporte definido para vincular as conexões WSS à pilha SIP. No pjsip.conf , adicione algo como: 

\[transport-wss\] 

type=transport 

protocol=wss 

bind=0.0.0.0 ; O Asterisk usará a porta TLS do http.conf (8089) cert\_file=/etc/asterisk/keys/asterisk.crt ; (opcional) cert TLS priv\_key\_file=/etc/asterisk/keys/asterisk.key ; (opcional) chave TLS 

8 9 

**Nota:** Para transportes WSS, outros parâmetros de transporte (como external\_media\_address ) são ignorados, pois ele herda as configurações TLS do http.conf . Você pode omitir o cert\_file aqui se já definiu tlscertfile no   
8 

http.conf – o Asterisk usará aquele certificado para o WSS. Alguns especialistas recomendam não especificar a porta no bind do transporte WSS (apenas 0.0.0.0 ), deixando o tlsbindaddr do http.conf definir a porta . Em Asterisk 18, ambas   
10 

abordagens funcionam, mas mantenha a consistência (definimos 0.0.0.0 sem porta acima, o que é suficiente para ligar no 8089 configurado).  

•    
**Endpoint SIP WebRTC configurado:** Por fim, crie/ajuste as seções do endpoint PJSIP 

correspondente ao agente WebRTC (por exemplo, o agent-1001-wss ). No PJSIP, um endpoint WebRTC deve ter parâmetros específicos habilitados. A partir do Asterisk 16+, basta usar  

2  
webrtc=yes no endpoint, que é um atalho para várias configurações exigidas pelo WebRTC 

11   
. Exemplificando, no pjsip.conf você poderia ter: 

\[agent-1001-wss\] 

type=endpoint 

transport=transport-wss 

context=default 

disallow=all 

allow=opus,ulaw ; Codecs suportados (incluindo Opus para WebRTC) auth=agent-1001-wss 

aors=agent-1001-wss 

webrtc=yes ; Ativa configurações WebRTC (AVPF, DTLS, ICE etc) E as seções correspondentes de auth e aor, por exemplo:  

\[agent-1001-wss\] 

type=aor 

max\_contacts=1 

remove\_existing=yes 

\[agent-1001-wss\] 

type=auth 

auth\_type=userpass 

username=agent-1001-wss 

password=\<senha do agente\> 

Esse endpoint está configurado para usar o transporte WSS e inclui as opções necessárias de WebRTC (via webrtc=yes ). O uso de webrtc=yes ativa automaticamente: RTP em perfil AVPF, exigência de DTLS-SRTP para mídia ( media\_encryption=dtls ), verificação de fingerprint, ICE suportado, 11   
multiplexação RTCP, entre outros . Em outras palavras, o Asterisk espera que esse endpoint use mídia criptografada via DTLS e negocie ICE, coerente com navegadores. (Certifique-se de que o codec Opus esteja instalado no Asterisk se for usá-lo.) 

**Dica:** A configuração acima é um exemplo simplificado. A documentação confirma que apenas webrtc=yes já define todas as opções necessárias para WebRTC a partir do Asterisk 16 . Ainda assim, você pode ajustar detalhes como codecs ou definir   
12 

explicitamente ice\_support=yes , media\_encryption=dtls , etc., se desejar mais controle. Lembre também de configurar corretamente o contexto de dialplan e outras opções de segurança conforme seu cenário. 

Após aplicar as configurações, **reinicie ou recarregue** o Asterisk ( core restart now ou pjsip  reload se apenas editou pjsip.conf) para que as mudanças tenham efeito. Use comandos de diagnóstico no Asterisk CLI para verificar: pjsip show transports deve listar o transporte WSS ativo, por exemplo mostrando uma linha com Transport: transport-wss wss 0.0.0.0:8089 

13   
. E pjsip show endpoint agent-1001-wss exibirá detalhes do endpoint, confirmando que ele 

tem webrtc habilitado, etc. 

3  
**Configurando o websocket\_path no cliente e no servidor** 

Para que o cliente JsSIP consiga conectar, o **caminho do WebSocket** deve coincidir com o que o Asterisk espera. Por padrão, o Asterisk escuta as conexões WebSocket SIP na URL base wss://\<host\>:8089/ ws – ou seja, o “path” padrão é **/ws** . Não é necessário (nem possível via configuração do Asterisk) mudar esse path padrão na maioria dos casos; é codificado internamente como /ws quando o módulo de WebSocket está ativo . Somente se você definiu um prefix no http.conf (o que é   
4 

incomum) o path poderia virar /\<prefix\>/ws .  

No projeto em questão, o front-end utiliza variáveis de ambiente para compor a URL WSS. Observando o código do componente Softphone (JsSIP), vemos que se **NEXT\_PUBLIC\_WEBSOCKET\_PATH** não 14   
estiver definido, ele assume '/ws' por padrão . Ou seja, mesmo que no “painel do projeto” essa variável apareça vazia, o aplicativo usará /ws automaticamente. Combinado à variável de host e porta, o URL ficará algo como wss://\<HOST\>:8089/ws . De fato, na inicialização do JsSIP, o código faz:  

const host \= process.env.NEXT\_PUBLIC\_ASTERISK\_HOST; 

const websocketPath \= process.env.NEXT\_PUBLIC\_WEBSOCKET\_PATH || '/ws'; ... 

const socket \= new JsSIP.WebSocketInterface(\`wss://${host}${websocketPath} \`); 

14 15 

Portanto, **no cliente** certifique-se de usar exatamente /ws no caminho do WebSocket. Se o endereço configurado foi wss://click-to-call-clicktocal.hvlihi.easypanel.host:8089/ws , isso aparenta correto. Um erro comum seria omitir o “/ws” (ex: usar apenas wss://dominio:8089 ), o que 

resultaria em falha de conexão imediatamente. Verifique no código de configuração do JsSIP ou SIP.js do seu projeto se o URL está correto. No exemplo da biblioteca SIP.js, por exemplo, usa-se 16   
wsServers: \['wss://\<asterisk-host\>:8089/ws'\] . Assim, **não é necessária nenhuma rota personalizada** no servidor para /ws – basta usar o caminho padrão. Se você estivesse usando um proxy reverso (não é o caso aqui), então sim, teria que encaminhar o /ws para o Asterisk adequadamente (incluindo cabeçalhos Upgrade), mas com conexão direta isso não se aplica. 

Em resumo: mantenha NEXT\_PUBLIC\_WEBSOCKET\_PATH definido como /ws (ou deixe-o não definido para cair no default /ws mesmo). No Asterisk, não há uma configuração explícita chamada “WEBSOCKET\_PATH” – ele espera /ws automaticamente quando o servidor HTTP está ativo.  

**Observação:** Caso tenha alterado o servername ou prefix em http.conf, lembre-se de que o header Host e o path precisam casar. Em geral, usar o host exato do certificado e /ws funciona. Não é necessário configurar nada em dialplan relativo a /ws ; a sinalização SIP sobre WebSocket é tratada inteiramente pela stack PJSIP uma vez que a conexão é estabelecida. 

**Verificações de CORS e cabeçalhos HTTP na conexão WebSocket** 

Durante o handshake WSS (que é um upgrade HTTP), o navegador envia um header Origin: 

indicando a origem da página web. Em aplicações onde a página web é servida de um domínio/porta diferente do Asterisk, isso caracteriza um cenário **cross-origin**. Por padrão, o Asterisk **não impõe** 

4  
**restrições de CORS para o endpoint SIP /ws** , então geralmente não é preciso configurar nada para 

permitir a conexão. O handshake WebSocket do Asterisk aceitará a conexão desde que a solicitação esteja bem formada. (Diferentemente da API REST ARI do Asterisk, que tem a opção allowed\_origins em ari.conf para proteger as conexões WebSocket de eventos, o transporte SIP sobre /ws não requer configuração de origem.)  

No entanto, se você encontrasse erros de console do navegador relacionados a **Access-Control-Allow Origin**, poderia investigar se algum proxy intermediário ou servidor web está interceptando. No seu caso, **sem proxy reverso visível e usando diretamente a porta 8089**, não deve haver bloqueio de origem. Mesmo assim, para garantir, você pode inspecionar via ferramentas de desenvolvedor do navegador a requisição de handshake (solicitação GET com Upgrade: websocket). Verifique se o servidor retorna o status 101 Switching Protocols . Se sim, o handshake passou – e qualquer política de CORS não bloqueou. 

Outro cabeçalho importante no handshake é o Sec-WebSocket-Protocol: sip . O JsSIP normalmente envia este cabeçalho indicando que o subprotocolo desejado é SIP. O log do Asterisk ao 17   
aceitar a conexão deve indicar “protocol 'sip' accepted” . Se por acaso o cliente ou servidor não negociar o protocolo corretamente, pode haver falha. Mas com JsSIP/Asterisk isso é padrão, então é raro ser um problema. 

**Resumo:** CORS geralmente não é um impedimento para SIP sobre WebSocket no Asterisk. Certifique-se apenas de usar **WSS** se a página estiver em **HTTPS** – navegadores bloqueiam chamadas a ws:// não 18   
seguro de contexto https. O código do projeto detecta isso e usa WSS quando necessário . Se a página estiver em HTTP (durante desenvolvimento), aí pode usar ws:// (porta 8088). Em produção, página em HTTPS deve usar WSS na 8089, como configurado. 

**Diagnóstico do erro de desconexão WebSocket 1006** 

O código de status **1006** no WebSocket indica um fechamento anormal da conexão – geralmente ocorre quando a conexão é abortada sem um código de fechamento enviado. Quando você vê erro 1006 logo após conectar, significa que o socket fechou abruptamente. Vamos dissecar possíveis causas e como diagnosticá-las: 

1\.    
**Falha no handshake TLS (certificado não confiado):** Uma causa comum para desconexão 

imediata é o navegador rejeitar o certificado do servidor. Se os certificados TLS não forem confiáveis pelo navegador, este aborta a conexão durante o handshake SSL/TLS, resultando em código 1006 no JavaScript (sem muitos detalhes). Isso acontece frequentemente com certificados **autoassinados** não aprovados. Embora você mencione que os certificados são “válidos”, vale confirmar se o certificado usado pelo Asterisk é de uma CA reconhecida. Se for autoassinado, uma solução de teste é **abrir diretamente** https://seu-dominio:8089/ws   
no navegador – ele provavelmente exibirá um aviso de segurança; aceite-o para adicionar exceção de certificado. Somente após confiar, o WebSocket poderá conectar (o Asterisk não envia *Access-Control* nem nada especial, então o navegador silenciosamente fecha se não confia no certificado) . Em ambientes de produção com certificados válidos (por exemplo, Let’s   
19 

Encrypt), isso não deve ocorrer. Para verificar no seu caso, utilize o comando OpenSSL indicado acima ou clique no cadeado na barra de endereços durante uma tentativa de conexão WSS e veja os detalhes do cert. Certifique-se de que o certificado não esteja expirado e corresponda exatamente ao host em uso. 

5  
2\.    
**Erro na negociação SSL/Transport no Asterisk:** Do lado do servidor, se houver um problema ao 

estabelecer a conexão TLS, o Asterisk pode fechar o socket. Veja os logs do Asterisk em nível verbose/debug no momento da tentativa. Com logger set level VERBOSE on e logger  set level DEBUG on você pode captar mais detalhes. Mensagens como Problem setting  20   
up ssl connection: ... Internal SSL error indicam falha na camada TLS. Isso pode ocorrer se, por exemplo, os certificados configurados não puderam ser carregados corretamente ou algum protocolo incompatível. Certifique-se de que a chave privada corresponde ao certificado e de que ambos estão legíveis pelo Asterisk (permissões corretas). Se o log indicar SSL\_shutdown() failed ou   
ast\_iostream\_start\_tls: ... Internal SSL error , é quase certo ser questão de certificado/Trust. No fórum, a orientação típica é aceitar o certificado no navegador (no caso de 21   
autoassinado) ou usar uma CA válida. 

3\.    
**Ausência de transporte WSS no PJSIP:** Outra causa de desconexão imediata pós-handshake é se o Asterisk aceita a conexão no nível HTTP mas não tem um transporte SIP associado. Nessa situação, o Asterisk pode fechar o WebSocket logo após abrir. Verifique no log do Asterisk se aparece a linha   
\== WebSocket connection from 'x.x.x.x:port' for protocol 'sip' accepted  using version '13' . Se você **não vir** essa mensagem de “accepted”, significa que a   
22 

conexão não chegou a ser tratada como SIP. Pode ser configuração ausente. Garanta que pjsip.conf possua o \[transport-wss\] ativo e carregado. Execute pjsip show  transports para confirmar . Se não estiver lá, recarregue o módulo PJSIP   
13 

( module reload res\_pjsip\_transport\_websocket.so ). Em alguns casos, se o chan\_sip ainda estiver carregado, ele pode causar conflitos; idealmente desative o chan\_sip se não utilizado (no Asterisk 18, PJSIP é padrão). Em sistemas FreePBX, por exemplo, deve-se habilitar “Chan PJSIP WS/WSS” nas configurações SIP. No seu deploy manual, seguir os passos de configuração acima garante isso. Sem o transporte, o Asterisk não sabe encaminhar a sinalização SIP recebida via websocket e finaliza a conexão. 

**Falha de registro SIP ou autenticação:** Se o WebSocket conecta mas logo em seguida o 4\.    
registro SIP falha (por credenciais incorretas, por exemplo), o JsSIP poderá fechar a conexão. No entanto, por padrão o JsSIP não fecha o socket imediatamente em falha de registro – ele emite evento de registrationFailed mas mantém o socket aberto para novas tentativas. Ainda assim, vale checar no console do navegador e logs do Asterisk se o registro do agente 

agent-1001-wss ocorreu. No CLI do Asterisk, pjsip show registrations (para clientes outbound) ou pjsip show contacts (para verificar se o endpoint registrou como contato) ajudam. Se aparecer “Forbidden” ou “Unauthorized” nos logs, reveja o usuário/senha configurados. Uma senha errada não costuma causar fechamento de socket imediato, apenas falha de registro SIP (código 403/401), então provavelmente não é o caso do erro 1006 logo ao conectar – mas é bom eliminar essa possibilidade. 

5\.    
**Timeout ou fechamento pela aplicação cliente:** Menos comum nesse cenário de “logo após conectar”, mas se o JsSIP não receber resposta de registro ou outro handshake (como resposta ICE ou SIP) ele poderia fechar. Certifique-se de que a comunicação não está sofrendo bloqueio por firewall de saída no cliente (por exemplo, algumas redes corporativas podem bloquear porta 8089). Teste em outra rede ou via VPN para descartar essa hipótese. 

6  
**Como diagnosticar efetivamente:** Recomendamos fazer um teste manual da conexão WSS fora do navegador para separar problemas de certificado e servidor: 

•    
Use a ferramenta **WSCat** (WebSocket CLI) se disponível: por exemplo, wscat \-c wss://seu 

dominio:8089/ws . Se seu certificado for autoassinado, acrescente \--no-check para ignorar validação . O WSCat tentando conectar e mantendo ou não a conexão vai indicar se o   
23 

servidor está aceitando. Você pode então tentar enviar um handshake SIP manual (um REGISTER via WSCat) para ver respostas, embora isso seja avançado – mas apenas a conexão em si já diagnostica a camada TCP/TLS/WebSocket. 

•    
Nos logs do Asterisk, aumente a verbosidade e ative debug do PJSIP: pjsip set logger on . 

Assim você verá as mensagens SIP indo e vindo pelo WebSocket. Se o handshake WebSocket ocorreu, você deverá ver o registro SIP do JsSIP chegando (uma mensagem REGISTER no logger). Se nem isso aparece, o problema está antes (TLS ou handshake WS).  

Verifique a saída de http show status novamente após as tentativas – se o contador de   
•  

sessões WebSocket ativas aumentar momentaneamente e cair, indica conexões abortando. 

Em resumo, o erro 1006 geralmente aponta para **problema de camada de transporte**. Nos casos reportados, 90% das vezes está relacionado a certificado não confiável ou configuração TLS incorreta   
. Sendo seu certificado supostamente válido, foque em checar logs de erro SSL no Asterisk e 21   
garantir que o cliente confia no emissor do certificado (verifique cadeia completa – use um SSL Labs test ou similar para seu host se possível). 

**Confirmando que a porta 8089 está aberta e acessível via WSS** Além de verificar internamente, convém testar a porta 8089 do exterior: 

**Teste de navegador:** Abra um navegador e navegue para https://click-to-call   
•  

clicktocal.hvlihi.easypanel.host:8089/httpstatus . O path /httpstatus é um dos 24   
endpoints padrão do Asterisk (lista status HTTP) . Se você ver alguma resposta (pode ser um JSON ou texto de status do Asterisk) ou até mesmo um certificado sendo apresentado, significa que consegue atingir o servidor Asterisk via HTTPS naquela porta. Se a conexão não completar, o navegador dará erro de timeout ou conexão recusada – o que indica problema de conectividade (DNS, firewall ou porta fechada). Lembrando que, ao acessar esse URL diretamente, se o certificado for autoassinado ele exibirá aviso de segurança – útil para aceitar como mencionado. 

•    
**Teste com Telnet/Netcat:** Não funciona direto para TLS, mas você pode testar a abertura TCP simples: telnet seu-dominio 8089 ou nc \-vz seu-dominio 8089 . Se a porta estiver acessível, deve conectar (embora não possa falar TLS corretamente, vai pelo menos dizer “Connected” antes de fechar). Se estiver bloqueada, verá “Connection refused” ou timeout. 

•    
**Log no Asterisk:** Quando o handshake WebSocket ocorre, o Asterisk loga um aviso de conexão. Mesmo sem sucesso final, pode aparecer algo como \== WebSocket connection from  22   
'IP:porta' closed se chegou a abrir e fechar . Isso confirma que a porta recebeu algo. 

Se não houver nada nos logs diante de uma tentativa, suspeite de que os pacotes nem chegaram (firewall). 

•    
**Firewall do container/host:** No Docker Compose, a porta 8089 está mapeada corretamente 

5   
. Verifique se não há regras de firewall do host bloqueando (ex: iptables, security groups em 7  
cloud). No painel easypanel, veja se a porta precisa ser liberada manualmente. Às vezes plataformas PaaS exigem especificar portas customizadas a abrir. 

Em suma, validar a porta 8089 aberta envolve checar do lado do servidor (status do Asterisk e netstat) e do lado do cliente (tentativas via navegador, openssl, wscat). Ambas as perspectivas já foram discutidas; se todas indicarem ok, podemos confiar que a conectividade base está estabelecida. 

**Configurações corretas no Asterisk (http.conf e pjsip.conf) para WebSocket** 

Resumindo as configurações necessárias e corretas: 

•    
**http.conf:** deve conter em \[general\] : 

•    
enabled=yes e bindaddr=0.0.0.0 (ou o IP específico, se preferir) para habilitar o HTTP. 

Opcionalmente bindport=8088 se quiser também HTTP não seguro. 

•    
tlsenable=yes para ativar TLS, e tlsbindaddr=0.0.0.0:8089 para escutar no 8089 em 

todas interfaces (você pode usar :: para IPv6 também). 

•    
tlscertfile e tlsprivatekey apontando para seus arquivos de certificado e chave. No 

exemplo do Compose, eles armazenam em /etc/asterisk/keys/asterisk.crt/key .  **Importante:** esses caminhos devem ser acessíveis dentro do container (no docker-compose.yml 25 26   
foi montado volume asterisk\_certs exatamente nesse diretório ). 

•    
(Opcional) tlscafile se precisar indicar CA intermediárias ou raiz (não costuma ser necessário se seu .crt já contém a cadeia completa ou se é um certificado público). Também não esqueça que a chave não pode ter permissão global de leitura – por segurança o Asterisk 27   
recusará carregar se estiver acessível a outros usuários . 

3 4   
Após configurar, um http show status deve mostrar o HTTPS bound na 8089 e listar /ws . Caso contrário, revise as linhas. Qualquer erro de parser em http.conf pode fazer o Asterisk ignorar a seção TLS. 

•    
**pjsip.conf:** deve ter pelo menos: 

• 8   
Definição do transporte WSS conforme mostrado . Nome comum é transport-wss . Garanta que protocol=wss . O bind pode ser 0.0.0.0:8089 ou apenas 0.0.0.0 (siga a nota mencionada – usar tlsbindaddr no http.conf é preferível). Inclua protocol=wss mesmo que pareça óbvio, pois é necessário para o Asterisk carregar o módulo de transporte WebSocket. 

•    
As configurações de certificado no transporte são opcionais; se não fornecer, ele usará as do 9   
http.conf. Se quiser ser explícito, pode usar cert\_file e priv\_key\_file no transporte . **Dica:** mantenha os arquivos .crt e .key separados (não use um .pem combinado aqui a menos que especifique o mesmo arquivo em ambos campos). Evite usar nomes incorretos – no fórum 27   
acima um usuário apontou o mesmo arquivo para cert e key erroneamente . 

•    
Definições do endpoint WebRTC conforme discutido: use webrtc=yes . Além disso, **certifique** 

**se de habilitar SRTP no Asterisk**. Quando webrtc=yes está ativo, o Asterisk espera criptografia de mídia obrigatoriamente (DTLS-SRTP). Isso requer o módulo res\_srtp carregado e o pacote libsrtp instalado no sistema. Caso contrário, você terá erro ao tentar estabelecer mídia (e possivelmente a chamada cairá). No endpoint, se preferir, pode definir 28   
explicitamente media\_encryption=dtls para clareza . 

•    
Outras opções: ice\_support=yes (se webrtc=yes , já estará sim) para suporte a ICE (negociação de candidates reflexivos/relay – necessária para WebRTC NAT traversal).  media\_use\_received\_transport=yes e rtcp\_mux=yes também ficam ativos via  

8  
webrtc=yes – isso garante que o áudio flua no mesmo 5-tuple do ICE (evitando problemas de NAT). 

•    
Configure também o **endpoint do lado do cliente** (agente) para usar encryption e ICE. No seu JsSIP, pelo código, eles já obtêm servidores ICE via /api/webrtc/ice-servers e passam em configuration. JsSIP por padrão usará DTLS se detecta que o servidor aceita (via o campo no SIP WebSocket handshake ou simplesmente por estar em WSS). Portanto, do lado do cliente, não há muito a configurar além do URL WSS e credenciais SIP corretas – o resto (SDP com ICE/DTLS) é automático se o Asterisk indicou suporte. 

**Exemplo consolidado:** De acordo com um guia de configuração WebRTC , uma   
• 29 30 configuração típica combinará: 

•    
Em http.conf, habilitar WSS na 8089 com certificados. 

•    
Em pjsip.conf, transporte WSS \+ endpoint com webrtc. Por exemplo:  

; http.conf 

\[general\] 

enabled=yes 

tlsenable=yes 

tlsbindaddr=0.0.0.0:8089 

tlscertfile=/etc/asterisk/keys/ 

asterisk.pem ; (pem contendo cert+chave ou use arquivos separados) tlsprivatekey=/etc/asterisk/keys/asterisk.key 

; pjsip.conf 

\[transport-wss\] 

type=transport 

protocol=wss 

bind=0.0.0.0 

\[webrtc\_user\] ; (exemplo de endpoint) 

type=endpoint 

context=default 

disallow=all 

allow=opus,ulaw 

webrtc=yes 

transport=transport-wss 

auth=webrtc\_user 

aors=webrtc\_user 

\[webrtc\_user\] 

type=auth 

auth\_type=userpass 

username=webrtc\_user 

password=senhaSegura123 

\[webrtc\_user\] 

9  
type=aor 

max\_contacts=1 

Com isso, o cliente SIP.js/JsSIP poderia conectar em wss://\<host\>:8089/ws com URI  31 30   
sip:webrtc\_user@\<realm\> e registrar . 

**CORS no http.conf:** Existe a opção allowed\_origin no http.conf (geral, não ARI) em   
•  

versões mais recentes, mas ela se aplica ao recurso de *websocket de administração/ARI*, não ao SIP. Normalmente não precisa alterar nada disso para SIP. 

•    
**Opção keep-alive:** O Asterisk PJSIP tem um keep-alive de transporte global, que por padrão envia pacotes *ping* (CRLF) a cada 90 segundos em transportes WebSocket . Isso ajuda a   
32 

manter a conexão viva através de NATs e detectar desconexões. Você pode ajustar em pjsip.conf \[global\] keep\_alive\_interval=90 (90 segundos é default). O JsSIP também tem mecanismo de keep-alive via CRLF. Em geral, não é necessário mexer nisso a menos que tenha problemas de timeout frequente (alguns NATs cortam conexões ociosas em 30s, então reduzir o intervalo para, digamos, 20s pode ajudar nesses casos). Mas cuidado: keep-alive muito curto pode sobrecarregar; 30-60s é razoável se precisar. O importante é saber que essa funcionalidade existe e está ativa por padrão, contribuindo para estabilidade. 

**Path /ws vs / – é necessário configurar rotas personalizadas?** 

Conforme já enfatizado, o **caminho correto é /ws** . Muitos desenvolvedores se confundem achando que apontar para a raiz do servidor seria suficiente, mas o Asterisk só realiza o upgrade para protocolo 4   
SIP WebSocket na URI exata /ws . Qualquer outro path (por exemplo / ou /sip ) retornará um erro ou nada, resultando em fechamento do socket sem handshake completo. Não é possível reconfigurar este path via arquivo de configuração do Asterisk (a menos que modificasse o código-fonte ou usasse um proxy para redirecionar).  

No cenário típico, **não configure nada de “rota customizada”** no Asterisk para WebSocket – apenas use /ws no cliente. A confusão pode surgir se um proxy web estivesse em frente: por exemplo, se tivesse um Nginx fazendo proxy de wss://dominio/sip para internamente wss:// 127.0.0.1:8089/ws . Nesse caso, o path público seria /sip mas o Nginx repassaria para /ws . Porém, aqui não temos isso, pois a porta 8089 está exposta diretamente.  

Para verificar definitivamente: você pode tentar um curl \-v https://\<host\>:8089/ws (com \-k 

se for autoassinado). A resposta esperada do Asterisk a uma requisição HTTP GET nessa URI é um código **404 ou 400**, porque o Asterisk espera um WebSocket upgrade ali, não um GET simples. Por exemplo, um teste pode mostrar retorno como 405 Method Not Allowed (se não usou Upgrade) ou algo do tipo. Isso já confirma que o servidor está reagindo no path correto. Se você obtiver um 404 em 

/ws mas um 200 em /httpstatus , então surpreendentemente o /ws não foi habilitado – o que indica problema de config, pois normalmente /ws apareceria no http show status conforme citado. Mas se tudo estiver certo, não precisa tocar em rotas. 

Em resumo, **mantenha o uso de /ws** no cliente JsSIP. Não é preciso (nem recomendado) usar path / para WebSocket SIP com Asterisk. A única situação de alterar path seria se configurou um prefix no http.conf (ex.: prefix=/asterisk faria o WebSocket ficar disponível em /asterisk/ws ). Se não fez isso, não há diferença – use /ws .  

10  
Seguindo este guia, você terá configurado o Asterisk 18 corretamente para suporte a WebRTC via WSS e diagnosticado possíveis causas para desconexão. Uma vez ajustado certificado, configurações e garantido o caminho e porta corretos, a conexão entre JsSIP (frontend) e Asterisk deve se estabelecer de forma **estável**. Lembre-se de registrar o agente e testar uma chamada (o número 9999 de eco é útil para teste). Observar os logs do Asterisk durante a chamada ajudará a confirmar se fluxos RTP estão indo/voltando (use rtp set debug on para depurar áudio, se necessário). Com todos os componentes configurados – TLS, WebSocket, DTLS-SRTP, ICE – em pleno funcionamento, a chamada WebRTC deve fluir sem desconexões inesperadas, atingindo a estabilidade desejada na comunicação segura entre o cliente JsSIP e o Asterisk. 

**Referências Utilizadas:** 

• 2 3 4 8   
Documentação oficial Asterisk – Configuração de WebRTC (HTTP e WebSocket) 

• 9 7 23   
Trechos de configuração e guia interno do projeto *Click-to-Call* 

• 1 33   
Guia *SIPERB* de Asterisk WebRTC (módulos necessários, exemplos de conf) 

• 21 19   
Fórum da Comunidade Asterisk e StackOverflow – dicas de resolução de erros WSS e TLS • 14   
Código-fonte do frontend (JsSIP) indicando uso do path /ws por padrão e configuração de conexão WebSocket.  

•    
Logs e exemplos de saída de comandos (pjsip show transports, netstat) demonstrando 13 4   
transporte WSS ativo e status do HTTP server com /ws habilitado .  

1 12 16 29 30 31 33   
Asterisk WebRTC \- SIPERB WebRTC Softphone 

https://www.siperb.com/kb/article/asterisk-webrtc/ 

2 3 4 8 11 19 24   
Configuring Asterisk for WebRTC Clients \- Asterisk Documentation 

https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/ 

5 25 26   
docker-compose.yml 

https://github.com/voacatofe/click-to-call/blob/98c6f5765d1dad09da087a2d1db606c477446833/docker-compose.yml 

6 10 13 27   
Astrerisk 20 and pjsip and webrtc \- Asterisk WebRTC \- Asterisk Community 

https://community.asterisk.org/t/astrerisk-20-and-pjsip-and-webrtc/103178 

7 9 18 23 28   
WSS-IMPLEMENTATION-GUIDE.md 

https://github.com/voacatofe/click-to-call/blob/98c6f5765d1dad09da087a2d1db606c477446833/docs/WSS IMPLEMENTATION-GUIDE.md 

14 15   
SoftphoneAdaptive.tsx 

https://github.com/voacatofe/click-to-call/blob/98c6f5765d1dad09da087a2d1db606c477446833/apps/web/src/components/ SoftphoneAdaptive.tsx 

17   
sipML5 WSS \+ Asterisk? \- Google Groups 

https://groups.google.com/g/doubango/c/miP15eJD4TM/m/G1WMqGvkg3IJ 

20 21 22   
SSL websocket connection error \- Asterisk WebRTC \- Asterisk Community 

https://community.asterisk.org/t/ssl-websocket-connection-error/107538 

32   
HTTP session\_keep\_alive not working for the websocket \- Asterisk WebRTC \- Asterisk Community 

https://community.asterisk.org/t/http-session-keep-alive-not-working-for-the-websocket/103409 11