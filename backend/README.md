# Backend - Click-to-Call SaaS

> 🚀 **API Node.js/TypeScript para integração RD Station + Twilio**

## 📁 Estrutura

```
backend/
├── src/                    # Código fonte principal
│   ├── controllers/        # Controladores HTTP (rotas)
│   ├── services/          # Lógica de negócio
│   ├── models/            # Modelos de dados/entidades
│   ├── routes/            # Definição de rotas
│   ├── utils/             # Utilitários e helpers
│   └── types/             # Definições TypeScript
├── tests/                 # Testes automatizados
├── config/                # Configurações (env, database, etc)
└── package.json           # Dependências e scripts
```

## 🛠️ Stack Tecnológica

- **Node.js 18+ LTS** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express.js** - Framework web minimalista
- **Twilio SDK** - Integração de telefonia
- **JWT** - Autenticação
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões

## 🎯 Funcionalidades Principais

### APIs Core
- `/auth` - Autenticação via RD Station OAuth
- `/calls` - Gestão de chamadas VoIP
- `/contacts` - Sincronização de contatos
- `/webhooks` - Eventos Twilio e RD Station

### Serviços
- **RDStationService** - Integração OAuth + API
- **TwilioService** - Chamadas VoIP + WebRTC
- **CallLogService** - Registro automático no CRM
- **RecordingService** - Gravação segura (LGPD)

## 🚀 Getting Started

```bash
# Entrar no diretório
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar em desenvolvimento
npm run dev

# Executar testes
npm test
```

## 📋 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Executar build de produção
- `npm test` - Executar testes
- `npm run lint` - Verificar código 