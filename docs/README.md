# Documentação - Click-to-Call SaaS

> 📚 **Documentação técnica e guias do usuário**

## 📁 Estrutura

```
docs/
├── api/                   # Documentação da API
│   ├── authentication.md # OAuth RD Station + JWT
│   ├── calls.md          # Endpoints de chamadas
│   ├── contacts.md       # Endpoints de contatos
│   ├── webhooks.md       # Webhooks Twilio
│   └── openapi.yaml      # Especificação OpenAPI
├── user-guide/           # Guias do usuário
│   ├── installation.md  # Como instalar a extensão
│   ├── getting-started.md # Primeiros passos
│   ├── dashboard.md      # Como usar o dashboard
│   └── troubleshooting.md # Resolução de problemas
├── deployment/           # Guias de deploy
│   ├── docker.md         # Deploy com Docker
│   ├── aws.md            # Deploy na AWS
│   └── vercel.md         # Deploy frontend Vercel
└── contributing/         # Guias para contribuidores
    ├── setup.md          # Setup do ambiente dev
    ├── architecture.md   # Arquitetura do sistema
    └── coding-standards.md # Padrões de código
```

## 🎯 Propósito

### Para Desenvolvedores
- **Documentação da API** completa com exemplos
- **Guias de arquitetura** e decisões técnicas
- **Setup do ambiente** de desenvolvimento
- **Padrões de código** e boas práticas

### Para Usuários
- **Guias de instalação** passo a passo
- **Tutorial de uso** do sistema
- **Resolução de problemas** comuns
- **FAQ** e perguntas frequentes

### Para DevOps
- **Guias de deploy** para diferentes ambientes
- **Configuração de CI/CD** e automação
- **Monitoramento** e observabilidade

## 📋 Documentos Principais

### API Reference
- [Autenticação](api/authentication.md) - OAuth 2.0 + JWT
- [Chamadas](api/calls.md) - Endpoints de VoIP
- [Contatos](api/contacts.md) - Sincronização RD Station
- [Webhooks](api/webhooks.md) - Eventos em tempo real

### Guias de Usuário
- [Instalação](user-guide/installation.md) - Chrome Extension
- [Primeiros Passos](user-guide/getting-started.md) - Setup inicial
- [Dashboard](user-guide/dashboard.md) - Métricas e relatórios

### Deploy & Infraestrutura
- [Docker](deployment/docker.md) - Containerização
- [AWS](deployment/aws.md) - Deploy na nuvem
- [CI/CD](deployment/cicd.md) - Automação

## 🛠️ Ferramentas Utilizadas

- **Markdown** - Formato dos documentos
- **OpenAPI 3.0** - Especificação da API
- **Mermaid** - Diagramas e fluxos
- **Swagger UI** - Interface da documentação

## 🚀 Como Contribuir

1. Criar nova branch para documentação
2. Editar arquivos Markdown relevantes
3. Adicionar exemplos e screenshots
4. Fazer PR com descrição clara

## 📝 Convenções

- **Títulos claros** e descritivos
- **Exemplos práticos** em todos os guias
- **Screenshots atualizados** regularmente
- **Links internos** entre documentos relacionados 