# Click-to-Call Full-Stack (Asterisk + Next.js)

Este projeto implementa uma solução completa de click-to-call utilizando Asterisk para a telefonia WebRTC e uma aplicação full-stack com Next.js para o frontend e backend.

## Arquitetura de Serviços

O projeto é orquestrado com Docker Compose e dividido nos seguintes serviços:

- `voip`: O servidor Asterisk, responsável por toda a lógica de VoIP, WebRTC, dialplan e gerenciamento de chamadas.
- `backend`: A API de backend (Node.js/Express), que serve como uma ponte entre o frontend e o Asterisk, além de lidar com a lógica de negócio e autenticação.
- `frontend`: A aplicação Next.js, que fornece a interface do usuário para realizar e receber chamadas.

## Como Executar

### Ambiente de Desenvolvimento

Para subir o ambiente de desenvolvimento, utilize o arquivo `docker-compose.yml` padrão.

1.  **Pré-requisitos:** Certifique-se de que você tem o Docker e o Docker Compose instalados.
2.  **Variáveis de Ambiente:** Copie o arquivo `.env.example` para `.env` e preencha as variáveis necessárias para o desenvolvimento local.
3.  **Certificados (Desenvolvimento):** Para usar WSS localmente, você precisa gerar certificados. Crie uma pasta `certs` na raiz do projeto e coloque seus arquivos `fullchain.pem` e `privkey.pem` nela.
4.  **Subir os Serviços:** Execute o seguinte comando na raiz do projeto:

    ```bash
    docker-compose up -d --build
    ```

Isso irá construir as imagens e iniciar todos os containers em modo detached (-d).

### Ambiente de Produção (Easypanel)

Para a implantação em produção, o Easypanel usará o `docker-compose.yml` como base.

1.  **Variáveis de Ambiente:** Configure todas as variáveis de ambiente necessárias diretamente no painel de configuração do seu serviço no Easypanel. Não use um arquivo `.env` em produção.
2.  **Montagem de Certificados:** Na configuração do serviço `voip` no Easypanel, configure o "Volume Mount" para apontar para os certificados gerenciados pelo painel.
    - **Host Path:** `/etc/letsencrypt/live/SEU_DOMINIO` (ou o caminho equivalente do Easypanel)
    - **Container Path:** `/etc/asterisk/keys`
3.  **Exposição de Portas:** Garanta que as portas definidas no `docker-compose.yml` (especialmente 8089/tcp e 10000-10200/udp) estejam corretamente expostas e mapeadas no Easypanel.

## Notas sobre a Implantação no Easypanel

O erro `service "backend" has neither an image nor a build context specified` foi resolvido renomeando o serviço `api` para `backend`. A estrutura de arquivos agora deve ser compatível com o que o Easypanel espera. Ao implantar, aponte para o seu repositório Git e garanta que as configurações de variáveis, volumes e portas estejam corretas no painel. 