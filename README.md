# Click-to-Call System

Sistema completo de Click-to-Call com frontend Next.js, backend Express.js e servidor Asterisk para WebRTC.

## 🏗️ Arquitetura

- **Frontend**: Next.js com TypeScript e Tailwind CSS
- **Backend**: Express.js com TypeScript
- **VoIP**: Asterisk 18 com suporte WebRTC
- **Database**: Supabase (PostgreSQL)
- **CRM**: Integração com RD Station CRM API v1

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- pnpm (gerenciador de pacotes)

## 🚀 Execução Rápida com Docker

### 1. Configuração das Variáveis de Ambiente

Copie os arquivos de exemplo e configure suas credenciais:

```bash
# Configurações da API
cp apps/api/.env.example apps/api/.env

# Configurações do Frontend  
cp apps/web/.env.example apps/web/.env

# Configurações globais (se necessário)
cp .env.example .env
```

### 2. Configurar Credenciais

Edite os arquivos `.env` com suas credenciais reais:

**apps/api/.env**: Configure Supabase, RD Station CRM e JWT secrets
**apps/web/.env**: Configure URLs da API e configurações públicas

### 3. Executar com Docker

```bash
# Construir e executar todos os serviços
docker-compose up --build

# Ou executar em background
docker-compose up -d --build
```

### 4. Gerar Certificados TLS (se necessário)

```bash
# Gerar certificados para WSS (apenas se não existirem)
docker-compose --profile tools run --rm cert-generator
```

## 🔧 Desenvolvimento Local

### 1. Instalar Dependências

```bash
# Instalar dependências do monorepo
pnpm install
```

### 2. Executar em Modo Desenvolvimento

```bash
# Executar todos os serviços em desenvolvimento
pnpm dev

# Ou executar individualmente:
pnpm --filter api dev     # Backend na porta 3001
pnpm --filter web dev     # Frontend na porta 3000
```

### 3. Executar Apenas o Asterisk

```bash
# Executar apenas o Asterisk com Docker
docker-compose up asterisk
```

## 🌐 Acesso aos Serviços

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Asterisk HTTP**: http://localhost:8088
- **Asterisk WSS**: wss://localhost:8089

## 📱 Configuração do Softphone

### Credenciais Padrão

- **Usuário**: agent-1001
- **Senha**: changeme
- **Realm**: clicktocall.local
- **Servidor WSS**: wss://localhost:8089

### Teste de Conexão WebRTC

1. Acesse o frontend em http://localhost:3000
2. O softphone deve conectar automaticamente
3. Teste realizando uma chamada

## 🔍 Verificação de Funcionamento

### Health Checks

```bash
# Verificar API
curl http://localhost:3001/api/health

# Verificar Frontend
curl http://localhost:3000

# Verificar Asterisk
docker exec asterisk-clicktocall asterisk -rx "core show version"
```

### Logs dos Serviços

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f api
docker-compose logs -f web  
docker-compose logs -f asterisk
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de certificados WSS**:
   ```bash
   docker-compose --profile tools run --rm cert-generator
   ```

2. **Módulo SRTP não encontrado**:
   - Verificar se `asterisk-srtp` está instalado no Dockerfile

3. **Conexão recusada entre serviços**:
   - Verificar se as redes Docker estão configuradas
   - Usar `asterisk` ao invés de `localhost` nas configurações da API

4. **Problemas de permissão Asterisk**:
   ```bash
   docker exec asterisk-clicktocall chown -R asterisk:asterisk /etc/asterisk
   ```

### Verificação de Configurações

```bash
# Verificar configuração PJSIP
docker exec asterisk-clicktocall asterisk -rx "pjsip show transports"

# Verificar endpoints WebRTC
docker exec asterisk-clicktocall asterisk -rx "pjsip show endpoints"

# Verificar módulos carregados
docker exec asterisk-clicktocall asterisk -rx "module show like srtp"
```

## 📁 Estrutura do Projeto

```
click-to-call/
├── apps/
│   ├── api/                 # Backend Express.js
│   │   ├── src/
│   │   ├── .env            # Configurações da API
│   │   └── Dockerfile
│   └── web/                # Frontend Next.js  
│       ├── src/
│       ├── .env            # Configurações do Frontend
│       └── Dockerfile
├── asterisk/               # Servidor VoIP
│   ├── etc/               # Configurações do Asterisk
│   ├── Dockerfile
│   └── run.sh
├── docker-compose.yml     # Orquestração dos serviços
└── README.md
```

## 🔐 Segurança

- Altere todas as senhas padrão em produção
- Configure certificados SSL válidos para WSS
- Use variáveis de ambiente para credenciais sensíveis
- Configure firewall adequadamente para portas do Asterisk

## 📚 Documentação Adicional

- [Configuração do Asterisk](./asterisk/README.md)
- [API Documentation](./apps/api/README.md)
- [Frontend Guide](./apps/web/README.md)
- [Troubleshooting Guide](./docs/troubleshooting.md) 