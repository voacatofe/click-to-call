# Click-to-Call SaaS Platform

Este é o repositório para a plataforma SaaS de Click-to-Call, integrada com o RD Station CRM. O projeto é um monorepo gerenciado com Turborepo e pnpm.

## Estrutura do Projeto

Este é um monorepo gerenciado com pnpm e Turborepo.

- `apps/api`: Backend em Node.js (Express)
- `apps/web`: Frontend em React (Next.js)
- `packages/ui`: Componentes React compartilhados
- `packages/config`: Configurações de ESLint e TSConfig

## Desenvolvimento Local

### Pré-requisitos
- Node.js >= 18
- pnpm
- Docker

### Instalação e Execução
1.  **Clone o repositório.**
2.  **Instale as dependências** na raiz do projeto:
    ```bash
    pnpm install
    ```
3.  **Configure as variáveis de ambiente**:
    Copie os arquivos `.env.example` para `.env` em `apps/api` e `apps/web` e preencha com suas credenciais.
4.  **Inicie os serviços** com Docker Compose:
    ```bash
    docker-compose up --build
    ```
    - O frontend estará disponível em `http://localhost:3000`.
    - O backend estará disponível em `http://localhost:3001`.

## CI/CD

O pipeline de Integração Contínua (CI) é gerenciado pelo GitHub Actions e está definido em `.github/workflows/ci.yml`. Ele é acionado a cada `push` ou `pull request` para a branch `main` e executa as seguintes etapas:
- Instalação de dependências
- Geração de tipos do Supabase
- Lint
- Testes
- Build de todas as aplicações e pacotes

## Uso da Supabase CLI

A CLI do Supabase é utilizada para gerenciar o ambiente de banco de dados local (opcional) e para gerar tipos TypeScript a partir do schema do seu banco de dados.

### Instalação
```bash
npm install -g supabase
```

### Login
```bash
supabase login
```

### Vinculando o Projeto
Vincule seu projeto local ao seu projeto Supabase remoto:
```bash
supabase link --project-ref <your-project-id>
```

### Gerando Tipos
Para gerar os tipos TypeScript a partir do seu schema de banco de dados:
```bash
supabase gen types typescript --project-id <your-project-id> --schema public > apps/web/types/supabase.ts
```

### Migrações
Para aplicar migrações do seu diretório `supabase/migrations` para o banco de dados remoto:
```bash
supabase db push
``` 