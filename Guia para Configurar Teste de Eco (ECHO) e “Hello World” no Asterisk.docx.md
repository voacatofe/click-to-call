# Guia para Configurar Teste de Eco (ECHO) e “Hello World” no Asterisk

**Cenário:** Você possui um Asterisk 18.24.3 rodando em uma VPS (com easypanel), usando PJSIP e um softphone (possivelmente via WebRTC) para realizar chamadas internas. O objetivo é configurar e testar duas funcionalidades básicas no seu projeto: um ramal de **teste de eco** e um ramal de **teste de áudio “Hello World”**. A seguir apresentamos um passo a passo detalhado para fazer esses testes funcionarem, incluindo verificação de configuração, ajustes de rede (NAT) e considerações de atualização do Asterisk.

## Passo 1: Verificar o Dialplan (extensões de teste)

Primeiramente, certifique-se de que o **dialplan** (arquivo extensions.conf) contém as extensões de teste para eco e para o áudio “Hello World”, e que elas estão no contexto correto:

* **Extensão de Eco (9999):** Deve atender a chamada, reproduzir a mensagem de início de teste, iniciar o aplicativo de eco e depois reproduzir a mensagem de término. Por exemplo:

* exten \=\> 9999,1,Answer()  
   same \=\> n,Wait(1)  
   same \=\> n,Playback(demo-echotest)  
   same \=\> n,Echo()  
   same \=\> n,Playback(demo-echodone)  
   same \=\> n,Hangup()

