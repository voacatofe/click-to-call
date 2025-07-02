# Shared - Recursos Compartilhados

> 🔗 **Código e tipos compartilhados entre backend, frontend e extension**

## 📁 Estrutura

```
shared/
├── types/                 # Definições TypeScript compartilhadas
│   ├── api.ts            # Tipos para API requests/responses
│   ├── call.ts           # Tipos relacionados a chamadas
│   ├── contact.ts        # Tipos de contatos RD Station
│   ├── twilio.ts         # Tipos específicos do Twilio
│   └── index.ts          # Exports centralizados
└── utils/                # Utilitários compartilhados
    ├── validation.ts     # Validadores comuns
    ├── formatters.ts     # Formatadores (phone, date, etc)
    ├── constants.ts      # Constantes do projeto
    └── index.ts          # Exports centralizados
```

## 🎯 Propósito

### Evitar Duplicação
- **Tipos consistentes** entre todas as camadas
- **Validações uniformes** em frontend/backend
- **Constantes centralizadas** (URLs, códigos, etc)

### Facilitar Manutenção
- **Single source of truth** para interfaces
- **Refatoração segura** com TypeScript
- **Reutilização de código** entre projetos

## 🛠️ Tecnologias

- **TypeScript** - Tipagem estática
- **Zod** - Validação runtime
- **ESLint** - Padronização de código

## 📋 Tipos Principais

### API Types
```typescript
interface CallRequest {
  contactId: string;
  phoneNumber: string;
  callerId?: string;
}

interface CallResponse {
  callId: string;
  status: CallStatus;
  duration?: number;
}
```

### Contact Types
```typescript
interface RDContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
}
```

## 🚀 Como Usar

### No Backend
```typescript
import { CallRequest, validatePhone } from '../shared';
```

### No Frontend
```typescript
import { RDContact, formatPhone } from '../shared';
```

### Na Extension
```typescript
import { CallStatus, API_ENDPOINTS } from '../shared';
``` 