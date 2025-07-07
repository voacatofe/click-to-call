# **Substituindo o Twilio por Asterisk Self-Hosted: Pesquisa e Recomendações Técnicas**

## **1\. Arquitetura Recomendada (Asterisk Self-Hosted em Ambiente SaaS)**

Para implementar chamadas *click-to-call* sem Twilio, a arquitetura sugerida envolve introduzir o Asterisk como motor de telefonia **self-hosted**, integrado ao backend Node.js/TypeScript e ao frontend React já existentes. Em linhas gerais, a solução se estruturaria assim:

* **Servidor de Telefonia (Asterisk)**: Instalado em um servidor Linux (possivelmente container Docker), atuando como PBX IP. Nele são configurados os ramais dos vendedores (agentes) e as conexões com troncos SIP para originar chamadas aos leads. Esse Asterisk deve ser exposto via protocolo SIP (UDP/TCP) e/ou via **WebRTC (WebSocket Secure)** para permitir que o agente utilize um navegador como telefone. A configuração multi-tenant pode ser feita via separação por contextos no dial plan ou até múltiplas instâncias, mas inicialmente um único Asterisk pode atender vários clientes diferenciando pelo identificador de usuário nas chamadas.

* **Backend Node.js**: Comunica-se com o Asterisk através de APIs como **AMI (Asterisk Manager Interface)** ou **ARI (Asterisk REST Interface)** para controlar chamadas em tempo real. Ou seja, quando o usuário clica em “Ligar” no CRM, o Node solicita ao Asterisk que inicie a chamada. O uso do ARI/AMI é fundamental, pois diferentemente do Twilio (que fornecia APIs e TwiML prontos), com Asterisk será necessário construir a lógica de chamadas via código[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=PitzKey%20%20June%202%2C%202023%2C,7%3A55am%20%205). Por exemplo, o backend pode usar a biblioteca Node `asterisk-manager` (AMI) ou `node-ari-client` (ARI) para enviar comandos de **originate** (originação de chamadas) e receber eventos de status. Essa abordagem permite implementar uma plataforma de comunicações sob medida (um **CPaaS** próprio) em cima do Asterisk[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=I%20assume%20that%20you%20are,to%20build%20your%20own%20CPaaS)[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=This%20is%20all%20doable%20with,stuff%20in%20ARI%20and%2For%20AMI).

* **Frontend React**: Continua fornecendo a interface para o usuário no CRM. Para integrar a telefonia, o frontend deve incluir um **componente de softphone Web** (ver seção 6\) caso opte-se por WebRTC. Nesse cenário, o navegador do vendedor se registra como um ramal SIP/WebRTC no Asterisk através de um **WebSocket seguro (wss)**. Quando o backend sinaliza o início de uma chamada (via eventos ou WebSocket), o frontend aciona o componente de discagem. Alternativamente, se usar SIP tradicional, o frontend apenas envia uma requisição para o backend realizar a ligação, e o agente atende no seu telefone SIP físico ou aplicativo externo.

* **Fluxo de Chamada (Click-to-Call)**:

  1. O vendedor clica em "Ligar" no CRM para um determinado lead.

  2. O frontend faz uma requisição à API do backend (Node) indicando o ID do agente/vendedor e o número do lead.

  3. O backend verifica permissões, saldo de minutos etc., e então instrui o Asterisk a originar a chamada. Isso pode ser feito de duas formas: (a) enviando um comando **Originate** via AMI/ARI para que o Asterisk ligue simultaneamente para o agente e para o lead e faça a ponte; ou (b) solicitando que o Asterisk chame primeiro o ramal do agente (WebRTC ou SIP) e, quando o agente atender, discar para o número do lead, conectando as duas partes na mesma conferência.

  4. O Asterisk estabelece a chamada: toca para o agente no navegador ou telefone SIP, e após atendimento, chama o lead via tronco SIP.

  5. Durante todo o processo, o backend recebe **eventos em tempo real** do Asterisk (chamada tocando, atendida, encerrada) para notificar o frontend (por WebSocket/HTTP) e para registrar no CRM.

  6. Ao finalizar, o backend coleta dados da chamada (duração, resultado, gravação se houver) e integra esses dados ao RD Station CRM (via APIs do RD Station).