* Nesse caso, ao discar 9999 o Asterisk atenderá e você deverá ouvir a mensagem de orientação do teste de eco, tudo que você falar será repetido de volta (eco) e em seguida ouvirá a mensagem de conclusão antes da chamada encerrar[\[1\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L10-L17). *(A mensagem “demo-echotest” diz: “You are about to enter an echo test...” ou seja, avisa que tudo que for dito será retornado, para medir latência[\[2\]](https://www.voip-info.org/asterisk-sound-files/#:~:text=%2A%20demo,may%20end%20the%20test%20by).)*

* **Extensão “Hello World” (8888):** Deve atender a chamada, aguardar um instante e então reproduzir um áudio dizendo “Hello World”. Exemplo:

* exten \=\> 8888,1,Answer()  
   same \=\> n,Wait(1)  
   same \=\> n,Playback(hello-world)  
   same \=\> n,Hangup()

* Ao discar 8888, espera-se que o Asterisk atenda e reproduza a mensagem “hello-world” antes de desligar[\[3\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L18-L23).

Verifique no seu arquivo **extensions.conf** se essas entradas existem e se estão no contexto correto. No seu projeto, estas extensões de teste foram adicionadas no contexto \[from-internal\][\[4\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L9-L17)[\[5\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L18-L25). Certifique-se de que o **contexto do seu ramal (softphone)** é o mesmo onde essas extensões foram definidas, para que a chamada consiga encontrá-las. Por exemplo, se o seu endpoint PJSIP (ramal do agente) estiver com context=from-internal, ele conseguirá acessar as extensões 9999/8888[\[6\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template#L6-L14). (No arquivo de configuração PJSIP do projeto há um template definindo context=from-internal para o agente 1001, garantindo que chamadas originadas dele usem o contexto correto[\[6\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template#L6-L14).)

**Dica:** Abra o console do Asterisk (asterisk \-rvvv) e faça uma chamada de teste (disque 9999 do softphone). Observe no console se a chamada entra no contexto e executa as prioridades. Você deve ver linhas como \-- Executing \[9999@from-internal:1\] Answer()... e mensagens \-- Playing 'demo-echotest'... etc. Isso confirmará que o dialplan está sendo acionado corretamente.

## Passo 2: Verificar Registro do Softphone e Configuração PJSIP

Garanta que o **softphone** (ou cliente WebRTC) esteja registrado no Asterisk com sucesso antes de fazer os testes:

* **Registro PJSIP:** Confirme que as credenciais (nome de usuário/senha) do seu endpoint PJSIP estão corretas e que o Asterisk mostra o endpoint como disponível. Por exemplo, se você usa o agente 1001, verifique com o comando pjsip show endpoints no CLI se ele aparece como Avail ou registrado.

* **Transporte:** Se estiver usando um softphone SIP tradicional, ele pode utilizar UDP/TCP na porta 5060\. Já um cliente WebRTC no navegador utilizará o transporte **WSS** (WebSocket seguro) na porta 8089\. No seu pjsip.conf deve haver uma definição do transport **wss** (e possivelmente **ws** se necessário) para suportar WebRTC[\[7\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/docs/exemplo-implementacao-asterisk.md#L26-L34). Certifique-se que o Asterisk está ouvindo na porta adequada e que os certificados TLS (cert.pem e key.pem) estão configurados, pois navegadores exigem WSS com TLS.

* **Codecs:** Verifique os codecs permitidos tanto no Asterisk quanto no softphone. No seu projeto, o endpoint está configurado para permitir **opus**, **ulaw (PCMU)**, **alaw (PCMA)**, etc[\[8\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template#L8-L16). Assegure-se de que o softphone também suporta e negocia um desses codecs. *Dica:* Para WebRTC, o navegador geralmente usa Opus por padrão; caso use opus, confirme que o módulo do codec Opus está carregado no Asterisk. O Asterisk 18 suporta Opus, mas em alguns casos pode ser necessário carregar módulos específicos (como codec\_opus e res\_format\_attr\_opus). Você pode verificar com module show like opus no CLI – se não estiver carregado e você precisar dele, edite modules.conf ou instale o pacote do codec. (Problemas de codec podem impedir áudio – por exemplo, uma falha de negociação pode aparecer como erro de “no translator path” se o codec não estiver disponível[\[9\]](https://wener.me/notes/voip/asterisk/webrtc#:~:text=Couldn%27t%20negotiate%20stream%200%3Aaudio).)

* **Contexto:** Conforme mencionado, confirme que o campo context do endpoint PJSIP aponta para o contexto onde estão as extensões de teste (por exemplo, from-internal). No seu projeto isso já estava ajustado no template do pjsip[\[6\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template#L6-L14), mas vale checar no arquivo de configuração efetivo. Se o softphone não estiver no contexto correto, ao discar 9999/8888 o Asterisk responderá com “No route to extension” ou silêncio, pois não encontrará a extensão naquele contexto.

## Passo 3: Confirmar Instalação dos Áudios de Teste

Um dos motivos mais comuns para “não ouvir áudio” é a ausência dos arquivos de som ou falha ao tocá-los. No seu caso, precisamos dos arquivos **demo-echotest**, **demo-echodone** e **hello-world** instalados:

* **Pacotes de áudio do Asterisk:** Verifique se os **sound packages** estão instalados. Pelo Dockerfile do seu projeto, vemos que ele instala os sons em inglês (asterisk-sounds-en) e até baixa os arquivos de alta qualidade (formato WAV) do conjunto “core sounds”[\[10\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile#L12-L16). Isso inclui explicitamente o arquivo hello-world.wav e outros (como beep, etc.) dentro de /var/lib/asterisk/sounds/en[\[11\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile#L2-L5). Portanto, em princípio, os arquivos necessários já estão no contêiner.

* **Volumes e diretórios:** Se você estiver usando Docker com volumes montados (por exemplo, montando um diretório local em /var/lib/asterisk/sounds), tenha cuidado: isso pode **sobrescrever** os arquivos que foram adicionados na imagem. Certifique-se de que o diretório montado contém os subdiretórios e arquivos de som necessários. Caso contrário, considere não montar esse volume de sons (deixe usar os da imagem) ou copie os arquivos WAV necessários para o volume. Em ambientes não-Docker, apenas confirme que no diretório de sons do Asterisk (geralmente /var/lib/asterisk/sounds/ ou /usr/share/asterisk/sounds/) existem os arquivos: demo-echotest.\*, demo-echodone.\* e hello-world.\* (podem estar em formato .wav, .gsm etc., dependendo do pacote instalado).

* **Linguagem padrão:** Por padrão, o Asterisk usa a língua “en” (inglês) para procurar áudio. Como seus arquivos estão em /sounds/en/, isso está ok. Se você tivesse configurado outra língua no canal, precisaria ter os áudios naquele idioma ou ajustar. Mas normalmente não é o caso aqui.

* **Permissões:** Como você instalou via pacote e o Dockerfile já ajusta as permissões do diretório de sons para o usuário asterisk[\[12\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile#L24-L27), não deve ser problema. Mas se estivesse executando Asterisk diretamente no sistema, checaria se o usuário do processo Asterisk tem acesso de leitura aos arquivos de áudio (permissões corretas).

Após essas verificações, faça um teste chamando a extensão 8888 (Hello World). **Se os arquivos estiverem presentes e tudo ok, o console do Asterisk deverá mostrar** algo como \-- Playing 'hello-world' (language 'en') quando a chamada for atendida. Da mesma forma, ao chamar 9999, deve mostrar Playing 'demo-echotest' etc. Se o console indicar “file not found” ou não mostrar nada após o Answer(), então há algo de errado com os arquivos de áudio – revalide a instalação dos arquivos conforme necessário.

## Passo 4: Ajustes de NAT e Firewall para Áudio

Se a chamada atende mas você **não ouve áudio nenhum** (nem as mensagens nem o eco), muito provavelmente é um problema de **rede/NAT** ou firewall bloqueando o tráfego de mídia (RTP). A transmissão de áudio no Asterisk (usando RTP) requer configurações especiais quando o servidor ou o cliente estão atrás de NAT. Siga estes subpassos:

* **Configurar endereço externo no Asterisk:** Informe ao Asterisk qual é seu IP público ou domínio. No caso do chan\_PJSIP, isso pode ser feito no bloco de transport ou global do pjsip.conf (usando as opções external\_signaling\_address e external\_media\_address) **ou** de forma mais geral em rtp.conf. Uma forma simples: edite o arquivo /etc/asterisk/rtp.conf e em \[general\] acrescente:

* externaddr \= SEU\_IP\_EXTERNO   ; ou domínio resolvível  
  localnet \= 192.168.0.0/16     ; (exemplo de rede local, ajuste conforme seu caso)

* O externaddr (ou externip) garante que o Asterisk use o IP público nas negociações SDP em vez de seu IP local interno[\[13\]](https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat#:~:text=,use%20the%20externip%20everywhere%20else). Já o localnet define a(s) sub-rede(s) consideradas locais (onde o IP local pode ser usado). No seu caso, como é uma VPS na nuvem, talvez não tenha uma rede local típica 192.168. *– pode usar a rede interna do provedor ou simplesmente 127.0.0.1/8 se aplicável. O importante é que* *externaddr esteja correto*\* (pode ser um IP fixo ou um domínio DNS apontando para ele).

* **Habilitar opções NAT no PJSIP:** No seu endpoint PJSIP, já devem estar ativadas opções adequadas, como rtp\_symmetric=yes e force\_rport=yes (essas opções fazem com que o Asterisk envie o áudio de volta para o IP/porta de origem do RTP do cliente, e ignore endereços/portas incorretos devido a NAT). Pela configuração do projeto, o template do agente WebRTC já inclui rtp\_symmetric e force\_rport sim[\[14\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template#L12-L15). Certifique-se de que isso esteja presente se estiver usando outro endpoint. Antigamente, no chan\_sip, usava-se nat=yes para comportamento similar[\[13\]](https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat#:~:text=,use%20the%20externip%20everywhere%20else) – no PJSIP essas diretivas acima cumprem esse papel.

* **ICE e STUN (para WebRTC):** Você mencionou usar PJSIP e possivelmente WebRTC (transport WSS). O Asterisk suporta **ICE** para atravessar NAT em WebRTC. Sua configuração já mostra ice\_support=yes no endpoint[\[15\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/docs/exemplo-implementacao-asterisk.md#L40-L48), o que é bom. Isso permite que o Asterisk inclua candidatos ICE (possíveis endereços/portas para mídia). No entanto, para o ICE funcionar completamente, é recomendado configurar um servidor **STUN** para o Asterisk descobrir seu próprio IP público, ou então especificar manualmente conforme mencionado. Você pode configurar STUN no Asterisk via res\_stun\_monitor.conf ou mesmo no rtp.conf (dependendo da versão) – mas se já definiu externaddr e a VPS tem IP fixo, não é obrigatório. O navegador do cliente WebRTC normalmente também usará STUN para descobrir seu IP público. **Resumindo:** com ICE ativo e externaddr correto, o Asterisk deverá fornecer ao cliente o endereço correto para enviar e receber RTP.

* **Portas RTP no firewall:** Verifique se seu firewall (da VPS ou da rede local) está liberando o tráfego UDP de mídia. Por padrão, o Asterisk usa as portas UDP **10000-20000** para RTP (áudio). Certifique-se de abrir/permitir esse range de portas UDP para o IP do seu servidor. Também abra a porta SIP sinalização, se aplicável (5060 UDP/TCP) e a porta 8089 TCP (para WSS) no firewall. Lembre-se que cada chamada usará portas dentro daquele range para enviar/receber áudio, então um bloqueio nessas portas causará áudio unidirecional ou nenhum áudio. Conforme documentação, é necessário **liberar todo o intervalo UDP configurado em rtp.conf (ex: 10000–20000) e a porta SIP**[\[16\]](https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat#:~:text=On%20your%20NAT%2Ffirewall%20,SIP%20signalling) para evitar problemas de áudio.

* **Teste de conectividade ICE (se WebRTC):** Uma dica é utilizar a ferramenta do Chrome/Firefox (WebRTC internals) ou o log do Asterisk (pjsip set logger on \+ rtp set debug on) para verificar para onde o áudio está sendo enviado. Se você vir o Asterisk enviando RTP para um IP privado do cliente (ex.: 192.168.x.x) em vez do público, então faltou configurar externaddr/ICE corretamente. Ou se o cliente está tentando enviar para um IP privado do servidor, idem.

Depois desses ajustes, reinicie o Asterisk para garantir que as novas configurações entrem em vigor. Assim, quando o softphone se comunicar, o áudio deverá fluir nos dois sentidos (o Asterisk conseguirá enviar os áudios do Playback/Echo para você e receber sua voz no Echo).

## Passo 5: Realizar os Testes de Chamada

Com tudo configurado, é hora de testar na prática:

* **Teste de Eco (9999):** Do seu softphone registrado, **disque 9999**. A chamada deve atender imediatamente (não deverá tocar – o dialplan usa Answer()). Você deve ouvir a mensagem inicial do teste de eco (em inglês, algo como “You are about to enter an echo test…”). Fale algo no microfone e você deverá ouvir de volta sua própria voz com um pequeno atraso. Isso confirma que o áudio está indo do softphone para o Asterisk e retornando para você. Após alguns segundos de silêncio ou se pressionar \#, o Asterisk tocará a mensagem de conclusão do teste (“demo-echodone”) e desligará a chamada. Observe no console do Asterisk que ele deve registrar a execução do Echo() e Playback()[\[1\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L10-L17).

* **Teste “Hello World” (8888):** Disque **8888** do softphone. Novamente, a chamada deve ser atendida imediatamente e após \~1 segundo de espera você deverá ouvir claramente a mensagem “Hello world” (provinda do arquivo de áudio). Em seguida a ligação é desligada pelo dialplan. No console deverá aparecer algo como Playing 'hello-world'[\[3\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L18-L23).

Se ambos os testes acima funcionaram (ou seja, você ouviu os áudios corretamente), parabéns – seu Asterisk está configurado para reproduzir áudio para os ramais internos\! 🎉

Caso **ainda não ouça áudio**, passe para o passo de troubleshooting a seguir.

## Passo 6: Solução de Problemas (caso o áudio ainda não toque)

Se após seguir os passos anteriores o problema persistir (chamada completando mas sem áudio), considere as seguintes ações de depuração:

* **Monitorar RTP no Asterisk:** Execute no console do Asterisk: rtp set debug on. Isso fará o Asterisk imprimir todos os pacotes RTP enviados/recebidos. Ao refazer a chamada de teste, veja se os pacotes RTP estão fluindo e para quais endereços. Se não aparecer nada ou aparecer apenas “enviando para X.x.x.x:yyyy”, sem receber, pode ser firewall bloqueando retorno ou endereço errado. Esse comando ajuda a identificar se o áudio está chegando ao servidor e se o servidor está enviando áudio de volta.

* **Verificar Logs de Áudio/Codec:** Veja se o Asterisk loga algum aviso após executar o Playback/Echo – por exemplo, “Unable to find file...” (arquivo não encontrado) ou “No translator path” (problema de codec). Qualquer mensagem de erro pode indicar o ponto do problema (arquivo ausente, codec incompatível, etc.). Corrija conforme o erro: arquivo ausente (reinstale/adicione o som), codec (habilite ou mude codecs), etc.

* **Teste com outro cliente:** Se você estiver usando um cliente WebRTC custom (por exemplo, integrado na aplicação web via JS SIP), tente testar também com um **softphone SIP desktop** (como Zoiper, MicroSIP, etc.) conectando via UDP/TCP, para isolar se o problema é específico do ambiente WebRTC. Se no softphone desktop (sem WebRTC) o áudio funcionar, então o problema pode estar na configuração WebRTC (certificado, ICE/TURN faltando, etc.). Se em ambos não funciona, é algo no lado do Asterisk/servidor.

* **TURN server (WebRTC NAT extremo):** Se o cliente WebRTC e o Asterisk **ambos** estiverem atrás de NATs difíceis (por exemplo, você testando de uma rede restrita), pode ser necessário configurar um servidor **TURN** para relé de mídia. O Asterisk pode usar um TURN server configurado em res\_stun\_monitor.conf para fornecer candidatos relay. Mas isso geralmente é último recurso se ICE STUN não bastar. Para testes iniciais em redes normais, não deve ser necessário se o Asterisk tem IP público.

* **Verificar dispositivo de áudio:** Certifique-se de que o alto-falante e microfone do dispositivo do softphone estão funcionando e selecionados corretamente. Às vezes, “não ouvir áudio” pode ser simplesmente volume no mudo, dispositivo incorreto selecionado, etc. Parece óbvio, mas vale checar – teste ouvindo uma chamada SIP normal entre dois ramais, por exemplo, para ver se o áudio sai.

* **Debug SIP/SDP:** Ative pjsip set logger on (ou sip set debug on se fosse chan\_sip) no console e refaça a chamada. Examine a mensagem INVITE/200 OK trocada – especialmente a seção SDP que lista codecs e endereços. Verifique se o Asterisk está informando o IP correto na mídia (deve ser seu IP público) e se o codec negociado é suportado. Veja também se ocorre a troca de chave DTLS (no caso de WebRTC, deve haver logs de DTLS handshake; se falhar, o áudio não flui). Problemas de certificado poderiam impedir o estabelecimento do SRTP no WebRTC.

* **Timing/timing source:** Em raros casos, o Asterisk pode não tocar áudio se não tiver uma fonte de clock/timing adequada. No passado, versões antigas exigiam módulo dahdi ou similar para tons. Hoje em dia o Asterisk vem com res\_timing\_pthread ou res\_timing\_timerfd por padrão. Verifique com module show like timing se há um módulo de timing carregado. Se não houver nenhum, carregue um (ex: module load res\_timing\_timerfd.so). Sem timing, aplicações como Playback/Echo não enviam áudio. **(Observação:** Como você instalou via pacote oficial, é bem provável que isso já esteja ok – apenas mencionando para completude.)

Após cada mudança, teste novamente a chamada 9999/8888 e veja se houve melhora. A cada teste, use o console do Asterisk para monitorar o comportamento.

## Passo 7: Considerar Atualização do Asterisk (opcional)

Você perguntou se **vale a pena atualizar** o Asterisk da versão 18.24.3-r1 para uma versão mais nova. A resposta em geral é **sim**, principalmente em um projeto em desenvolvimento:

* Asterisk **18** é uma versão LTS (Long Term Support) lançada em 2020 e terá **fim de suporte pleno em outubro de 2025** (com correções de segurança até 2026\)[\[17\]](https://community.freepbx.org/t/centos-its/91105?page=2#:~:text=To%20provide%20dates,goes%20EOL%20October%2019th%202027). Já o Asterisk **20** é a próxima LTS (lançada final de 2022\) com suporte pleno até 2026 e manutenção até 2027[\[17\]](https://community.freepbx.org/t/centos-its/91105?page=2#:~:text=To%20provide%20dates,goes%20EOL%20October%2019th%202027). Atualizar para a versão 20 LTS lhe daria mais longevidade de suporte e inclui diversos bugfixes e melhorias introduzidas desde a série 18\.

* **Compatibilidade:** Antes de atualizar, leia as notas de atualização (Upgrade Notes) do Asterisk 20 para verificar mudanças que possam exigir ajuste na sua configuração. Por exemplo, verifique se sua configuração PJSIP, dialplan e integração AMI/ARI continuarão funcionando sem modificações. Versões LTS costumam manter alta compatibilidade, mas é bom confirmar (por exemplo, o Asterisk 20 removeu o chan\_sip leg legado, mas você já usa PJSIP, então sem problemas).

* **Procedimento de atualização:** Como você está usando Docker/Alpine, a atualização pode implicar usar uma imagem base diferente. Você poderia alterar no Dockerfile para asterisk:20-alpine (se disponível) ou especificar apk add asterisk=20.x. Verifique nos repositórios Alpine se há pacote para Asterisk 20.\*. Caso use uma imagem oficial do Docker, existem imagens para Asterisk 20 LTS. Teste em um ambiente de staging antes de aplicar na produção.

* **Benefícios potenciais:** Além do suporte estendido, versões mais novas podem melhorar aspectos de WebRTC (DTLS, ICE) e desempenho. Se estiver enfrentando algum bug específico na 18 que já foi corrigido em versões posteriores, a atualização ajudará. Contudo, se o seu sistema estiver estável após configurações, não é obrigatório atualizar imediatamente – mas planeje fazê-lo dentro do período de suporte.

Em resumo, após configurar corretamente o **teste de Echo e Hello World**, seu próximo passo opcional seria migrar para Asterisk 20 LTS para garantir suporte futuro. Mas resolva primeiro o problema de áudio na versão atual para então migrar com confiança.

---

**Referências Utilizadas:** Detalhes de configuração foram obtidos dos arquivos do seu projeto no GitHub e da documentação do Asterisk. Por exemplo, o dialplan de teste do projeto define as extensões 9999/8888 conforme mostrado acima[\[1\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L10-L17)[\[3\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L18-L23), e o Dockerfile indica a instalação dos áudios “hello-world” e demais[\[10\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile#L12-L16). Recomendações sobre NAT e portas baseiam-se em guias da comunidade Asterisk[\[13\]](https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat#:~:text=,use%20the%20externip%20everywhere%20else)[\[16\]](https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat#:~:text=On%20your%20NAT%2Ffirewall%20,SIP%20signalling). Informações sobre o ciclo de vida das versões Asterisk foram obtidas em comunicados oficiais[\[17\]](https://community.freepbx.org/t/centos-its/91105?page=2#:~:text=To%20provide%20dates,goes%20EOL%20October%2019th%202027). Siga esses passos com calma e, qualquer dúvida, consulte a documentação oficial do Asterisk ou os fóruns da comunidade para problemas mais específicos. Boa sorte com seu projeto\! 🛠️📞

---

[\[1\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L10-L17) [\[3\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L18-L23) [\[4\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L9-L17) [\[5\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf#L18-L25) extensions.conf

[https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/extensions.conf)

[\[2\]](https://www.voip-info.org/asterisk-sound-files/#:~:text=%2A%20demo,may%20end%20the%20test%20by) Asterisk sound files CVS distribution

[https://www.voip-info.org/asterisk-sound-files/](https://www.voip-info.org/asterisk-sound-files/)

[\[6\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template#L6-L14) [\[8\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template#L8-L16) [\[14\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template#L12-L15) pjsip.conf.template

[https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/etc/pjsip.conf.template)

[\[7\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/docs/exemplo-implementacao-asterisk.md#L26-L34) [\[15\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/docs/exemplo-implementacao-asterisk.md#L40-L48) exemplo-implementacao-asterisk.md

[https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/docs/exemplo-implementacao-asterisk.md](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/docs/exemplo-implementacao-asterisk.md)

[\[9\]](https://wener.me/notes/voip/asterisk/webrtc#:~:text=Couldn%27t%20negotiate%20stream%200%3Aaudio) Asterisk WebRTC | Wener Live & Life

[https://wener.me/notes/voip/asterisk/webrtc](https://wener.me/notes/voip/asterisk/webrtc)

[\[10\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile#L12-L16) [\[11\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile#L2-L5) [\[12\]](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile#L24-L27) Dockerfile

[https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile](https://github.com/voacatofe/click-to-call/blob/b5c4981ffa8a78bc39b726656b47d9d3e4447ebc/asterisk/Dockerfile)

[\[13\]](https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat#:~:text=,use%20the%20externip%20everywhere%20else) [\[16\]](https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat#:~:text=On%20your%20NAT%2Ffirewall%20,SIP%20signalling) Asterisk and SIP behind NAT \- Server Fault

[https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat](https://serverfault.com/questions/576201/asterisk-and-sip-behind-nat)

[\[17\]](https://community.freepbx.org/t/centos-its/91105?page=2#:~:text=To%20provide%20dates,goes%20EOL%20October%2019th%202027) Centos \- It's \- Page 2 \- Distro Discussion & Help \- FreePBX Community Forums

[https://community.freepbx.org/t/centos-its/91105?page=2](https://community.freepbx.org/t/centos-its/91105?page=2)