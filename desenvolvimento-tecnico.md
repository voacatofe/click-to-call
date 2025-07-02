# **Guia de Desenvolvimento Técnico - Plataforma SaaS de Click-to-Call**

## **Visão Geral Técnica**

Este documento detalha a implementação técnica da plataforma SaaS de click-to-call integrada ao RD Station CRM, utilizando tecnologias modernas e melhores práticas para desenvolvimento acelerado e escalável.

### **Características Técnicas Principais**

- **Stack Moderno**: React + TypeScript frontend, Node.js + TypeScript backend
- **Arquitetura Cloud-Native**: Containerizada e preparada para escalabilidade
- **API-First**: Design orientado a APIs com documentação automatizada
- **Segurança Integrada**: OAuth2, JWT, criptografia de dados
- **Observabilidade**: Logging, monitoramento e métricas integradas
- **CI/CD**: Pipeline automatizado para desenvolvimento e deploy contínuo

---

## **Stack Tecnológico Detalhado**

### **Frontend (React + TypeScript)**

**Tecnologias Principais:**
- **React 18+** com hooks modernos e TypeScript
- **Next.js** para SSR/SSG e otimizações de performance
- **Tailwind CSS** para estilização rápida e responsiva
- **React Query** para gerenciamento de estado servidor
- **React Hook Form** para validação de formulários
- **Framer Motion** para animações suaves

**Estrutura de Pastas Frontend:**
```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes básicos (botões, inputs)
│   ├── forms/           # Formulários específicos
│   └── widgets/         # Widgets de telefonia (softphone)
├── pages/               # Páginas da aplicação
├── hooks/               # Custom hooks
├── services/            # Camada de API
├── types/               # Definições TypeScript
├── utils/               # Utilitários e helpers
└── config/              # Configurações da aplicação
```

### **Backend (Node.js + TypeScript)**

**Tecnologias Principais:**
- **Node.js 18+ LTS** com TypeScript
- **Express.js** com middlewares de segurança
- **Prisma ORM** para banco de dados
- **PostgreSQL** como banco principal
- **Redis** para cache e sessões
- **Twilio SDK** para funcionalidades de voz
- **JWT** para autenticação
- **Winston** para logging estruturado

**Estrutura de Pastas Backend:**
```
src/
├── controllers/         # Controladores das rotas
├── services/           # Lógica de negócio
├── models/             # Modelos de dados (Prisma)
├── middleware/         # Middlewares customizados
├── routes/             # Definição de rotas
├── utils/              # Utilitários e helpers
├── config/             # Configurações da aplicação
├── types/              # Definições TypeScript
└── tests/              # Testes automatizados
```

---

## **Arquitetura da Aplicação**

### **Diagrama de Arquitetura High-Level**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │   Integrations  │
│   (React)       │◄───│   (Node.js)     │◄───│                │
│                 │    │                 │    │  • RD Station   │
│  • Dashboard    │    │  • API REST     │    │  • Twilio       │
│  • Softphone    │    │  • WebSockets   │    │  • Analytics    │
│  • Reports      │    │  • Auth         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         │              │   Infrastructure │             │
         └──────────────│                 │─────────────┘
                        │  • PostgreSQL   │
                        │  • Redis        │
                        │  • File Storage │
                        └─────────────────┘
```

### **Fluxo de Dados Principal**

1. **Usuário clica em "Ligar"** no RD Station CRM
2. **Frontend captura evento** e valida permissões
3. **API processa solicitação** e obtém dados do lead
4. **Twilio API é chamada** para iniciar chamada
5. **WebSocket notifica frontend** sobre status
6. **Chamada é estabelecida** via WebRTC ou telefone
7. **Eventos são logados** no banco de dados
8. **Atividade é registrada** no RD Station CRM

---

## **Implementação Detalhada por Módulo**

### **1. Módulo de Autenticação**

**Tecnologias:** OAuth2, JWT, bcrypt

```typescript
// src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthService {
  async authenticateUser(email: string, password: string) {
    // Validação e autenticação
    const user = await this.userService.findByEmail(email);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new UnauthorizedError('Credenciais inválidas');
    }
    
    // Geração do token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    return { user, token };
  }
}
```

### **2. Integração RD Station CRM**

**Fluxo OAuth2 + APIs:**

```typescript
// src/services/rdstation.service.ts
export class RDStationService {
  private readonly baseURL = 'https://api.rdstation.com/v2';
  
