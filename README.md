# Click-to-Call Full-Stack (Asterisk + Next.js)

Este projeto implementa uma solução completa de click-to-call utilizando Asterisk para a telefonia WebRTC e uma aplicação full-stack com Next.js para o frontend e backend.

## Arquitetura de Serviços

O projeto é orquestrado com Docker Compose e dividido nos seguintes serviços:

- `voip`: O servidor Asterisk, responsável por toda a lógica de VoIP, WebRTC, dialplan e gerenciamento de chamadas.
- `backend`: A API de backend (Node.js/Express), que serve como uma ponte entre o frontend e o Asterisk, além de lidar com a lógica de negócio e autenticação.
- `frontend`: A aplicação Next.js, que fornece a interface do usuário para realizar e receber chamadas.

## Como Executar

### Ambiente de Desenvolvimento (Primeira Vez)

Siga estes passos para configurar e rodar o projeto localmente pela primeira vez.

1.  **Pré-requisitos:** Certifique-se de que você tem Docker, Docker Compose e OpenSSL instalados.
2.  **Variáveis de Ambiente:** Copie o arquivo `.env.example` para `.env`.
    ```bash
    cp .env.example .env
    ```
    *Abra o arquivo `.env` e preencha as variáveis, especialmente as do Supabase.*
3.  **Certificados TLS (Para WSS Local):** Execute o script para gerar os certificados de desenvolvimento para `localhost`.
    ```bash
    sh scripts/generate-dev-certs.sh
    ```
    *Este comando criará a pasta `certs/` com os arquivos `privkey.pem` e `fullchain.pem` necessários.*
4.  **Subir os Serviços:** Execute o Docker Compose para construir as imagens e iniciar todos os containers.
    ```bash
    docker-compose up -d --build
    ```

Após a primeira vez, para iniciar e parar o ambiente, você pode usar `docker-compose up -d` e `docker-compose down`.

### Ambiente de Produção (Easypanel)

Para a implantação em produção, o Easypanel usará o `docker-compose.yml` como base.

1.  **Variáveis de Ambiente:** Configure todas as variáveis de ambiente necessárias diretamente no painel de configuração do seu serviço no Easypanel. Não use um arquivo `.env` em produção.
2.  **Montagem de Certificados:** Na configuração do serviço `voip` no Easypanel, configure o "Volume Mount" para apontar para os certificados gerenciados pelo painel.
    - **Host Path:** `/etc/letsencrypt/live/SEU_DOMINIO` (ou o caminho equivalente do Easypanel)
    - **Container Path:** `/etc/asterisk/keys`
3.  **Exposição de Portas:** Garanta que as portas definidas no `docker-compose.yml` (especialmente 8089/tcp e 10000-10200/udp) estejam corretamente expostas e mapeadas no painel do Easypanel.

## Notas sobre a Implantação no Easypanel

O erro `service "backend" has neither an image nor a build context specified` foi resolvido renomeando o serviço `api` para `backend`. A estrutura de arquivos agora deve ser compatível com o que o Easypanel espera. Ao implantar, aponte para o seu repositório Git e garanta que as configurações de variáveis, volumes e portas estejam corretas no painel. 