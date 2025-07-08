# **Guia de Desenvolvimento Técnico - Plataforma SaaS de Click-to-Call**

## **Visão Geral Técnica**

Este documento detalha a implementação técnica da plataforma SaaS de click-to-call integrada ao RD Station CRM, utilizando tecnologias modernas e melhores práticas para desenvolvimento acelerado e escalável em um monorepo gerenciado por Turborepo.

### **Características Técnicas Principais**

- **Stack Moderno**: Next.js + TypeScript frontend, Node.js + TypeScript backend.
- **Estrutura Monorepo**: Gerenciada com Turborepo e pnpm workspaces para máxima eficiência.
- **Arquitetura Cloud-Native**: Conteinerizada (Docker) e otimizada para deploy no Easypanel.
- **Banco de Dados como Serviço**: Utilização do Supabase (PostgreSQL gerenciado) para persistência de dados.
- **API-First**: Design orientado a APIs com documentação automatizada.
- **Segurança Integrada**: Autenticação por token, criptografia de dados e validação de webhooks.
- **Observabilidade**: Logging, monitoramento e métricas integradas.
- **CI/CD**: Pipeline automatizado para desenvolvimento e deploy contínuo via GitHub Actions.

---

## **Stack Tecnológico Detalhado**

### **Frontend (apps/web)**

**Tecnologias Principais:**
- **Next.js** com React 18+ e TypeScript para uma base robusta de frontend.
- **Supabase UI & shadcn/ui**: Para componentes reutilizáveis e consistência visual.
- **Tailwind CSS**: Para estilização rápida e responsiva.
- **TanStack Query (React Query)**: Para gerenciamento de estado do servidor e caching.
- **React Hook Form**: Para validação de formulários.
- **Framer Motion**: Para animações suaves.

### **Backend (apps/api)**

**Tecnologias Principais:**
- **Node.js 18+ LTS** com TypeScript.
- **Express.js**: Para a criação da API REST e gerenciamento de rotas.
- **Supabase Client (@supabase/supabase-js)**: Para interagir com o banco de dados PostgreSQL.
- **Twilio SDK**: Para integração com a API de voz da Twilio.
- **JWT**: Para autenticação de endpoints, se necessário.
- **Winston**: Para logging estruturado.

---

## **Estrutura do Monorepo (Turborepo)**

A plataforma é organizada como um monorepo para facilitar o compartilhamento de código e a configuração centralizada.

```
repo-root/
├─ apps/
│  ├─ web/          # Frontend Next.js
│  ├─ api/          # Backend Node.js/Express
│  └─ docs/         # Documentação (opcional, pode ser o Storybook)
├─ packages/
│  ├─ ui/           # Componentes React compartilhados (shadcn/ui)
│  └─ config/       # Configurações compartilhadas (ESLint, TSConfig)
├─ .github/workflows/
├─ turbo.json
├─ package.json
└─ pnpm-workspace.yaml
```

### **Gerenciamento de Variáveis de Ambiente com Easypanel**

Utilizamos prefixos para gerenciar as variáveis de ambiente em um único painel no Easypanel:
- **`API_`**: Para o serviço de backend (`apps/api`).
- **`WEB_`**: Para o serviço de frontend (`apps/web`), injetadas durante o build.

---

## **Arquitetura da Aplicação**

### **Diagrama de Arquitetura High-Level**

```
┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend (Web) │    │  Backend (API)  │    │ Integrations    │
│    (Next.js)     │◄───│   (Node.js)     │◄───│                 │
│                  │    │                 │    │  • RD Station   │
│ • Dashboard      │    │ • API REST      │    │  • Twilio       │
│ • Dialer Widget  │    │ • WebSockets    │    │                 │
│ • Relatórios     │    │ • Auth          │    │                 │
└──────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                      │
         │              ┌─────────────────┐             │
         │              │  Infrastructure │             │
         └──────────────│                 │─────────────┘
                        │  • Supabase DB  │
                        │  • Supabase Auth│
                        │  • Supabase     │
                        │    Storage      │
                        └─────────────────┘
```

---

## **Banco de Dados e Schema**

### **Schema SQL (Supabase)**

O schema será gerenciado diretamente no Supabase ou através de arquivos de migração SQL.

```sql
-- Exemplo de tabela de chamadas
CREATE TABLE calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_call_sid TEXT UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id),
  from_number TEXT,
  to_number TEXT,
  status TEXT,
  direction TEXT,
  duration INT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configuração da empresa
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rdcrm_token TEXT, -- Criptografado
  twilio_account_sid TEXT,
  twilio_auth_token TEXT -- Criptografado
);
```

---

## **Configuração de Desenvolvimento**

### **Variáveis de Ambiente (`.env.example`)**

```env
# .env.example (na raiz ou em cada app)

# Supabase
API_SUPABASE_URL="https://your-project.supabase.co"
API_SUPABASE_ANON_KEY="your-anon-key"
API_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Twilio
API_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_TWILIO_AUTH_TOKEN=your_twilio_auth_token

# RD Station CRM (API v1)
API_RDCRM_TOKEN=seu_token_rdcrm

# Frontend
WEB_SUPABASE_URL="https://your-project.supabase.co"
WEB_SUPABASE_ANON_KEY="your-anon-key"
```

### **Scripts (`package.json` na raiz)**

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:types": "supabase gen types typescript --project-id your-project-id > packages/database/types.ts"
  }
}
```
---

## **Próximos Passos**

O desenvolvimento seguirá o plano de tarefas detalhado no Taskmaster, começando pela configuração da infraestrutura com Turborepo e Docker, seguido pelo desenvolvimento do backend, frontend e integrações. 