  async getContactData(contactId: string, accessToken: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/contacts/${contactId}`,
        { 
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Erro ao buscar contato do RD Station', { error, contactId });
      throw new ExternalAPIError('Falha na integração com RD Station');
    }
  }
  
  async logCallActivity(contactId: string, callData: CallActivity) {
    // Registra atividade de chamada no CRM
    const activity = {
      contact_id: contactId,
      activity_type: 'call',
      duration: callData.duration,
      recording_url: callData.recordingUrl,
      notes: callData.notes,
      timestamp: new Date().toISOString()
    };
    
    return await this.createActivity(activity);
  }
}
``` 

### **3. Integração Twilio (Voice API)**

**Implementação WebRTC + Voice API:**

```typescript
// src/services/twilio.service.ts
import twilio from 'twilio';

export class TwilioService {
  private client: twilio.Twilio;
  
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
      {
        autoRetry: true,
        maxRetries: 3,
        timeout: 30000
      }
    );
  }
  
  async initiateCall(fromNumber: string, toNumber: string, callbackUrl: string) {
    try {
      const call = await this.client.calls.create({
        to: toNumber,
        from: fromNumber,
        url: callbackUrl, // TwiML para controlar a chamada
        record: true,
        recordingStatusCallback: `${process.env.BASE_URL}/webhooks/recording-status`,
        statusCallback: `${process.env.BASE_URL}/webhooks/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });
      
      this.logger.info('Chamada iniciada', { callSid: call.sid, to: toNumber });
      return call;
    } catch (error) {
      this.logger.error('Erro ao iniciar chamada', { error, toNumber });
      throw new ExternalAPIError('Falha ao iniciar chamada');
    }
  }
  
  async generateAccessToken(identity: string): Promise<string> {
    // Gera token para cliente WebRTC
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_APP_SID,
      incomingAllow: true
    });
    
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_API_SECRET!,
      { identity }
    );
    
    token.addGrant(voiceGrant);
    return token.toJwt();
  }
}
```

### **4. Frontend React - Componente Softphone**

**Componente Principal do Softphone:**

```typescript
// src/components/Softphone/Softphone.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Device } from '@twilio/voice-sdk';
import { useAuth } from '@/hooks/useAuth';
import { useTwilioToken } from '@/hooks/useTwilioToken';

interface SoftphoneProps {
  contactNumber: string;
  contactName: string;
  onCallComplete: (callData: CallData) => void;
}

export const Softphone: React.FC<SoftphoneProps> = ({
  contactNumber,
  contactName,
  onCallComplete
}) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  
  const { user } = useAuth();
  const { token, isLoading: tokenLoading } = useTwilioToken(user?.id);
  
  // Inicialização do Device Twilio
  useEffect(() => {
    if (token && !device) {
      const newDevice = new Device(token, {
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
        codecPreferences: ['opus', 'pcmu']
      });
      
      // Event listeners
      newDevice.on('ready', () => {
        console.log('Device pronto para chamadas');
        setIsConnected(true);
      });
      
      newDevice.on('error', (error) => {
        console.error('Erro no device:', error);
        setCallStatus('ended');
      });
      
      newDevice.on('incoming', (call) => {
        // Lógica para chamadas recebidas se necessário
      });
      
      setDevice(newDevice);
    }
    
    return () => {
      device?.destroy();
    };
  }, [token]);
  
  // Iniciar chamada
  const handleCall = useCallback(async () => {
    if (!device || !contactNumber) return;
    
    try {
      setCallStatus('calling');
      const call = await device.connect({
        params: {
          To: contactNumber,
          From: user?.phoneNumber || process.env.NEXT_PUBLIC_DEFAULT_CALLER_ID
        }
      });
      
      // Event listeners da chamada
      call.on('accept', () => {
        setCallStatus('connected');
        startCallTimer();
      });
      
      call.on('disconnect', () => {
        setCallStatus('ended');
        stopCallTimer();
        onCallComplete({
          duration: callDuration,
          contactNumber,
          contactName,
          timestamp: new Date().toISOString()
        });
      });
      
    } catch (error) {
      console.error('Erro ao fazer chamada:', error);
      setCallStatus('ended');
    }
  }, [device, contactNumber, user]);
  
  // Timer da chamada
  const startCallTimer = () => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (tokenLoading || !isConnected) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Conectando...</span>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{contactName}</h3>
        <p className="text-gray-600">{contactNumber}</p>
        {callStatus === 'connected' && (
          <p className="text-green-600 font-mono text-lg">{formatDuration(callDuration)}</p>
        )}
      </div>
      
      <div className="flex justify-center space-x-4">
        {callStatus === 'idle' && (
          <button
            onClick={handleCall}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors"
            disabled={!isConnected}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </button>
        )}
        
        {(callStatus === 'calling' || callStatus === 'connected') && (
          <button
            onClick={() => device?.disconnectAll()}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.5a1 1 0 001.196.98l10-2A1 1 0 0018 9.5V3z" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          callStatus === 'idle' ? 'bg-gray-100 text-gray-800' :
          callStatus === 'calling' ? 'bg-yellow-100 text-yellow-800' :
          callStatus === 'connected' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {callStatus === 'idle' ? 'Pronto' :
           callStatus === 'calling' ? 'Chamando...' :
           callStatus === 'connected' ? 'Conectado' :
           'Chamada Finalizada'}
        </span>
      </div>
    </div>
  );
};
```

---

## **Banco de Dados e Modelos**

### **Schema Prisma**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  company   Company  @relation(fields: [companyId], references: [id])
  companyId String
  
  // Configurações de telefonia
  phoneNumber     String?
  twilioIdentity  String?
  rdStationToken  String? // Token OAuth do RD Station
  
  calls       Call[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("users")
}

model Company {
  id            String   @id @default(cuid())
  name          String
  domain        String   @unique
  
  // Configurações Twilio
  twilioAccountSid    String?
  twilioAuthToken     String? // Criptografado
  twilioPhoneNumber   String?
  
  // Configurações RD Station
  rdStationClientId     String?
  rdStationClientSecret String? // Criptografado
  
  users         User[]
  calls         Call[]
  settings      CompanySettings?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("companies")
}

model Call {
  id              String      @id @default(cuid())
  twilioCallSid   String      @unique
  
  // Participantes
  user            User        @relation(fields: [userId], references: [id])
  userId          String
  company         Company     @relation(fields: [companyId], references: [id])
  companyId       String
  
  // Dados da chamada
  fromNumber      String
  toNumber        String
  status          CallStatus
  direction       Direction   @default(OUTBOUND)
  duration        Int?        // Em segundos
  
  // Integração RD Station
  rdContactId     String?
  rdContactName   String?
  
  // Gravação
  recordingUrl    String?
  recordingSid    String?
  
  // Timestamps
  startedAt       DateTime?
  answeredAt      DateTime?
  endedAt         DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@map("calls")
}

model CompanySettings {
  id                    String  @id @default(cuid())
  company               Company @relation(fields: [companyId], references: [id])
  companyId             String  @unique
  
  // Configurações de chamadas
  autoRecord            Boolean @default(true)
  maxCallDuration       Int     @default(3600) // 1 hora
  allowInternational    Boolean @default(false)
  
  // Configurações de integração
  syncWithRDStation     Boolean @default(true)
  createRDActivities    Boolean @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@map("company_settings")
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

enum CallStatus {
  INITIATED
  RINGING
  IN_PROGRESS
  COMPLETED
  FAILED
  BUSY
  NO_ANSWER
  CANCELLED
}

enum Direction {
  INBOUND
  OUTBOUND
}
```

