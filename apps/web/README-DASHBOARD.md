# Dashboard - Configuração RD Station

## Visão Geral

O Dashboard é uma interface administrativa para configurar e gerenciar integrações da ferramenta. Atualmente, permite a configuração do token de acesso da API do RD Station CRM.

## Funcionalidades

### 🔑 Configuração do Token RD Station

- Interface intuitiva para inserir/atualizar token da API
- Validação de formato do token
- Status visual indicando se o token está configurado
- Instruções passo-a-passo para obter o token
- Segurança: tokens são armazenados criptografados no Supabase

### 🔒 Segurança e Autenticação

- Acesso restrito apenas a usuários autenticados
- Políticas RLS (Row Level Security) no Supabase
- Cada usuário acessa apenas seus próprios tokens
- Redirecionamento automático para login se não autenticado

## Como Acessar

1. **Faça login** na aplicação
2. **Clique no botão "Dashboard"** no header da página principal
3. **Configure seu token** do RD Station

## Configuração do Token RD Station

### Obtendo o Token no RD Station CRM

1. Acesse sua conta do **RD Station CRM**
2. Vá em **Configurações** → **Integrações** → **API**
3. **Gere um novo token** de acesso
4. **Copie o token** gerado

### Configurando na Ferramenta

1. No dashboard, localize a seção **"Configuração RD Station"**
2. **Cole o token** no campo "Token de Acesso"
3. **Clique em "Salvar Token"**
4. Aguarde a confirmação de sucesso

### Indicadores de Status

- **🟢 Token configurado**: Token válido está salvo
- **⚪ Token não configurado**: Nenhum token foi configurado ainda

## Estrutura Técnica

### Frontend (`/dashboard`)

```typescript
// Página principal do dashboard
src/app/dashboard/page.tsx

// Features:
- Interface responsiva com Tailwind CSS
- Formulário de configuração de token
- Estados de loading, erro e sucesso
- Validação client-side
- Toggle de visibilidade do token
```

### API Routes

```typescript
// Gerenciamento do token RD Station
src/app/api/rd-station/token/route.ts

// Endpoints:
- GET: Verificar se usuário tem token configurado
- POST: Salvar/atualizar token do usuário
- DELETE: Remover token do usuário
```

### Banco de Dados

```sql
-- Tabela de configurações RD Station
rd_station_configs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    token TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

-- Recursos:
- RLS habilitado para segurança
- Constraint UNIQUE por user_id
- Trigger para atualizar updated_at
- Índice para performance
```

## Validações Implementadas

### Client-side (Frontend)
- Token não pode estar vazio
- Feedback visual durante carregamento
- Limpeza automática de mensagens de sucesso

### Server-side (API)
- Verificação de autenticação
- Validação de formato do token (min. 10 caracteres)
- Sanitização de entrada (trim)
- Tratamento de erros do banco de dados

### Database-level (Supabase)
- RLS para isolamento por usuário
- Constraints de integridade referencial
- Triggers para timestamps automáticos

## Possíveis Expansões Futuras

### 🔄 Integrações Adicionais
- Tokens para outras APIs (WhatsApp Business, Email marketing, etc.)
- Configurações de webhooks
- Parametrização de sincronizações

### 📊 Monitoramento
- Status de conectividade com APIs
- Logs de sincronização
- Métricas de uso

### ⚙️ Configurações Avançadas
- Intervalos de sincronização
- Filtros e mapeamentos de dados
- Configurações de notificações

### 👥 Gestão de Equipe
- Compartilhamento de configurações
- Permissões granulares
- Auditoria de alterações

## Troubleshooting

### Token não aceito
1. Verifique se o token foi copiado completamente
2. Confirme que o token é válido no RD Station
3. Teste a conectividade da API no RD Station

### Erro ao salvar
1. Verifique sua conexão com a internet
2. Confirme que está logado na aplicação
3. Verifique os logs do console do navegador

### Página não carrega
1. Confirme que está autenticado
2. Verifique se a URL está correta (`/dashboard`)
3. Tente fazer logout e login novamente

## Desenvolvimento

### Rodando localmente
```bash
# No diretório apps/web/
npm run dev

# Acesse: http://localhost:3000/dashboard
```

### Variáveis de ambiente necessárias
```env
# Supabase (apps/web/.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Aplicar migrations
```sql
-- Execute no Supabase SQL Editor:
-- /supabase/migrations/002_create_rd_station_configs.sql
```

---

**Status**: ✅ Implementado e funcional  
**Última atualização**: Dezembro 2024