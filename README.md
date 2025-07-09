# Click-to-Call Full-Stack (Asterisk + Next.js)

Este projeto implementa uma solução completa de click-to-call utilizando Asterisk para a telefonia WebRTC e uma aplicação full-stack com Next.js para o frontend e backend.

## Arquitetura de Serviços

O projeto é orquestrado com Docker Compose e dividido nos seguintes serviços:

- `voip`: O servidor Asterisk, responsável por toda a lógica de VoIP, WebRTC, dialplan e gerenciamento de chamadas.
- `backend`: A API de backend (anteriormente `api`), que serve como uma ponte entre o frontend e o Asterisk, além de lidar com outras lógicas de negócio.
- `frontend`: A aplicação Next.js (anteriormente `web`), que fornece a interface do usuário para realizar e receber chamadas.
- `cert-generator`: Um serviço auxiliar que gera certificados SSL autoassinados para garantir a comunicação segura (WSS) com o Asterisk.

## Como Executar

### Ambiente de Desenvolvimento

Para subir o ambiente de desenvolvimento, utilize o arquivo `docker-compose.yml` padrão. Ele está configurado com volumes para live-reloading e variáveis de ambiente para debug.

1.  **Pré-requisitos:** Certifique-se de que você tem o Docker e o Docker Compose instalados.
2.  **Variáveis de Ambiente:** Copie o arquivo `.env.example` para `.env` e preencha as variáveis necessárias.
3.  **Subir os Serviços:** Execute o seguinte comando na raiz do projeto:

    ```bash
    docker-compose up -d --build
    ```

Isso irá construir as imagens e iniciar todos os containers em modo detached (-d).

### Ambiente de Produção

Para a implantação em produção, utilizamos um arquivo de override chamado `docker-compose.prod.yml`. Este arquivo otimiza a aplicação para performance e segurança:

- Remove os volumes de código-fonte para garantir que o container seja imutável.
- Define `NODE_ENV=production`.
- Permite o uso de um registro de imagens (Docker Hub, GCR, etc.) para os builds.

1.  **Variáveis de Ambiente:** Certifique-se de que seu ambiente de produção (ex: segredos do Easypanel) tem todas as variáveis de ambiente necessárias definidas no `.env` do projeto.
2.  **Subir os Serviços:** Para implantar, o Docker Compose precisa ser instruído a usar ambos os arquivos. O Easypanel normalmente faz isso automaticamente se os nomes seguirem a convenção. O comando equivalente seria:

    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    ```
    
    Este comando mescla as configurações, com os valores de `docker-compose.prod.yml` sobrescrevendo os de `docker-compose.yml`.

## Notas sobre a Implantação no Easypanel

O erro `service "backend" has neither an image nor a build context specified` foi resolvido renomeando o serviço `api` para `backend`. A estrutura de arquivos agora deve ser compatível com o que o Easypanel espera. Ao implantar, aponte para o seu repositório Git e garanta que as variáveis de ambiente de produção estejam configuradas no painel do Easypanel. 