---

## **Configuração de Desenvolvimento**

### **Variáveis de Ambiente**

```env
# .env.example

# Aplicação
NODE_ENV=development
PORT=3001
BASE_URL=http://localhost:3001

# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/clicktocall_dev"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_twilio_api_secret
TWILIO_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+5511999999999

# RD Station
RD_STATION_CLIENT_ID=your_rd_station_client_id
RD_STATION_CLIENT_SECRET=your_rd_station_client_secret
RD_STATION_REDIRECT_URI=http://localhost:3001/auth/rdstation/callback

# Logs
LOG_LEVEL=debug
LOG_FILE=logs/application.log

# Storage (para gravações)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=clicktocall-recordings
AWS_REGION=us-east-1

# Monitoramento
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### **Docker Configuration**

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Instalação de dependências
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force

# Build da aplicação
COPY . .
RUN npm run build
RUN npx prisma generate

# Imagem de produção
FROM node:18-alpine AS production

WORKDIR /app

# Usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cópia dos arquivos necessários
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: clicktocall
      POSTGRES_USER: clicktocall_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## **Scripts de Desenvolvimento**

### **package.json - Scripts principais**

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/server.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### **Comandos de Setup Inicial**

```bash
# Setup completo do projeto
#!/bin/bash

# 1. Instalar dependências
npm install

# 2. Configurar banco de dados
cp .env.example .env
# Editar .env com suas configurações

# 3. Configurar banco
npm run db:migrate
npm run db:seed

# 4. Gerar cliente Prisma
npm run db:generate

# 5. Iniciar desenvolvimento
npm run dev
```

---

## **Próximos Passos**

### **Fase 1 - MVP (Semanas 1-8)**
1. ✅ Configuração do ambiente de desenvolvimento
2. ⏳ Implementação da autenticação OAuth2
3. ⏳ Integração básica com RD Station API
4. ⏳ Implementação do Twilio Voice SDK
5. ⏳ Componente Softphone React
6. ⏳ Sistema básico de logging de chamadas

### **Fase 2 - Funcionalidades Avançadas (Semanas 9-16)**
1. Dashboard de relatórios
2. Gravação e reprodução de chamadas
3. Webhooks para eventos de chamada
4. Sistema de notificações em tempo real
5. Testes automatizados e CI/CD

### **Fase 3 - Produção (Semanas 17-24)**
1. Otimizações de performance
2. Monitoramento e observabilidade
3. Documentação da API
4. Deploy em produção
5. Suporte e manutenção

---

**Este documento serve como guia técnico completo para implementação da plataforma. Todas as tecnologias e padrões escolhidos foram baseados nas melhores práticas atuais e na necessidade de desenvolvimento acelerado com qualidade.** 