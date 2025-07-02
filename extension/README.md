# Extension - Click-to-Call Chrome Extension

> 🌐 **Extensão Chrome para integração com RD Station CRM**

## 📁 Estrutura

```
extension/
├── src/                   # Código fonte principal
│   ├── background.js      # Service worker (background script)
│   ├── content-script.js  # Script injetado no RD Station
│   ├── popup.html         # Interface popup da extensão
│   ├── popup.js           # Lógica do popup
│   └── utils/             # Utilitários compartilhados
├── assets/                # Ícones e recursos estáticos
│   ├── icons/             # Ícones da extensão (16, 48, 128px)
│   └── styles/            # CSS para popup e content script
├── manifest.json          # Configuração da extensão
└── package.json           # Dependências para build
```

## 🛠️ Stack Tecnológica

- **Manifest V3** - Padrão moderno de extensões
- **Vanilla JavaScript** - Sem frameworks (performance)
- **Chrome APIs** - Storage, tabs, runtime
- **WebRTC** - Comunicação de voz
- **CSS3** - Estilização responsiva

## 🎯 Funcionalidades

### Core Features
- **Detecção automática** de números no RD Station
- **Injeção de botão** "Ligar" nos contatos
- **Status overlay** durante chamadas
- **Comunicação** com backend via API

### Permissões Necessárias
- `activeTab` - Acessar tab atual
- `storage` - Armazenar configurações
- `host_permissions` - Acessar RD Station

## 🚀 Getting Started

```bash
# Entrar no diretório
cd extension

# Instalar dependências
npm install

# Build da extensão
npm run build

# Modo desenvolvimento
npm run dev
```

## 📦 Instalação no Chrome

1. Abrir `chrome://extensions/`
2. Ativar "Modo desenvolvedor"
3. Clicar em "Carregar extensão"
4. Selecionar pasta `extension/`

## 📋 Scripts Disponíveis

- `npm run build` - Build para produção
- `npm run dev` - Modo desenvolvimento
- `npm run test` - Executar testes
- `npm run package` - Criar .zip para Chrome Store 