# Análise de Migração: Twilio para Asterisk

## 1. Resumo Executivo

A migração do Twilio para Asterisk self-hosted oferece uma redução significativa de custos (40-70% nas tarifas de chamadas) mas requer investimento em desenvolvimento e infraestrutura. Para um SaaS multi-tenant de click-to-call, a solução é viável e pode trazer autonomia total sobre a telefonia.

## 2. Principais Mudanças Necessárias

### 2.1 Infraestrutura
- **Novo Servidor**: VPS Linux com Asterisk (Docker recomendado)
- **Certificados SSL**: Para WebRTC (Let's Encrypt)
- **Tronco SIP**: Contrato com provedor brasileiro (Directcall, Virtual Call, etc.)
- **STUN/TURN Server**: Para NAT traversal (coturn)

### 2.2 Backend (Node.js)
- **Remover**: Twilio SDK
- **Adicionar**: 
  - `asterisk-manager` (AMI) ou `ari-client` (ARI)
  - Lógica de controle de chamadas
  - Gerenciamento de eventos do Asterisk
  - Sistema de gravação de chamadas

### 2.3 Frontend (React)
- **Adicionar**: 
  - Softphone WebRTC (JsSIP ou react-softphone)
  - Interface de chamada integrada
  - Gestão de áudio/microfone no navegador

### 2.4 Configuração Asterisk
- **PJSIP**: Para WebRTC e troncos SIP
- **Dialplan**: Lógica de roteamento
- **Contextos**: Separação multi-tenant
- **Certificados**: TLS/DTLS para WebRTC

## 3. Arquitetura Proposta

```
┌─────────────────┐     WebRTC/WSS      ┌──────────────┐
│  Frontend React │◄───────────────────►│              │
│  (Softphone)    │                     │   Asterisk   │
└────────┬────────┘                     │    Server    │
         │                              │              │
         │ API REST                     │  ┌────────┐  │
         ▼                              │  │Dialplan│  │
┌─────────────────┐      AMI/ARI       │  └────────┘  │
│  Backend Node.js│◄───────────────────►│              │
│  (Controle)     │                     └──────┬───────┘
└────────┬────────┘                            │
         │                                     │ SIP
         ▼                                     ▼
┌─────────────────┐                    ┌──────────────┐
│    Supabase     │                    │ Tronco SIP   │
│   (Database)    │                    │  Brasileiro  │
└─────────────────┘                    └──────────────┘
```

## 4. Componentes Principais

### 4.1 Servidor Asterisk
- **Especificações mínimas**: 2 vCPU, 4GB RAM para ~50 chamadas simultâneas
- **Configuração WebRTC**: Habilitar WSS na porta 8089
- **Multi-tenancy**: Contextos separados por empresa/cliente

### 4.2 Integração Backend
```javascript
// Exemplo com asterisk-manager (AMI)
const AsteriskManager = require('asterisk-manager');
const ami = new AsteriskManager(5038, 'localhost', 'admin', 'password');

// Originar chamada
ami.action({
  'action': 'originate',
  'channel': 'PJSIP/agent-webrtc',
  'context': 'from-internal',
  'exten': phoneNumber,
  'priority': 1,
  'callerid': companyName,
  'async': true
});
```

### 4.3 Softphone Web
```javascript
// Exemplo com JsSIP
import JsSIP from 'jssip';

const socket = new JsSIP.WebSocketInterface('wss://asterisk.server:8089/ws');
const configuration = {
  sockets: [socket],
  uri: 'sip:agent@asterisk.server',
  password: 'agent-password'
};

const ua = new JsSIP.UA(configuration);
ua.start();
```

## 5. Fluxo de Chamada Click-to-Call

1. **Agente clica em "Ligar"** no CRM
2. **Frontend** envia requisição para Backend
3. **Backend** instrui Asterisk via AMI/ARI
4. **Asterisk** chama o agente via WebRTC
5. **Agente atende** no navegador
6. **Asterisk** disca para o lead via tronco SIP
7. **Chamada é conectada** (bridge)
8. **Eventos são capturados** e salvos no banco

## 6. Estimativa de Custos

### Custos Iniciais (Desenvolvimento)
- **Desenvolvimento**: 80-120 horas
- **Configuração Infraestrutura**: 20-40 horas
- **Testes e Ajustes**: 20-30 horas
- **Total**: ~120-190 horas de desenvolvimento

### Custos Mensais Operacionais
- **VPS (4 vCPU, 4GB RAM)**: R$ 150-200/mês
- **Tronco SIP (plano básico)**: R$ 50-100/mês
- **Minutos (1000 min celular)**: R$ 140-180 (vs R$ 310 no Twilio)
- **Total**: ~R$ 340-480/mês + minutos

### ROI Estimado
- **Economia mensal**: R$ 100-200 em infraestrutura fixa
- **Economia por minuto**: R$ 0,13-0,17 (celular)
- **Break-even**: 3-6 meses dependendo do volume

## 7. Vantagens da Migração

1. **Redução de custos**: 40-70% nas tarifas
2. **Controle total**: Sem dependência de APIs externas
3. **Customização**: Funcionalidades sob medida
4. **Dados locais**: Gravações e logs sob controle
5. **Moeda local**: Pagamentos em BRL sem IOF

## 8. Desafios e Riscos

1. **Complexidade técnica**: Curva de aprendizado Asterisk
2. **Manutenção**: Responsabilidade pela infraestrutura
3. **Qualidade**: Depende do provedor SIP escolhido
4. **Segurança**: Configuração correta de firewall/TLS
5. **Escalabilidade**: Planejamento para crescimento

## 9. Roadmap de Implementação

### Fase 1 - MVP (2-3 semanas)
- [ ] Setup servidor Asterisk com Docker
- [ ] Configuração básica PJSIP + WebRTC
- [ ] Integração AMI no backend
- [ ] Softphone simples no frontend
- [ ] Testes com tronco SIP de teste

### Fase 2 - Produção (2-3 semanas)
- [ ] Contrato com provedor SIP brasileiro
- [ ] Sistema de gravação de chamadas
- [ ] Multi-tenancy (contextos por empresa)
- [ ] Interface de usuário polida
- [ ] Monitoramento e logs

### Fase 3 - Otimização (1-2 semanas)
- [ ] STUN/TURN server
- [ ] Failover e redundância
- [ ] Métricas e relatórios
- [ ] Otimização de custos

## 10. Conclusão

A migração é tecnicamente viável e financeiramente vantajosa para volumes médios a altos de chamadas. O investimento inicial em desenvolvimento se paga rapidamente com a economia nas tarifas. Para um SaaS que tem a telefonia como core business, ter controle total sobre a infraestrutura é estratégico. 