**Multi-Tenancy:** Como se trata de um SaaS multi-cliente, é importante isolar o tráfego de cada cliente. Em Asterisk isso pode ser feito usando contextos separados no dialplan para cada empresa/cliente, garantindo que ramais e regras de discagem de um cliente não interfiram em outro. A base de dados do backend pode armazenar configurações de cada cliente (ex: números, ramais autorizados, etc.) e o Node pode gerar dialplans dinâmicos ou usar ARI para encaminhar as chamadas conforme essas regras[community.asterisk.org](https://community.asterisk.org/t/building-a-multi-tenant-asterisk-platform/98324#:~:text=,dial%20plans%20in%20the%20database). Em escala maior, pode-se considerar múltiplos servidores Asterisk, ou uso de um SIP proxy como **Kamailio/OpenSIPS** na frente para distribuir carga, mas para um MVP de baixo custo isso não é necessário de início[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=I%20assume%20that%20you%20are,to%20build%20your%20own%20CPaaS).

**Comparativo com Twilio:** Em resumo, tudo que o Twilio fazia (originação de chamadas, bridging, gravação, sinalização de eventos) pode ser reproduzido com o Asterisk, porém será “feito em casa”. Twilio internamente também usa tecnologias similares (há relatos de uso de Asterisk/FreeSWITCH por trás)[reddit.com](https://www.reddit.com/r/VOIP/comments/azj7qd/im_working_in_an_open_source_alternative_to_twilio/#:~:text=I%27m%20working%20in%20an%20open,their%20VoIP%20and%20Sms%2C). A grande diferença é que o Twilio fornecia uma camada de abstração pronta (TwiML, SDKs), enquanto com Asterisk você terá controle total, mas precisará implementar muita lógica por conta própria[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=PitzKey%20%20June%202%2C%202023%2C,7%3A55am%20%205). Felizmente, existem **frameworks open-source** inspirados no Twilio que podem ajudar ou servir de referência – por exemplo, o **Fonoster** (stack Node.js \+ Asterisk) que já provê APIs de voz, multi-tenancy, gravação em S3 etc[github.com](https://github.com/fonoster/fonoster#:~:text=Features), ou o **Jambonz** (Node.js \+ FreeSWITCH) recomendado pela comunidade para construir CPaaS aberto[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=This%20is%20all%20doable%20with,stuff%20in%20ARI%20and%2For%20AMI). Essas ferramentas indicam que a arquitetura proposta (Asterisk \+ Node \+ WebRTC) é viável e pode atender a um SaaS escalável, contanto que se esteja disposto a desenvolver as integrações necessárias.

## **2\. Requisitos de Servidor (VPS) – CPU, RAM e Banda**

Implementar o Asterisk self-hosted exigirá planejamento de capacidade do servidor, especialmente conforme o volume de ligações simultâneas cresce. Os requisitos mínimos podem ser modestos para iniciantes, mas devem ser escaláveis para suportar volumes médios/altos de chamadas. Aqui estão diretrizes baseadas em boas práticas e casos reportados:

* **Cargas Baixas (até \~20 chamadas simultâneas)**: O processamento de VoIP para poucas ligações é relativamente leve. Em geral, **menos de 20 chamadas simultâneas podem rodar em praticamente qualquer servidor atual**, sem necessidade de hardware especial[sangoma.com](https://sangoma.com/blog/asterisk-dimensioning-what-server-do-i-need/#:~:text=the%20peak%20call%20volume%2C%20and,they%E2%80%99ll%20generally%20register%20back%20to). Um VPS básico com 1 vCPU e 1–2 GB de RAM pode dar conta, desde que não haja tarefas pesadas como transcoding. Nesses cenários de baixo tráfego, **o gargalo tende a ser a conectividade de rede** (garantir baixa latência) mais do que CPU.

* **Cargas Moderadas (50–100 chamadas simultâneas)**: É perfeitamente viável suportar \~100 ligações ativas em um único servidor Asterisk. Um exemplo da comunidade: **100 chamadas VOIP consumiram apenas \~20% de CPU em um Xeon 4-core, com 4 GB RAM**[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=mcrichard%20%20June%201%2C%202017%2C,7%3A00am%20%202). Isso indica que uma VPS de 4 vCPUs e 4 GB RAM seria suficiente com folga para \~100 calls em codecs básicos (G.711 por exemplo). Testes mostraram 40 chamadas usando \~20% CPU nesse hardware[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=There%20should%20be%20no%20performance,using%20a%20lots%20of%20modules), e outro teste com 50 chamadas de 2-3 minutos ocupou apenas 10-13% de CPU em um servidor dual Xeon de grande porte[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=It%20is%20all%20depending%20on,this%20stayed%20well%20below%2010). Ou seja, o Asterisk é capaz de lidar com dezenas de chamadas por core desde que não se ative funcionalidades muito custosas. **Tabela ilustrativa:**

| Escala de Chamadas | CPU / RAM Aproximada | Observações |
| ----- | ----- | ----- |
| 1–20 simultâneas (baixo) | \~1 vCPU, 1–2 GB RAM | Qualquer servidor comum atende[sangoma.com](https://sangoma.com/blog/asterisk-dimensioning-what-server-do-i-need/#:~:text=the%20peak%20call%20volume%2C%20and,they%E2%80%99ll%20generally%20register%20back%20to). |
| \~50 simultâneas (médio) | \~2 vCPUs, 2–3 GB RAM | Uso de CPU leve se sem transcodificação. |
| \~100 simultâneas (moderado) | \~4 vCPUs, 4 GB RAM | \~20% CPU em 100 chamadas (G.711)[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=mcrichard%20%20June%201%2C%202017%2C,7%3A00am%20%202). |
| \>200 simultâneas (alto) | 8+ vCPUs, 8+ GB RAM (ou cluster) | Considerar escalar horizontalmente. |

* 

* **Tarefas que Impactam Performance**: Dois fatores principais podem aumentar bastante o consumo de CPU e I/O no Asterisk: **transcodificação de codecs** e **gravação de chamadas**. A transcodificação (por exemplo, chamadas entrando em GSM e saindo em G.711) é pesada – pode reduzir a capacidade de chamadas simultâneas em até uma ordem de grandeza[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=that%20point%20of%20view). Sempre que possível, evite transcodificar: use codecs uniformes end-to-end (idealmente G.711 ou Opus se WebRTC) ou habilite **media passthrough** (direcionar RTP direto entre endpoints) para aliviar o Asterisk. Já **gravar chamadas** (MixMonitor) adiciona uso de CPU e especialmente disco; para 100 chamadas gravadas simultâneas, espere uso intenso de I/O e considere discos rápidos. Como referência, a ativação de gravação em uma carga de 10 chamadas duplicou o número de canais ativos (cada chamada gera 2 canais, um por perna)[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=thanks%20to%20all%20for%20updating,on%20my%20request), e certamente requer mais CPU[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=Hi%2C). Portanto, dimensione com folga se for gravar todas as ligações – talvez \+30% CPU e armazenamento abundante (cada minuto de áudio G.711 ≈ 1 MB).

* **Largura de Banda de Rede**: Voz sobre IP não demanda largura absurda, mas deve-se garantir estabilidade. Uma chamada de voz padrão (codec G.711 ou OPUS em 8-20ms ptime) consome em torno de 80–100 kbps por **fluxo** de áudio. Isso significa \~100 kbps *up* \+ 100 kbps *down* por chamada ativa (pois há áudio em ambos sentidos). Em números, 10 chamadas simultâneas ≈ 2 Mbps bidirecional; 100 chamadas ≈ 20 Mbps bidirecional. VPS comuns com porta de 100 Mbps ou 1 Gbps dão conta facilmente desse tráfego, mas é crítico ter baixa latência e jitter. Para volumes maiores (centenas de chamadas), certifique-se de que o link do servidor seja gigabit e estável. **Uso de NAT:** se o Asterisk estiver em nuvem, provavelmente terá IP público direto; se atrás de NAT, configure corretamente RTP e SIP (ex: `externip`/`localnet` no Asterisk) para não perder pacotes de áudio.

* **Escalabilidade Horizontal**: Para futuro crescimento (ex: milhares de chamadas mês, centenas simultâneas), vale planejar uma arquitetura escalável. Inicialmente, pode-se aumentar a VPS (scale-up). Porém, existe limite prático para um só Asterisk – em testes de laboratório já se alcançou \>1000 chamadas num único servidor parrudo[vitalpbx.com](https://vitalpbx.com/blog/asterisk-pbx-multicore-4500-calls-test/?srsltid=AfmBOopbsm9LQeUnLfIZv2RknQS6qMZcJ06TjoCDsglUvYOkPEttbg6Z#:~:text=Is%20Asterisk%20PBX%20Multicore%3F%20Test,or%20processors%20in%20a%20system), mas em produção é prudente distribuir a carga. Um caminho é **containerizar o Asterisk com Docker/Kubernetes**, e subir instâncias extras dividindo clientes entre elas. Outra abordagem é usar um **SBC/SIP Proxy (Kamailio)** na frente roteando para múltiplos Asterisks em backend. De qualquer forma, para o MVP de baixo custo, começar com um servidor médio (4 vCPU, 4-8 GB) deve ser suficiente e econômico. Lembre também de não colocalizar serviços muito pesados no mesmo host (banco de dados, etc.) para não disputar recursos com o PBX[sangoma.com](https://sangoma.com/blog/asterisk-dimensioning-what-server-do-i-need/#:~:text=system%20resources%20on%20the%20server,down%20PBX%20at%20the%20same).

Em suma, um **VPS modestamente configurado pode suportar o MVP tranquilamente**, dado que mesmo 100 chamadas simultâneas (o que já é bastante para uma fase inicial) não exigem hardware de alto nível[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=mcrichard%20%20June%201%2C%202017%2C,7%3A00am%20%202). O importante é monitorar o uso de CPU/RAM à medida que clientes são incorporados, e ir ajustando vertical ou horizontalmente. A estabilidade e qualidade de voz dependem mais de **latência e jitter** do que de throughput puro, então escolha provedores cloud com baixa latência até os usuários (por exemplo, data center no Brasil para atender agentes no Brasil).

## **3\. Conexão do Agente: Comparativo WebRTC vs SIP Tradicional**

Uma decisão arquitetural importante é **como os agentes/vendedores irão se conectar ao sistema de telefonia** para realizar as chamadas. Existem dois cenários possíveis:

* **WebRTC (Telefone via Navegador)**: O agente realiza e recebe chamadas diretamente pelo navegador web (usando o computador ou smartphone, com microfone e áudio via WebRTC). Isso transforma o frontend React em um *softphone* embutido, sem necessidade de software adicional.

* **SIP Tradicional (Telefone IP ou Softphone externo)**: O agente utiliza um telefone IP físico na mesa ou um aplicativo softphone separado (por exemplo, Zoiper, X-Lite, Linphone) conectado via SIP padrão ao servidor Asterisk. A chamada do CRM então aciona esse dispositivo para discar.

A seguir, comparamos as duas abordagens em termos de custo, facilidade e usabilidade:

| Aspecto | WebRTC (Softphone no Navegador) | SIP Tradicional (App ou Telefone IP) |
| ----- | ----- | ----- |
| **Experiência para o usuário** | Muito conveniente: o agente não sai do CRM – pode ligar com um clique diretamente no browser. Não requer instalar nada extra[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=1.%20Browser,and%20install%20a%20separate%20application). Interface unificada (CRM \+ telefone juntos). | Menos integrado: o agente precisa usar um aplicativo separado ou aparelho. Pode ser necessário discar manualmente ou alternar de janela. |
| **Facilidade de configuração** | Simplicidade máxima para o usuário final. Basta acessar o sistema via HTTPS; a configuração SIP (domínio, ramal, senha) é feita em segundo plano pelo app web. Não há parâmetros manuais nem instalação de plugins[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=1.%20Browser,and%20install%20a%20separate%20application)[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=4,need%20to%20meet%20compliance%20requirements). | Configuração manual muitas vezes necessária: inserir endereço do servidor SIP, login/senha do ramal, codecs etc[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=1,technical%20users). Usuários não técnicos podem ter dificuldade. Além disso, firewall/NAT pode exigir ajustes (STUN, portas) no cliente SIP. |
| **Requisitos de software/hardware** | Apenas um navegador moderno (Chrome, Firefox, etc.) com acesso à câmera/mic. Utiliza APIs WebRTC nativas do browser – sem plugins. Funciona em PC e mobile (via browser)[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=1.%20Browser,and%20install%20a%20separate%20application). | Requer um **softphone** instalado (software) ou um **telefone IP físico**. Softphones podem ser gratuitos, mas ainda assim é um componente a mais. Telefones IP têm custo (cada ramal precisa de um aparelho) e logística de provisionamento. |
| **Custos de licenciamento** | WebRTC em si é gratuito e baseado em padrões abertos. Não há licenças por uso. Toda a stack (Asterisk, WebRTC, libs JS) é open-source. | Protocolos SIP são abertos também, mas alguns softphones profissionais podem ter custo de licença. Telefones físicos obviamente têm custo unitário. |
| **Qualidade e recursos de mídia** | WebRTC suporta codecs modernos como **Opus**, com qualidade de áudio superior e ajuste dinâmico à rede. Inclui por padrão voz em banda larga, cancelamento de eco, e também vídeo chamada se necessário. Permite recursos avançados como compartilhamento de tela facilmente[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=1,face%20conversations%20and%20virtual%20meetings). | Softphones SIP geralmente usam G.711 (áudio padrão) ou G.729 (com perdas). Qualidade pode ser boa, mas Opus nem sempre está disponível. Suporte a vídeo varia. WebRTC por ser web pode incorporar funções de colaboração (vídeo, chat) de forma mais integrada. |
| **Conectividade e NAT** | Usa comunicação via **WebSocket seguro (WSS)** na porta 443/8089 (configurável). Essa abordagem tende a atravessar firewalls corporativos com mais facilidade, pois é vista como tráfego HTTPS. Ainda assim, para áudio/transmissão WebRTC, às vezes precisa de um servidor **STUN/TURN** para contornar NAT simétrico. Mas em geral, WebRTC foi concebido para web, com boa penetração através de NAT usando ICE. | O SIP tradicional (UDP/5060 ou TCP) muitas vezes é bloqueado por firewalls ou sofre com NAT (por isso surgiram ALG, STUN, etc.). Requer mais cuidado de rede: liberar portas RTP, SIP ALG desativado nos roteadores, etc. Algumas empresas bloqueiam tráfego SIP, o que pode complicar agentes remotos. |
| **Complexidade de implementação (para desenvolvedor)** | Moderada: é preciso habilitar o WebRTC no Asterisk (gerar certificados TLS, configurar `http.conf` e `pjsip.conf` com transport WSS)[docs.asterisk.org](https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/#:~:text=You%20can%20use%20self,able%2C%20we%20highly%20recommend). Exige servir a página web via HTTPS. A programação no frontend envolve usar libs JS (ver seção 6\) para registrar e controlar chamadas. Há uma curva de aprendizado em tratar eventos WebRTC e possíveis problemas de navegador. | Baixa no lado do desenvolvedor do sistema, pois Asterisk lida com SIP nativamente sem camadas adicionais. Não é preciso desenvolver interface web de chamada – pode-se usar qualquer telefone SIP disponível. A complexidade recai sobre o usuário final configurar seu dispositivo. Em termos de sistema, possivelmente precisa prover instruções ao cliente para configurar telefones ou distribuir softphones pré-configurados. |
| **Usabilidade e Adoção** | Altíssima usabilidade: para o vendedor é transparente – clique e fala. Experiência moderna, semelhante a usar Google Meet ou Zoom, integrada ao fluxo de trabalho. Isso tende a aumentar adoção, já que não há esforço extra nem duplicidade de ferramentas (tudo dentro do CRM). Conforme estudos, soluções integradas e fáceis aceleram o contato com leads (o que aumenta conversões). | Pode gerar atrito na adoção: vendedores teriam que alternar entre CRM e app de telefonia. Se o softphone travar ou precisar de atualização, o usuário pode ter dificuldades. A integração de histórico de chamadas no CRM ainda é possível, mas não tão imediata quanto com WebRTC (no WebRTC, o próprio sistema “sabe” quando a chamada foi atendida, terminada, etc., sem depender de outro dispositivo). |

**Recomendação:** considerando **custo, facilidade e usabilidade**, o **WebRTC via navegador é a opção mais atraente**. Ele elimina a necessidade de investir em aparelhos ou suporte a softwares terceiros, e proporciona a melhor experiência ao usuário (ligação com um clique dentro da aplicação)[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=1.%20Browser,and%20install%20a%20separate%20application)[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=4,need%20to%20meet%20compliance%20requirements). Do ponto de vista de custos operacionais, usar WebRTC não tem tarifas adicionais – o tráfego de voz passa pela mesma infraestrutura de dados e tronco SIP; na verdade, pode economizar, pois evita ligações de retorno para o agente (no modelo tradicional, às vezes o PBX liga para o agente no telefone fixo/celular dele, gerando custo). Com WebRTC, o agente só precisa de internet.

A única desvantagem real do WebRTC é a **maior complexidade técnica inicial** para configurar: será necessário habilitar wss e DTLS no Asterisk (incluindo certificados válidos, pois navegadores não aceitam certificados autoassinados facilmente)[docs.asterisk.org](https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/#:~:text=You%20can%20use%20self,able%2C%20we%20highly%20recommend). Além disso, deve-se prever o uso de um **servidor TURN** para cenários de NAT pesado – embora inicialmente muitos testes possam funcionar só com STUN, em produção é seguro ter um TURN (há opções gratuitas ou de baixo custo como coturn). Porém, uma vez superado esse setup, os benefícios de um softphone web integrado superam essas dificuldades.

Em contrapartida, o **SIP tradicional** poderia ser considerado como solução temporária caso a equipe não queira implementar WebRTC de imediato. Por exemplo, para um MVP **poderia-se começar permitindo que o agente cadastre seu ramal SIP em um aplicativo de sua escolha** (ou usar um app open-source simples). Assim, o backend Asterisk origina a ligação chamando o ramal SIP do agente (no app externo) e o número do lead. Esse modelo funciona, porém entrega uma experiência inferior e exige mais do usuário. Dado que o objetivo é um produto SaaS competitivo, a **experiência “one-click” dentro do CRM é um diferencial** já oferecido pelas soluções atuais (RD/Zenvia, OmniSmart etc.). Portanto, **WebRTC é recomendado** para alinhar com a expectativa de uma solução **100% web e self-service**, mesmo que demande um esforço de desenvolvimento inicial maior.

## **4\. Implementação de Chamadas, Gravação e Eventos com Asterisk (Integração CRM)**

Sem o Twilio, todas as funcionalidades de chamada e logging devem ser reimplementadas utilizando o Asterisk e nosso próprio código. A seguir detalhamos como abordar cada aspecto: originar as chamadas, gravá-las, capturar eventos de estado e integrar tudo isso ao RD Station CRM.

**4.1 Originação de Chamadas (Click-to-Call):** No Twilio, uma chamada outbound era iniciada via API REST (`calls.create`) e controlada por TwiML. No Asterisk, o análogo é usar a interface de gerenciamento para **originar** uma chamada. Há duas principais opções:

*Via AMI (Asterisk Manager Interface):* usando o comando `Originate` do AMI, podemos pedir ao Asterisk: "Ligue do ramal X para o número Y e junte as chamadas". Por exemplo, a biblioteca Node `asterisk-manager` permite conectar na porta 5038 e enviar ações. Um desenvolvedor relatou CPU leve com 40 calls ativas.  
 Para ilustrar, com `asterisk-manager` faríamos:

 js  
CopiarEditar  
`ami.action('Originate', {`  
  `Channel: 'PJSIP/ramalAgent',`   
  `Exten: 'numeroDestino', Context: 'from-internal', CallerID: '...',`   
  `Priority: 1, Async: true`  
`});`

*  Isso ordena o Asterisk a criar uma chamada do agente para o destino (lead). O *dialplan* no contexto `from-internal` teria as instruções de discagem (por ex., discar para tronco SIP específico). Esse método é simples e rápido de implementar. Podemos obter retorno se a chamada foi enfileirada, etc., mas o acompanhamento detalhado é pelos eventos AMI.

* *Via ARI (Asterisk REST Interface):* O ARI expõe chamadas REST e WebSocket para controle de chamadas em nível de objeto. Poderíamos criar um **Stasis application** que captura canais e os conecta programaticamente. Ex: usar `POST /channels` para criar uma chamada para o agente, e ao evento de **pickup**, usar `POST /bridges` para discar para o lead e juntar na bridge. O ARI é poderoso e flexível, mas tem uma curva de aprendizado maior que o AMI. Contudo, para um SaaS robusto e futuro implementando lógica complexa (filas, IVRs customizados, etc.), o ARI seria ideal. Há clientes Node como `node-ari-client`[github.com](https://github.com/asterisk/node-ari-client#:~:text=asterisk%2Fnode,) e até suporte a Promises/Async. Se o MVP requer apenas click-to-call básico, o AMI pode ser suficiente inicialmente, migrando para ARI conforme necessidades avançadas.

**4.2 Dialplan e Lógica de Chamada:** Precisaremos configurar o dialplan do Asterisk (extensions.conf ou equivalente no PJSIP) de forma simples já que a lógica principal estará no código. Por exemplo, um contexto para chamadas outbound que apenas recebe um número e usa o tronco SIP:

text  
CopiarEditar  
`[from-internal]`  
`exten => _X.,1,NoOp(Ligando para ${EXTEN})`  
 `same => n,Dial(PJSIP/${EXTEN}@TroncoBrasil,60,L(3600000))  ; Liga via tronco, 60s, limita 1h`  
 `same => n,Hangup()`

Esse dialplan permite que quando o Originate cair nele com um número destino, o Asterisk faça a chamada externa. O ramal do agente seria discado via Originate diretamente (Channel: PJSIP/1001, por ex.). Alternativamente, podemos fazer Originate chamar primeiro o agente numa extensão especial, e quando ele atender, através do dialplan disparar a saída para o lead (usando `Bridge` ou transfer). A arquitetura exata pode variar, mas o importante é que o Node/AMI controlará o *quando* iniciar a chamada e com quais parâmetros, enquanto o Asterisk executa a discagem conforme as configurações definidas.

**4.3 Gravação de Chamadas:** Twilio permitia gravar facilmente passando `record=true` e então enviava o áudio para seu storage com um callback. Com Asterisk, **há total controle sobre gravação**, mas precisa ser habilitada manualmente:

* A forma mais simples é usar a aplicação `MixMonitor` no dialplan. Podemos inserir antes do Dial:  
   `same => n,MixMonitor(${UNIQUEID}.wav,abi)` – isto iniciará a gravação assim que a chamada entrar nesse passo, gravando ambos canais misturados em um WAV (ou outro formato). Ao final da chamada, o arquivo ficaria salvo no servidor (ex: em `/var/spool/asterisk/monitor/`). Podemos configurar para MP3 se instalar codecs, ou converter offline depois para economizar espaço.

* Outra abordagem: usar o ARI para gravar. Com ARI, poderíamos iniciar a gravação via API (ARI tem recurso de gravar canais ou bridges). Isso dá mais flexibilidade para pausar, parar, etc., via comandos REST. Entretanto, para MVP o MixMonitor já atende bem.

Uma vez gerado o arquivo de gravação, é necessário disponibilizá-lo ao frontend/CRM. Estratégias:

* Salvar em disco local e servir via um endpoint autenticado do próprio backend (ex: quando o usuário clicar para ouvir, o Node faz stream do arquivo WAV/MP3).

* Salvar em um storage externo (ex: Amazon S3 ou mesmo Google Drive API) e guardar a URL. O Fonoster, por exemplo, suporta envio direto para S3[github.com](https://github.com/fonoster/fonoster#:~:text=,Support%20for%20Google%20Speech%20APIs). No MVP de baixo custo, talvez manter localmente e limpar periodicamente seja aceitável, mas pensando em escala convém um storage na nuvem.

Também é importante nomear os arquivos de forma que possamos associar à chamada/lead (usar ${UNIQUEID} ou ${TIMESTAMP}\_${AGENTID}). O Node, ao receber notificação de fim da chamada, pode armazenar no banco o caminho do arquivo para referência.

**4.4 Captura de Eventos de Chamada:** Para atualizar status da ligação em tempo real na interface e para saber o resultado (atendida, não atendida, ocupada etc.), precisamos capturar os eventos do Asterisk. Existem dois níveis de eventos:

**Eventos de Sinalização (AMI):** O AMI fornece eventos como `DialBegin`, `DialEnd`, `Hangup`, `BridgeEnter`, `BridgeLeave`, etc. Por exemplo, ao usar Originate para uma chamada externa, veremos um evento de *Dial* quando o tronco for chamado, com campos indicando sucesso/falha (causa de hangup). Ao término, um evento *Hangup* com a causa (busy, no answer, normal clearing). Usando a biblioteca de AMI no Node, podemos registrar callbacks para esses eventos. Exemplo:

 js  
CopiarEditar  
`ami.on('hangup', evt => { console.log("Call ended:", evt.Cause) });`

*  Com isso, podemos determinar se o lead atendeu ou não, duração (há também *CDR* no Asterisk que podemos consultar).

* **API REST Callback (webhooks internos):** Alternativamente, podemos configurar no dialplan o uso de **AGI (Asterisk Gateway Interface)** ou **ARI** para notificar diretamente nosso backend. Por exemplo, ao terminar a chamada, o dialplan pode executar um AGI script (pode ser um pequeno programa que faz HTTP POST para o Node com dados da chamada). No entanto, dado que já teremos conexão AMI/ARI aberta, é mais fácil utilizar os eventos por lá mesmo em vez de espalhar lógica no dialplan.

Na prática, o backend Node irá **ouvir os eventos do Asterisk e traduzir para ações**: atualizar status via WebSocket para o frontend (ex: “chamando…”, “atendida”, “encerrada”), e acionar a integração com CRM. O Twilio fazia isso via *webhooks* (statusCallback hits); aqui faremos internamente via nosso próprio canal aberto com o Asterisk.

**4.5 Integração com RD Station CRM:** Esta parte permanece similar ao que já era feito com Twilio, exceto que os dados vêm agora do nosso sistema. Ou seja, ao final de cada chamada, o backend reúne as informações relevantes:

* Lead/Contato relacionado, agente que ligou (esses vêm do contexto da requisição original).

* Horário, duração da chamada (podemos obter do evento de Hangup ou do CDR do Asterisk).

* Status/resultado: se foi atendida, não atendida, caiu, etc. (pelo hangup cause ou códigos SIP – e.g., BUSY, NO\_ANSWER).

* URL ou referência da gravação, se disponível.

* Outras métricas úteis: por ex., tempo de espera até atender, se precisamos registrar.

Com isso, usamos a API do RD Station CRM para **registrar uma atividade de call** no registro do lead. Conforme esboçado no código original, já existe provavelmente um método `logCallActivity` que fazia isso usando dados do Twilio. Vamos adaptá-lo para usar nossos dados. A estrutura JSON da atividade deve incluir duração, talvez um link para ouvir a gravação, notas, etc. – seguindo as capacidades do CRM.

Exemplo (fictício) via RD Station API:

js  
CopiarEditar  
`rdStationService.logCallActivity(contactId, {`  
   `duration: 65,`   
   `recordingUrl: 'https://ourapp.com/recordings/ABC123.wav',`   
   `notes: 'Chamada atendida pelo cliente, interessado no produto X.',`  
   `outcome: 'completed'`  
`});`

Isso garantirá que no CRM apareça no timeline do lead a ligação realizada, tal como acontecia com Twilio (que marcava automaticamente as chamadas no RD). Vale lembrar de lidar com erros ou limites da API do CRM, mas conceitualmente é idêntico – só muda que não temos mais o Twilio fornecendo esses dados, é nossa própria aplicação.

**4.6 Monitoramento e Relatórios:** Além da integração em tempo real, podemos armazenar os dados de chamada também em nosso banco (opcional, mas útil). O Asterisk gera **CDRs (Call Detail Records)** para cada chamada, que podem ser gravados em CSV ou diretamente em um banco de dados via ODBC. Configurar o CDR para um SQLite ou Postgre local pode criar uma tabela de histórico de chamadas com campos como tempo de início, duração, resultado, etc. Como opção, podemos usar esses dados para relatórios internos mais rápidos ou para eventuais auditorias. Plataformas existentes valorizam muito os relatórios de chamadas (quantas feitas, atendidas, perdidas, tempo médio, ranking por vendedor). Implementar isso do zero pode ser extenso, mas ter os registros brutos facilita gerar esses insights mais tarde, possivelmente com auxílio de ferramentas de BI ou do próprio CRM se ele consolidar atividades.

**Resumo deste tópico:** Tudo que se fazia via Twilio (iniciar call, receber eventos de ringing/answered/completed, gravar áudio e registrar no CRM) pode ser alcançado com Asterisk \+ Node. Contudo, **não vem “fora-da-caixa”** – será necessário programar usando AMI/ARI e dialplans simples para orquestrar as chamadas[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=PitzKey%20%20June%202%2C%202023%2C,7%3A55am%20%205). A vantagem é ter total controle (podemos customizar fluxos futuros como transferir chamada, adicionar conferência, etc.), e evitar os custos variáveis da Twilio. A desvantagem é o esforço de desenvolvimento e manutenção de mais componentes (monitorar o Asterisk, fazer backup de gravações, etc.). Mas para um produto SaaS diferenciado, esse investimento se paga ao reduzir custos e permitir inovação rápida em funcionalidades de voz.

## **5\. Custos de Tronco SIP no Brasil e Opções de Provedores**

Um dos principais motivadores para substituir o Twilio é o custo. Twilio cobra tarifas em dólar por minuto de chamada, o que no volume pode ficar caro. Utilizando um tronco SIP local no Brasil, espera-se **redução significativa de custo por minuto**. Vamos quantificar e citar opções de mercado:

**Tarifas da Twilio (referência):** Para chamadas originadas no Brasil, a Twilio atualmente cobra aproximadamente **US$0,0360 (\~R$0,18) por minuto para fixo** e **US$0,0623 (\~R$0,31) por minuto para celular**[twilio.com](https://www.twilio.com/pt-br/sip-trunking/pricing/br#:~:text=Brasil)[twilio.com](https://www.twilio.com/pt-br/sip-trunking/pricing/br#:~:text=Brasil%20%E2%80%93%20Celular). (Obs: Twilio diferencia ligações para "principais cidades" do Brasil a \~US$0,02, mas isso é o mínimo). Além disso, não há cobrança de canal simultâneo – paga-se somente minutos usados. Há também custo de números (DIDs) se forem usados, mas no nosso caso de click-to-call outbound talvez nem precisamos de número receptor.

**Tarifas de Provedores SIP nacionais:** Provedores brasileiros de VoIP costumam cobrar em **real por minuto**, com preços bem menores para chamadas locais. Por exemplo, a **Directcall** (provedor nacional) em seu plano de atacado anuncia tarifas de até **R$0,05/min para fixo local e R$0,18/min para móvel** (impostos inclusos) para altas quantidades de tráfego[directcall.com.br](https://directcall.com.br/produtos/sip-trunk-tarifado/#:~:text=R%24%200%2C05%205,nos%20sobre%20PLANOS%20DE%20ATACADO). Mesmo em planos básicos, as tarifas giram em torno de **R$0,06–0,14 para fixo** e **R$0,25/min para celular**[directcall.com.br](https://directcall.com.br/produtos/sip-trunk-tarifado/#:~:text=No%20PLANO%20TRADICIONAL%20%E2%80%9Cminimo%E2%80%9D%20de,n%C2%BA%20FIXO%20DDD%20do%20Brasil), valores consideravelmente inferiores aos da Twilio (que cobra \~R$0,30 móvel). Outro provedor, a **Virtual Call**, lista preço de **R$0,12/min fixo e R$0,45/min móvel** no Brasil[virtual-call.com](https://www.virtual-call.com/br/precos/sip-trunk#:~:text=Tarifas%20para%20destinos%20nacionais)[virtual-call.com](https://www.virtual-call.com/br/precos/sip-trunk#:~:text=R%24%200%2C45%20%2Fmin) – esses podem não ser os mais baixos, mas ainda ficam próximos de US$0,024 e US$0,09 respectivamente, já batendo a Twilio no fixo.

Em suma, **ligações para celular que custavam \~R$0,30/min com Twilio podem cair para R$0,18 ou até R$0,14**; e chamadas para fixo que custavam \~R$0,18 podem cair para R$0,05–0,12. Em porcentagem, isso representa economias de 30–60% no minuto. Em volumes altos (muitas horas de chamadas por mês), a diferença de custo torna a solução self-hosted muito mais viável financeiramente.

**Planos e mensalidades:** Diferente da Twilio (pay-as-you-go puro), muitos provedores brasileiros trabalham com planos mensais ou franquias:

* **Canais simultâneos:** Alguns vendem pacotes de canais (ex: 5 canais por R$X mensais) mais cobrança de minutos. Ex: um plano de *5 canais ilimitados* pode custar \~R$350/mês[pabx-cloud.net.br](https://www.pabx-cloud.net.br/sip-trunk-5-canais-ilimitado-preco#:~:text=SIP%20Trunk%205%20Canais%20Ilimitado,Uma%20An%C3%A1lise%20de%20Vulnerabilidade), permitindo chamadas ilimitadas para fixo/móvel dentro do pacote. É preciso avaliar se “ilimitado” tem letras miúdas (geralmente uso justo).

* **Franquia de minutos:** Outros oferecem uma franquia mensal (ex: pagar R$100 e ter Y minutos inclusos). A Directcall, por exemplo, nos combos exibidos, incluía um plano de minutos de R$25 ou R$75 nos combos de ramais[directcall.com.br](https://directcall.com.br/produtos/sip-trunk-tarifado/#:~:text=4%20Liga%C3%A7%C3%B5es%20simult%C3%A2neas%20Plano%20de,minutos%20R%2425)[directcall.com.br](https://directcall.com.br/produtos/sip-trunk-tarifado/#:~:text=No%20PLANO%20TRADICIONAL%20%E2%80%9Cminimo%E2%80%9D%20de,n%C2%BA%20FIXO%20DDD%20do%20Brasil). Isso sugere que com R$25 você já tem direito a um certo uso.

* **Cobrança pós-paga por minuto:** Também é comum (especialmente em atacado) você ter só um compromisso mínimo mensal e pagar os minutos consumidos conforme tarifa. A Virtual Call tinha contrato mínimo 12 meses com preços transparentes por minuto[virtual-call.com](https://www.virtual-call.com/br/precos/sip-trunk#:~:text=,12%20meses)[virtual-call.com](https://www.virtual-call.com/br/precos/sip-trunk#:~:text=Tarifas%20para%20destinos%20nacionais).

**Provedores a considerar:**

* **Zenvia/TotalVoice:** Esta empresa foi parceira do RD Station no telefone virtual nativo. Eles oferecem API de telefonia em português e tarifas competitivas nacionais. Poderia ser opção, embora utilizar API deles seria similar a Twilio (mas em BRL).

* **Directcall:** Como visto, foco em SIP Trunk com API, muitos recursos (0800, URA, etc.). Poderia fornecer tanto o tronco SIP quanto APIs auxiliares (mas no nosso caso só tronco SIP basta). Tem suporte local, o que é bom.

* **Voiicr (Siptrunk.com.br):** Oferece planos como canais ilimitados fixo+ móvel por preços fixos. Pode ser interessante para custo previsível.

* **Net2Phone (Sip do Brasil):** Grandes empresas VoIP também atuam no Brasil, às vezes com preços bons para atacado.

* **Plataformas Globais (Telnyx, Twilio Elastic SIP):** Telnyx, Voxbone, etc., têm presença no Brasil. Telnyx por exemplo cobra \~US$0,01 fixo e US$0,03 móvel (est. R$0,05 e R$0,15) e oferece canais ilimitados pagando uma mensalidade baixa por canal. Poderia ser opção se confiabilidade for prioridade, mas se há provedores locais com preço similar, é mais simples lidar em moeda local e suporte local.

**Custos adicionais:** Além do custo por minuto, considere:

* **DIDs (números recebidos):** Se em algum momento precisarmos de números receptíveis (ex: exibir um número local para o cliente ou receber retorno), a maioria cobra \~R$20–R$30 por número/mês[virtual-call.com](https://www.virtual-call.com/br/precos/sip-trunk#:~:text=Canais%20de%20voz%20,sem%20custo%20sem%20custo%20Opcional)[virtual-call.com](https://www.virtual-call.com/br/precos/sip-trunk#:~:text=Obtenha%20n%C3%BAmeros%20telef%C3%B4nicos%20nacionais%20de,todas%20as%20%C3%A1reas). Não parece foco agora (click-to-call é saída), mas vale saber.

* **Impostos:** Empresas brasileiras de VoIP já incluem impostos na tarifa (ICMS e FUST/FUNTEL), como visto nas notas da Directcall[directcall.com.br](https://directcall.com.br/produtos/sip-trunk-tarifado/#:~:text=R%24%200%2C05%205,nos%20sobre%20PLANOS%20DE%20ATACADO). Com Twilio, além de IOF na compra de créditos, tecnicamente deveria-se recolher impostos locais do uso (mas isso fica invisível para quem paga Twilio).

* **Qualidade vs Preço:** O mais barato nem sempre é melhor – vozes entrecortando ou instabilidade podem custar vendas. Por isso, fornecedores como OmniSmart destacam usar rotas de qualidade e operadoras próprias para confiabilidade. Então ao escolher tronco, considere qualidade comprovada. A economia de Twilio para local é grande, então há margem para escolher um provedor com bom equilíbrio de custo-benefício (não só o mais barato absoluto).

**Conclusão deste ponto:** Os **custos reais de um tronco SIP no Brasil são muito menores** que os da Twilio. Ao migrar, provavelmente você comprará créditos em reais e pagará menos por minuto. Por exemplo, **R$0,06 vs R$0,18** parece pouco em valores absolutos, mas é **1/3 do custo** por chamada[directcall.com.br](https://directcall.com.br/produtos/sip-trunk-tarifado/#:~:text=No%20PLANO%20TRADICIONAL%20%E2%80%9Cminimo%E2%80%9D%20de,n%C2%BA%20FIXO%20DDD%20do%20Brasil)[twilio.com](https://www.twilio.com/pt-br/sip-trunking/pricing/br#:~:text=Brasil%20%E2%80%93%20Celular) – em 1000 minutos, a diferença é grande. Portanto, do ponto de vista de viabilidade econômica, substituir Twilio por Asterisk \+ tronco SIP local trará **economia significativa e maior previsibilidade de custos**.

## **6\. Softphones Web Open Source e Bibliotecas para Frontend (React)**

Para permitir que os agentes façam chamadas pelo navegador (WebRTC), podemos aproveitar diversos projetos e bibliotecas open-source já existentes, em vez de construir um softphone web do zero. Abaixo, algumas opções de destaque compatíveis com React:

* **JsSIP / SIP.js (JavaScript SIP over WebRTC):** Bibliotecas em JavaScript que implementam um *user agent* SIP dentro do navegador usando WebRTC. O JsSIP é bastante maduro e suporta registro SIP via WebSocket, chamadas de áudio/vídeo, DTMF, etc. Por exemplo, um app React pode usar o JsSIP para se conectar ao Asterisk: definir servidor, usuário e senha do ramal, e pronto – a biblioteca cuida da sinalização. O **SIP.js** é similar; ambos derivam de conceitos do SIP over WebSocket. Segundo a documentação do SIP.js, com poucas linhas é possível iniciar uma sessão de chamada WebRTC entre usuários[sipjs.com](https://sipjs.com/#:~:text=SIP,users%20talking%20to%20one%20another). Essas bibliotecas são de baixo nível (fornecem APIs para call, hangup, onIncomingCall events, etc.), então demandam integrar com a UI manualmente – porém, são bem testadas e amplamente usadas.

* **React-SIP / React-Softphone (componentes React prontos):** Para acelerar a integração, existem componentes React open-source que encapsulam JsSIP/SIP.js. O projeto **react-softphone** por exemplo fornece um componente React funcional que já implementa um softphone básico integrado com Asterisk[github.com](https://github.com/prinze77/react-softphone#:~:text=import%20React%20from%20%27react%27%20import,from%20%27jssip). Basta passar uma configuração com o domínio SIP, URI do usuário, senha e servidor WS, e ele cuida do restante (registro, manter conexão, UI de chamada). No trecho de código de exemplo do react-softphone, vemos ele usando internamente `WebSocketInterface` do JsSIP para conectar ao `wss://...:8089/ws` do Asterisk[github.com](https://github.com/prinze77/react-softphone#:~:text=import%20React%20from%20%27react%27%20import,from%20%27jssip). Isso demonstra como esses componentes facilitam a conexão WebRTC: em vez de escrever toda a lógica, incorporamos o componente e ajustamos o estilo. Outra lib é o **react-sip** (no NPM), que fornece hooks React para estados de chamada, também construído sobre JsSIP.

* **Browser-Based WebRTC Phone (InnovateAsterisk):** Há aplicações completas de softphone web. O projeto **Browser-Phone** (do desenvolvedor InnovateAsterisk) é um softphone web completo e open-source, focado em integração com Asterisk[github.com](https://github.com/InnovateAsterisk/Browser-Phone#:~:text=A%20fully%20featured%20browser%20based,WebRTC%20SIP%20phone%20for%20Asterisk). Ele suporta chamadas de áudio e vídeo, hold, transferência, conferência, gravação local, SMS via SIP MESSAGE, lista de contatos, etc., tudo via navegador. Inclusive oferece um Docker para rodar facilmente. Ao carregá-lo, ele **conecta ao Asterisk via WebSocket e registra um ramal**, permitindo fazer chamadas entre contatos e gravar as ligações[github.com](https://github.com/InnovateAsterisk/Browser-Phone#:~:text=This%20web%20application%20is%20designed,line%20solution). Esse projeto pode ser usado como referência ou base – por exemplo, poderíamos forkar e integrar ao nosso frontend, ou extrair partes necessárias. Com ênfase no MVP, talvez usar algo tão completo seja “exagero”, mas vale saber que existe uma solução gratuita e poderosa testada pela comunidade.

* **Outros**: Existem softphones WebRTC comerciais e gratuitos (Blink, OnSIP, etc.), mas muitos não são open-source. Há também a possibilidade de usar **WebPhone universal Mizu**[mizu-voip.com](https://www.mizu-voip.com/Software/WebPhone.aspx#:~:text=WebPhone%20,a%20JavaScript%20SIP%20library) ou adaptar apps móveis via React Native (mas aí foge do escopo web puro). Considerando foco em React web, as mencionadas acima cobrem bem o necessário.

Ao escolher uma biblioteca, leve em conta:

* **Licença**: Os citados são MIT ou AGPL (no caso do Browser-Phone). MIT e similares permitem integrar livremente.

* **Comunidade/manutenção**: JsSIP e SIP.js têm comunidades ativas. Projetos como react-sip têm manutenção variável, mas o core (JsSIP) permanece confiável.

* **Funcionalidades**: Para nosso caso, precisamos no mínimo chamadas de áudio com DTMF (para digitar ramais de atendimento se precisar). Quase todos suportam isso. Se no futuro quiser permitir vídeo-chamada vendedor-cliente, convém usar libs que suportem (JsSIP suporta vídeo).

* **UI/UX**: Um componente existente economiza tempo, mas pode ter visual simples. Talvez seja necessário estilizar conforme o look\&feel da plataforma. O react-softphone, por exemplo, fornece algumas props de configuração (volume, notificações) e salva histórico de chamadas localmente[github.com](https://github.com/prinze77/react-softphone#:~:text=function%20App%28%29%20,Show%20Browser%20Notification%20of%20an), podendo ser suficiente inicialmente.

**Segurança dos Credenciais SIP:** Uma preocupação levantada por desenvolvedores ao integrar softphones web é **como não expor as credenciais SIP no frontend** (usuário e senha do ramal)[reddit.com](https://www.reddit.com/r/reactjs/comments/1iymsvp/how_to_securely_integrate_a_soft_phone_into_a/#:~:text=). De fato, se colocarmos no JavaScript do cliente o `username: "1001", password: "secret"` qualquer pessoa com acesso pode ver. Algumas estratégias para mitigar:

* Gerar credenciais dinâmicas de curta duração. Ex: quando o agente loga, o backend poderia criar um ramal temporário ou senha temporária válida por aquela sessão (usando AMI para atualizar a secret do ramal, ou usando PJSIP RealTime com DB). Assim, mesmo que vaze, expira logo.

* Restringir IP: se o Asterisk estiver configurado para aceitar registro SIP apenas do IP do servidor web (no caso do agente estar usando proxy... mas aqui cada agente tem IP próprio navegando, então isso é difícil).

* **Token WebRTC:** Uma abordagem diferente é ter uma espécie de "token" parecido com Twilio. Twilio Voice SDK usava Access Tokens JWT contendo autorização para um clientName. Poderíamos implementar algo semelhante: ao invés de usar SIP com usuário/senha, usar o **ARI** para criar canais direto sem registrar, ou usar algum gateway. Porém, isso complica muito – no MVP possivelmente aceitaremos expor a senha do ramal no frontend, contanto que seja uma senha dedicada para aquele propósito e com privilégios mínimos (e podemos logar qualquer uso indevido).

Em qualquer caso, **WebRTC sobre WSS é inerentemente seguro** (criptografa mídia e sinalização), e controlar as credenciais de forma razoável (senhas fortes, talvez trocadas periodicamente) deve ser suficiente em primeira instância.

**Conclusão desta seção:** Há um ecossistema rico de ferramentas para embutir a funcionalidade de telefone no app React:

* Para rapidez, usar um componente pronto como **react-softphone** pode nos poupar semanas de trabalho, entregando um softphone funcional integrado ao Asterisk com poucas linhas[github.com](https://github.com/prinze77/react-softphone#:~:text=import%20React%20from%20%27react%27%20import,from%20%27jssip).

* Se quisermos mais controle de UI, podemos usar **JsSIP** diretamente, construindo nossos hooks e componentes (IA pode ajudar a escrever esses componentes repetitivos).

* Projetos completos como **Browser-Phone** mostram que é possível ter um softphone Web full-fledge rodando 100% no navegador, conectado à nossa infra Asterisk, sem serviços pagos[github.com](https://github.com/InnovateAsterisk/Browser-Phone#:~:text=This%20web%20application%20is%20designed,line%20solution).

Portanto, a recomendação é **aproveitar essas bibliotecas open-source**. Elas são compatíveis com nossa stack (Node/React) e há bastante material de suporte. Isso se alinha com o objetivo de desenvolvimento assistido por IA, pois tecnologias populares como React \+ JsSIP terão muitos exemplos e respostas em fóruns que a IA pode usar para nos auxiliar.

## **7\. Etapas para Desenvolvimento de um MVP (com Assistência de IA, Custo Inicial Baixo)**

Por fim, traçamos um plano de ação para construir um MVP da plataforma substituindo Twilio por Asterisk, **maximizando o uso de ferramentas de IA para acelerar o desenvolvimento** e minimizando custos iniciais. A ideia é iterar rapidamente, obtendo uma versão funcional básica que já demonstre redução de custos e prepare o terreno para escala futura. Aqui vão as etapas sugeridas:

**Passo 1: Preparação do Ambiente e Ferramentas**

* *Configuração de Projeto*: Inicie um repositório para a nova infraestrutura de voz. Configure no backend Node.js as dependências necessárias – por exemplo, adicionar pacotes como `asterisk-manager` (AMI) ou `asterisk-ari-client`. No frontend, instalar libs como `react-sip` ou `jssip`. Utilize a **IA (ex: ChatGPT/Cursor)** para gerar uma lista de dependências e versões compatíveis.

* *Infraestrutura local*: Suba uma instância do Asterisk para desenvolvimento. Isso pode ser via Docker (existe uma imagem oficial do Asterisk 18). Peça ajuda à IA para escrever um `Dockerfile` ou `docker-compose.yml` adequado. Garanta que o Asterisk no container tenha porta 5060/UDP e 8089/TCP (para WSS) expostas. Use IA para conferir como habilitar no *pjsip.conf* o transporte WebSocket (instruções de configuração WSS)[docs.itgrix.com](https://docs.itgrix.com/additional-functions/configuring-webrtc-in-asterisk-freepbx#:~:text=Configuring%20WebRTC%20in%20Asterisk%20,usually%208089).

* *Integração contínua*: Configure scripts de build/test, possivelmente ajustando o pipeline CI/CD existente. Isso tudo ainda offline, sem custos.

**Passo 2: Configurar Asterisk Básico**

* *Dialplan e Tronco:* Escreva as configurações mínimas: defina um tronco SIP para algum provedor de teste (pode ser um provedor VoIP gratuito de teste, ou até usar Twilio SIP Trunk de teste se disponível, só para validar). Configure um contexto de saída conforme seção 4\. Use a IA para gerar um exemplo de `pjsip.conf` com um endpoint (ramal) WebRTC e outro endpoint trunk SIP. Por exemplo, a IA pode fornecer um *template* de configuração PJSIP para WebRTC (certificado TLS, etc.) e você ajusta para seu domínio.

* *Certificados TLS:* Gere um certificado local ou use Let’s Encrypt (para desenvolvimento, pode usar um self-signed e configurar o navegador para aceitar). Solicite à IA dicas para gerar certificados via script `ast_tls_cert` ou OpenSSL. A Medium Asterisk guide note: "recomendamos usar certificados válidos pois autoassinados são complicados nos browsers"[docs.asterisk.org](https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/#:~:text=You%20can%20use%20self,able%2C%20we%20highly%20recommend) – então já planeje talvez usar um domínio real e Let’s Encrypt (custo zero).

* *Testes iniciais:* Com Asterisk rodando local, registre um softphone comum (tipo Linphone) para validar que as chamadas básicas funcionam. Ou, se já quiser, teste o WebRTC: use o demo do JsSIP (tem uma página demo on-line) apontando para seu Asterisk. Nessa fase, resolva problemas de NAT (se em localhost, ok; se em cloud, configurar `externip`). A IA pode ajudar a interpretar erros de registro ou certificado, fornecendo soluções (por exemplo, habilitar `allow_reload` e verificar logs).

**Passo 3: Integração Node ↔ Asterisk (Originação de chamada)**

* *Conexão AMI:* Utilize o pacote `asterisk-manager` para conectar no Asterisk. A IA pode gerar um código de exemplo para autenticação no AMI (host, port, user, pass)[medium.com](https://medium.com/@jogikrunal9477/connecting-to-asterisk-using-node-js-and-asterisk-manager-interface-ami-026738ae7379#:~:text=const%20AsteriskManager%20%3D%20require%28%22asterisk,ami%20%3D%20new%20AsteriskManager). Teste se consegue receber um evento (por ex., `ami.on('FullyBooted',...)`). Isso valida a conexão.

* *Originate Call:* Implemente no backend um endpoint REST (ex: POST `/call`) que recebe `agentId` e `phoneNumber`. Dentro dele, use o objeto AMI para enviar uma ação Originate. Peça ajuda à IA para construir essa chamada properly (há várias opções, a IA pode lembrar da sintaxe exata do Originate). Coloque para originar um canal para o agente (PJSIP/agent) e discar para o número no contexto. Faça testes unitários simulando (se possível).

* *Eventos:* Registre handlers para eventos de chamada (Dial, Hangup). Inicialmente, faça-os simples: logar no console. Ex.: `ami.on('hangup', evt => console.log(evt.Channel, evt.Cause))`. Verifique, fazendo uma chamada de teste, se os eventos chegam e quais informações carregam (a IA pode auxiliar a entender campos do evento, ou você consulta a doc). Ajuste a lógica conforme necessidade (por ex., correlacionar pelo UniqueID da chamada para saber qual lead corresponde).

* *(Se optar por ARI:* Realize passos equivalentes – conectar via WebSocket ARI, implementar lógica de Stasis. Isso é um pouco mais complexo, talvez para MVP o AMI seja direto.)

**Dica:** como a IA é útil aqui? Ela pode gerar rapidamente exemplos de uso do AMI e ARI, evitar erros comuns e até escrever trechos de código comentados, agilizando o desenvolvimento que de outra forma exigiria ler muita documentação.

**Passo 4: Implementar Softphone Web no Frontend**

* *Escolha da Lib:* Digamos que optamos por `react-softphone` para rapidez. Importe o componente e tente colocar na página do CRM. A IA pode auxiliar a integrar isso no nosso projeto React (e.g., instalando via npm, mostrando exemplo de uso dentro de um componente React).

* *Configuração Segura:* Insira o mínimo de credenciais possível no front. Talvez inicialmente coloque user/pass fixos de um ramal de teste para ver funcionar. Depois pensaremos em melhor forma. Use IA para lidar com state management do softphone – por exemplo, obter evento de "chamada encerrada" e então chamar nosso backend log.

* *UI/UX:* Customize a aparência para combinar com a interface (CSS). Se o componente default não agradar, a IA pode sugerir usar hooks de `react-sip` para montar nossa UI (um botão call, status text, etc.).

* *Teste de Chamada WebRTC:* Abra o app no browser, efetue login do agente, e clique para ligar para um número (pode ser seu celular). Espera-se que: o softphone conecte ao Asterisk (ver console do Asterisk confirmando registro do ramal via WSS), o backend Originate dispare chamando o ramal (browser) e o número externo. Se tudo deu certo, seu navegador deve tocar e, ao “atender” no navegador, o seu celular real toca em seguida. Parabéns, você substituiu o Twilio (pelo menos para uma chamada manual)\!

**Passo 5: Gravação e Armazenamento**

* *Ativar Gravação:* No dialplan, adicione a linha MixMonitor conforme acima. Ou programaticamente, talvez chame uma função AMI Action para começar gravação (AMI tem comando `Monitor`/`MixMonitor` também). Simule uma chamada e veja se o arquivo .wav é criado em `/var/spool/asterisk/monitor`. A IA pode ajudar a lembrar o caminho padrão e formato.

* *Servir o Áudio:* Implemente um endpoint no Node para download das gravações. Pode ser tão simples quanto servir arquivos estáticos de um diretório protegido. Alternativamente, considerar integrar um serviço de armazenamento: a IA pode esboçar código para enviar arquivo para um bucket S3 após término da chamada (usando AWS SDK). Mas para MVP, local está ok.

* *Limpeza:* Pense em estratégia de limpeza ou rotação se o volume crescer. Não critico para MVP, mas já documente.

**Passo 6: Mapeamento de Eventos e Integração com CRM**

* *Mapear Eventos → Estados:* Utilize os eventos AMI capturados para determinar os status. Por exemplo, ao receber `DialBegin` e `DialEnd`, podemos inferir "chamando" e "destino atendeu ou falhou". Ao receber `Hangup`, confirmamos término e causa. Converta essas ocorrências em estados de negócio: "Atendida", "Não Atendida", "Ocupado", etc. A IA pode ajudar fornecendo tabela de códigos SIP/hangup (ex: Cause 16 \= Normal Clearing – atendida e desligada normalmente; 17 \= Busy; 19 \= No Answer; 21 \= Rejected; etc.).

* *Notificar Frontend:* Implemente via WebSocket (por exemplo, use a mesma conexão existente de notificação que o app já possua, ou crie um canal novo no Node) para enviar atualizações de status ao React. Assim, o vendedor vê em tempo real: "Discando...", "Chamando lead...", "Chamada atendida \- 00:00:05…", "Chamada encerrada".

* *Registrar no CRM:* Finalmente, codifique a função que, no término da chamada, chama `rdStationService.logCallActivity(...)` com os dados coletados (duracao \= diferença entre timestamps de answer e hangup, resultado \= sucesso/falha, link gravação). Como já havia integração OAuth configurada, reaproveite tokens de acesso. Teste usando um lead de demonstração para ver se aparece a atividade no CRM (pode usar a API de sandbox se houver).

* *Verificação:* Faça uma chamada real e veja se: a chamada aparece no histórico do lead no RD Station CRM com duração e link de áudio. Ajuste quaisquer discrepâncias.

**Passo 7: Polir e Documentar**

* *Refinamento da UX:* Ajuste detalhes no frontend – por ex., bloquear botão "Ligar" se outra chamada em andamento, mostrar mensagens de erro amigáveis (ex: "Cliente não atendeu"). A IA pode sugerir mensagens e até traduções. Lembre de internacionalização se necessário.

* *Segurança:* Endureça a segurança: garanta que somente agentes autenticados usem o softphone (pode atrelar o login do CRM ao login SIP para não expor senha manualmente). Implemente limites (ex: não deixar um usuário fazer 100 chamadas simultâneas abusivamente).

* *Custos iniciais:* Para manter custos baixos no começo, opte por usar um **servidor VPS econômico** (ex: 2 vCPU, 4GB RAM por \~US$20/mês ou menos) que deve suportar tranquilamente os primeiros clientes. Escolha um provedor cloud que facilite upgrade e tenha data center no Brasil (latência). Use sistema Linux free (Debian) e softwares open-source para não ter licenças. Nossa única despesa variável agora serão os minutos de voz, então escolha um provedor SIP que permita pagar pouco conforme o uso (evitar compromissos altos antes de ter clientes pagando).

* *Teste Beta com Clientes Piloto:* Convide 1 ou 2 clientes de confiança para usarem o sistema em produção real, comparando com o Twilio antes. Isso dará dados de qualidade (voz, estabilidade). Monitore logs do Asterisk e do Node intensamente nessa fase para pegar bugs não previstos (ex: se um agente fechar o navegador no meio da chamada – o que acontece?).

* *Iteração com IA:* Em todo esse processo, aproveite a IA para solucionar problemas rapidamente: se um erro estranho surgir no console do Asterisk, pergunte; se precisar otimizar uma função, peça sugestões. Isso reduzirá muito o tempo de depuração e implementação, economizando $$ que seriam gastos em horas de desenvolvimento tradicionais. Como apontado em discussões, o maior custo de fazer um CPaaS próprio é o tempo de desenvolvedores e consultoria[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=With%20being%20said%2C%20although%20this,easier%20doing%20it%20with%20Jambonz%2FDrachtio) – usando IA, mitigamos esse custo ao aumentar a produtividade e preencher lacunas de conhecimento da equipe.

**Passo 8: Planejar Escala Futura (DevOps)**  
 *(Mesmo sendo MVP, é bom ter ideia de próximos passos escaláveis, ainda que não implemente agora.)* Documente como adicionar novos servidores Asterisk e balancear carga por cliente (ex: clientes grandes em instâncias separadas). Considere Dockerizar a aplicação toda (Asterisk \+ Node) e orquestrar via Kubernetes quando chegar a hora – IA pode auxiliar criando os manifests k8s. Pense também em métricas e observabilidade: incluir *logging* estruturado (Winston já existe) e possivelmente métricas do Asterisk (pode habilitar SNMP ou usar Telegraf \+ Grafana para voz).

Resumindo, o desenvolvimento do MVP pode ser feito em **curto prazo** aproveitando-se intensivamente de bibliotecas existentes e da assistência de Inteligência Artificial. Tecnologias populares como Node.js, React, Docker e o próprio Asterisk têm ampla base de conhecimento que as IAs atuais dominam, agilizando resolução de problemas. Com uma arquitetura simples (um servidor Asterisk integrado ao backend) e foco nas funcionalidades essenciais (ligar, notificar, gravar, logar), podemos entregar uma solução funcional gastando muito pouco – principalmente o tempo da equipe, que é potencializado pelas ferramentas de IA, e a infraestrutura em si, que inicialmente é mínima. Uma vez validado o MVP, teremos eliminado a dependência do Twilio, reduzido custos variáveis e adquirido autonomia para evoluir o produto de acordo com as demandas dos clientes, sem ficar sujeito a tarifas ou limitações de terceiros.

**Fontes Utilizadas:**

1. PitzKey, *Asterisk Forum – Twilio vs Self-Hosted CPaaS* – Comentários sobre viabilidade de substituir Twilio por Asterisk (ARI/AMI)[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=PitzKey%20%20June%202%2C%202023%2C,7%3A55am%20%205)[community.asterisk.org](https://community.asterisk.org/t/we-are-interested-in-moving-off-of-twilio-onto-our-own-hosted-platform/97175#:~:text=I%20assume%20that%20you%20are,to%20build%20your%20own%20CPaaS).

2. Comunidade Asterisk – *Dimensionamento de Hardware* – Recomendações para 100 chamadas (Xeon 4-core, 4GB)[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=mcrichard%20%20June%201%2C%202017%2C,7%3A00am%20%202) e impacto de gravação/transcoding[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=Noise%20and%20distortion%20are%20normally,from%20that%20point%20of%20view)[community.asterisk.org](https://community.asterisk.org/t/asterisk-server-specification-to-handle-100-concurrent-calls/70889#:~:text=Hi%2C).

3. Sangoma Tech Blog – *Asterisk Dimensioning* – Regra geral (\<20 chamadas qualquer hardware)[sangoma.com](https://sangoma.com/blog/asterisk-dimensioning-what-server-do-i-need/#:~:text=1,they%E2%80%99ll%20generally%20register%20back%20to).

4. Sheerbit Tech, *WebRTC vs SIP Softphones* – Vantagens do WebRTC (browser-based, simples, seguro) vs limitações do SIP tradicional (config complexa, NAT)[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=1,technical%20users)[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=1.%20Browser,and%20install%20a%20separate%20application)[sheerbittech.medium.com](https://sheerbittech.medium.com/webrtc-softphone-has-replaced-sip-based-traditional-softphone-applications-4b4d9e67427f#:~:text=4,need%20to%20meet%20compliance%20requirements).

5. Virtual-Call – *Preços SIP Trunk Brasil* – Exemplo de tarifas nacionais (R$0,12 fixo, R$0,45 móvel)[virtual-call.com](https://www.virtual-call.com/br/precos/sip-trunk#:~:text=Tarifas%20para%20destinos%20nacionais)[virtual-call.com](https://www.virtual-call.com/br/precos/sip-trunk#:~:text=R%24%200%2C45%20%2Fmin).

6. Directcall – *Plano SIP Trunk Tarifado* – Exemplo de tarifas atacado (R$0,05 fixo local, R$0,18 móvel com impostos)[directcall.com.br](https://directcall.com.br/produtos/sip-trunk-tarifado/#:~:text=R%24%200%2C05%205,nos%20sobre%20PLANOS%20DE%20ATACADO) e planos combo com minutos[directcall.com.br](https://directcall.com.br/produtos/sip-trunk-tarifado/#:~:text=No%20PLANO%20TRADICIONAL%20%E2%80%9Cminimo%E2%80%9D%20de,n%C2%BA%20FIXO%20DDD%20do%20Brasil).

7. GitHub (prinze77) – *React-Softphone README* – Exemplo de configuração de softphone React usando JsSIP[github.com](https://github.com/prinze77/react-softphone#:~:text=import%20React%20from%20%27react%27%20import,from%20%27jssip).

8. GitHub (InnovateAsterisk) – *Browser-Phone* – Descrição de softphone web open-source conectando no Asterisk via WebSocket, suportando chamadas, gravação, etc.[github.com](https://github.com/InnovateAsterisk/Browser-Phone#:~:text=This%20web%20application%20is%20designed,line%20solution).

9. Medium (Jogikrunal) – *Node.js \+ AMI Guide* – Demonstra conexão ao Asterisk via Asterisk Manager Interface em Node[medium.com](https://medium.com/@jogikrunal9477/connecting-to-asterisk-using-node-js-and-asterisk-manager-interface-ami-026738ae7379#:~:text=const%20AsteriskManager%20%3D%20require%28%22asterisk,ami%20%3D%20new%20AsteriskManager).

10. Twilio Pricing – *Elastic SIP Trunk Brasil* – Valores por minuto Twilio em USD[twilio.com](https://www.twilio.com/pt-br/sip-trunking/pricing/br#:~:text=Brasil)[twilio.com](https://www.twilio.com/pt-br/sip-trunking/pricing/br#:~:text=Brasil%20%E2%80%93%20Celular).

11. Documentação e Blog RD Station – Dados de uso e importância do click-to-call integrado.

