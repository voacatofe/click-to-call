# 🔐 Sistema de Autenticação com Supabase

Este projeto implementa um sistema completo de autenticação usando **Supabase** no frontend Next.js.

## 📋 Funcionalidades Implementadas

### ✅ Páginas de Autenticação
- **`/auth/register`** - Página de registro
- **`/auth/login`** - Página de login  
- **`/auth/forgot-password`** - Página de esqueceu a senha
- **`/auth/reset-password`** - Página de redefinição de senha

### ✅ Funcionalidades
- Registro de usuário com validação
- Login/logout de usuário
- Recuperação de senha por email
- Redefinição de senha via link
- Validação de formulários com Zod
- Gerenciamento de estado de autenticação
- UI responsiva e acessível

## 🚀 Configuração Inicial

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings > API**
4. Copie sua **Project URL** e **anon public key**

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Configurar Autenticação no Supabase

No painel do Supabase:

1. Vá em **Authentication > Settings**
2. Configure **Site URL**: `http://localhost:3000`
3. Adicione **Redirect URLs**:
   - `http://localhost:3000/auth/reset-password`
   - `https://your-domain.com/auth/reset-password` (produção)

### 4. Configurar Email Templates (Opcional)

Em **Authentication > Email Templates**, personalize:
- **Confirm signup** - Email de confirmação de cadastro
- **Reset password** - Email de recuperação de senha

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── app/auth/
│   ├── login/page.tsx           # Página de login
│   ├── register/page.tsx        # Página de registro
│   ├── forgot-password/page.tsx # Esqueceu a senha
│   └── reset-password/page.tsx  # Redefinir senha
├── components/
│   ├── auth/
│   │   └── AuthLayout.tsx       # Layout das páginas auth
│   └── ui/
│       ├── Button.tsx           # Componente Button
│       ├── Input.tsx            # Componente Input
│       └── Alert.tsx            # Componente Alert
├── hooks/
│   └── useAuth.ts               # Hook de autenticação
├── lib/
│   ├── supabase.ts              # Cliente Supabase
│   └── validation.ts            # Schemas Zod
└── types/
    └── auth.ts                  # Tipos TypeScript
```

### Tecnologias Utilizadas

- **Supabase** - Backend-as-a-Service
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **TypeScript** - Tipagem estática

## 🎯 Como Usar

### Hook de Autenticação (`useAuth`)

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth()
  
  if (loading) return <div>Carregando...</div>
  
  return (
    <div>
      {user ? (
        <div>
          <p>Olá, {user.email}!</p>
          <button onClick={signOut}>Sair</button>
        </div>
      ) : (
        <p>Usuário não logado</p>
      )}
    </div>
  )
}
```

### Proteção de Rotas

Para proteger páginas que requerem autenticação:

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])
  
  if (loading) return <div>Carregando...</div>
  if (!user) return null
  
  return <div>Conteúdo protegido</div>
}
```

## 🎨 Componentes UI

### Button

```tsx
import { Button } from '@/components/ui/Button'

<Button variant="primary" size="md" loading={false}>
  Clique aqui
</Button>
```

### Input

```tsx
import { Input } from '@/components/ui/Input'

<Input
  label="Email"
  type="email"
  placeholder="Digite seu email"
  error="Mensagem de erro"
/>
```

### Alert

```tsx
import { Alert } from '@/components/ui/Alert'

<Alert variant="success" title="Sucesso">
  Operação realizada com sucesso!
</Alert>
```

## 🔒 Validação de Formulários

Os schemas de validação estão em `src/lib/validation.ts`:

```typescript
export const signUpSchema = z.object({
  email: z.string().email('Email deve ser válido'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
  // ...
})
```

## 🌐 Fluxos de Autenticação

### Registro
1. Usuário preenche formulário
2. Validação client-side com Zod
3. Envio para Supabase
4. Email de confirmação enviado
5. Usuário confirma via email

### Login
1. Usuário preenche credenciais
2. Validação e autenticação
3. Redirecionamento para home
4. Estado de auth atualizado

### Recuperação de Senha
1. Usuário informa email
2. Link de recuperação enviado
3. Usuário clica no link
4. Nova senha definida
5. Redirecionamento para login

## 🚀 Deploy em Produção

### 1. Configurar URLs de Produção

No Supabase, adicione suas URLs de produção:

```
Site URL: https://your-domain.com
Redirect URLs: https://your-domain.com/auth/reset-password
```

### 2. Variáveis de Ambiente

Configure as mesmas variáveis em sua plataforma de deploy.

### 3. HTTPS Obrigatório

O Supabase requer HTTPS em produção para funcionalidades de auth.

## 🧪 Testando

### Dados de Teste

Use emails temporários para testes:
- [10minutemail.com](https://10minutemail.com)
- [temp-mail.org](https://temp-mail.org)

### Casos de Teste

- ✅ Registro com dados válidos
- ✅ Registro com email duplicado
- ✅ Login com credenciais corretas
- ✅ Login com credenciais incorretas
- ✅ Recuperação de senha
- ✅ Redefinição de senha
- ✅ Validação de formulários

## 🔧 Troubleshooting

### Erros Comuns

**"Invalid login credentials"**
- Verifique email/senha
- Confirme que o usuário verificou o email

**"Email not confirmed"**
- Usuário precisa confirmar email
- Reenvie email de confirmação

**"Invalid JWT"**
- Token expirado ou inválido
- Faça logout/login novamente

### Debug

Ative logs no cliente Supabase:

```typescript
export const supabase = createClient(url, key, {
  auth: {
    debug: true // Apenas em desenvolvimento
  }
})
```

## 📚 Recursos Adicionais

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Próximos passos**: Implementar perfil de usuário, roles/permissões, e integração com o sistema de chamadas.