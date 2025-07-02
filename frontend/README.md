# Frontend - Click-to-Call SaaS

> ⚛️ **Dashboard React/Next.js para gestão de chamadas**

## 📁 Estrutura

```
frontend/
├── src/                   # Código fonte principal
│   ├── components/        # Componentes React reutilizáveis
│   ├── pages/            # Páginas Next.js (App Router)
│   ├── hooks/            # Custom hooks React
│   ├── services/         # API calls e integração
│   ├── utils/            # Utilitários e helpers
│   └── styles/           # Estilos globais e temas
├── public/               # Assets estáticos
└── package.json          # Dependências e scripts
```

## 🛠️ Stack Tecnológica

- **React 18+** - Biblioteca para interfaces
- **Next.js 14+** - Framework full-stack
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **React Query** - Gerenciamento de estado servidor
- **React Hook Form** - Formulários performáticos
- **Zustand** - Estado global leve

## 🎯 Funcionalidades

### Páginas Principais
- `/dashboard` - Métricas e overview
- `/calls` - Histórico de chamadas
- `/contacts` - Gestão de contatos
- `/settings` - Configurações da conta

### Componentes Core
- **CallButton** - Botão click-to-call
- **CallStatus** - Indicador de status
- **ContactCard** - Card de contato
- **MetricsChart** - Gráficos de vendas

## 🚀 Getting Started

```bash
# Entrar no diretório
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📋 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Executar build de produção
- `npm run lint` - Verificar código
- `npm run type-check` - Verificar TypeScript 