# Guia Prático: Implementação Asterisk no Click-to-Call

## 1. Setup do Servidor Asterisk (Docker)

### docker-compose.yml
```yaml
version: '3.8'

services:
  asterisk:
    image: asterisk:18-alpine
    container_name: asterisk-clicktocall
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./asterisk/etc:/etc/asterisk
      - ./asterisk/sounds:/var/lib/asterisk/sounds
      - ./asterisk/recordings:/var/spool/asterisk/monitor
      - ./asterisk/certs:/etc/asterisk/keys
    environment:
      - ASTERISK_UID=1000
      - ASTERISK_GID=1000
```

### Configuração PJSIP (asterisk/etc/pjsip.conf)
```ini
; Transporte WebSocket para WebRTC
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=/etc/asterisk/keys/cert.pem
priv_key_file=/etc/asterisk/keys/key.pem

; Template para agentes WebRTC
[webrtc-agent](!)
type=endpoint
context=from-agents
disallow=all
allow=opus,ulaw,alaw
webrtc=yes
dtls_auto_generate_cert=yes
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes
use_avpf=yes
media_encryption=dtls
dtls_verify=fingerprint
dtls_setup=actpass
direct_media=no

; Tronco SIP para provedor brasileiro
[trunk-brasil]
type=endpoint
context=from-pstn
disallow=all
allow=ulaw,alaw,g729
outbound_auth=trunk-brasil-auth
aors=trunk-brasil
from_user=seu_usuario
from_domain=provedor.com.br

[trunk-brasil-auth]
type=auth
auth_type=userpass
username=seu_usuario
password=sua_senha

[trunk-brasil]
type=aor
contact=sip:provedor.com.br
qualify_frequency=60

; Exemplo de agente (seria criado dinamicamente)
[agent-1001](webrtc-agent)
auth=agent-1001-auth
aors=agent-1001

[agent-1001-auth]
type=auth
auth_type=userpass
username=agent-1001
password=senhasegura123

[agent-1001]
type=aor
max_contacts=1
remove_existing=yes
```

### Dialplan (asterisk/etc/extensions.conf)
```ini
[general]
static=yes
writeprotect=no

[from-agents]
; Contexto para chamadas originadas pelos agentes
exten => _55XXXXXXXXX,1,NoOp(Ligando para ${EXTEN})
 same => n,Set(CALLERID(name)=${AGENT_NAME})
 same => n,MixMonitor(${UNIQUEID}.wav,ab)
 same => n,Dial(PJSIP/${EXTEN}@trunk-brasil,60,L(3600000))
 same => n,Hangup()

[from-internal]
; Contexto para chamadas originadas via AMI/ARI
exten => _X.,1,NoOp(Click-to-call para ${EXTEN})
 same => n,Answer()
 same => n,Dial(PJSIP/${EXTEN}@trunk-brasil,60)
 same => n,Hangup()
```

## 2. Modificações no Backend Node.js

### Instalar dependências
```bash
npm install asterisk-manager jssip ws
npm uninstall twilio
```

### Novo serviço Asterisk (src/services/asterisk.service.ts)
```typescript
import AsteriskManager from 'asterisk-manager';
import { EventEmitter } from 'events';

class AsteriskService extends EventEmitter {
  private ami: any;
  private connected: boolean = false;

  constructor() {
    super();
    this.initializeAMI();
  }

  private initializeAMI() {
    this.ami = new AsteriskManager(
      5038, // porta AMI
      process.env.ASTERISK_HOST || 'localhost',
      process.env.ASTERISK_AMI_USER || 'admin',
      process.env.ASTERISK_AMI_PASSWORD || 'secret',
      true // eventos
    );

    this.ami.on('connect', () => {
      console.log('Conectado ao Asterisk AMI');
      this.connected = true;
    });

    this.ami.on('error', (err: any) => {
      console.error('Erro AMI:', err);
    });

    // Eventos de chamada
    this.ami.on('dial', (evt: any) => {
      this.emit('call-dial', evt);
    });

    this.ami.on('hangup', (evt: any) => {
      this.emit('call-hangup', evt);
    });

    this.ami.on('bridge', (evt: any) => {
      this.emit('call-bridge', evt);
    });
  }

  async startCall(agentId: string, phoneNumber: string, companyId: string) {
    if (!this.connected) {
      throw new Error('Asterisk AMI não conectado');
    }

    // Formatar número para padrão brasileiro
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    
    return new Promise((resolve, reject) => {
      this.ami.action({
        action: 'Originate',
        channel: `PJSIP/agent-${agentId}`,
        context: 'from-agents',
        exten: formattedNumber,
        priority: 1,
        callerid: `"Company ${companyId}" <${agentId}>`,
        variable: {
          AGENT_ID: agentId,
          COMPANY_ID: companyId,
          LEAD_NUMBER: formattedNumber
        },
        async: true
      }, (err: any, res: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  async getCallStatus(uniqueId: string) {
    // Implementar busca de status via AMI
  }

  disconnect() {
    if (this.ami) {
      this.ami.disconnect();
    }
  }
}

export default new AsteriskService();
```

### Atualizar controller (src/controllers/call.controller.ts)
```typescript
import { Request, Response } from 'express';
import { getCalls, createCall } from '../services/call.service';
import asteriskService from '../services/asterisk.service';

export const startCallController = async (req: Request, res: Response): Promise<void> => {
  const { to, companyId, agentId } = req.body;

  if (!to || !companyId || !agentId) {
    res.status(400).json({ 
      message: 'Os campos "to", "companyId" e "agentId" são obrigatórios.' 
    });
    return;
  }

  try {
    // 1. Cria o registro inicial no banco
    const initialCall = await createCall({
      company_id: companyId,
      to_number: to,
      from_number: `agent-${agentId}`,
      status: 'initiated',
    });

    // 2. Inicia a chamada via Asterisk
    const asteriskResponse = await asteriskService.startCall(
      agentId, 
      to, 
      companyId
    );

    // 3. Escutar eventos para atualizar o status
    asteriskService.on('call-dial', async (evt) => {
      if (evt.Uniqueid === asteriskResponse.uniqueid) {
        await updateCall(initialCall.id, { 
          status: 'ringing',
          asterisk_uniqueid: evt.Uniqueid 
        });
      }
    });

    asteriskService.on('call-bridge', async (evt) => {
      if (evt.Uniqueid === asteriskResponse.uniqueid) {
        await updateCall(initialCall.id, { 
          status: 'in-progress' 
        });
      }
    });

    asteriskService.on('call-hangup', async (evt) => {
      if (evt.Uniqueid === asteriskResponse.uniqueid) {
        await updateCall(initialCall.id, { 
          status: 'completed',
          duration: evt.Duration,
          recording_url: `/recordings/${evt.Uniqueid}.wav`
        });
      }
    });

    res.status(200).json({
      message: 'Chamada iniciada com sucesso',
      call_id: initialCall.id,
      asterisk_id: asteriskResponse.uniqueid
    });
  } catch (error) {
    console.error('Erro ao iniciar chamada:', error);
    res.status(500).json({ message: 'Falha ao iniciar chamada' });
  }
};
```

## 3. Implementação do Softphone no Frontend

### Instalar JsSIP
```bash
npm install jssip @types/jssip
```

### Componente Softphone (apps/web/src/components/Softphone.tsx)
```typescript
import React, { useEffect, useState, useRef } from 'react';
import JsSIP from 'jssip';

interface SoftphoneProps {
  agentId: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export const Softphone: React.FC<SoftphoneProps> = ({ 
  agentId, 
  onCallStart, 
  onCallEnd 
}) => {
  const [status, setStatus] = useState<string>('Desconectado');
  const [inCall, setInCall] = useState(false);
  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<JsSIP.RTCSession | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Configurar JsSIP
    const socket = new JsSIP.WebSocketInterface(
      `wss://${process.env.REACT_APP_ASTERISK_HOST}:8089/ws`
    );
    
    const configuration = {
      sockets: [socket],
      uri: `sip:agent-${agentId}@${process.env.REACT_APP_ASTERISK_HOST}`,
      password: process.env.REACT_APP_AGENT_PASSWORD || 'senhasegura123',
      session_timers: false,
      register: true
    };

    const ua = new JsSIP.UA(configuration);
    uaRef.current = ua;

    // Eventos do User Agent
    ua.on('registered', () => {
      setStatus('Pronto para receber chamadas');
    });

    ua.on('unregistered', () => {
      setStatus('Desconectado');
    });

    ua.on('registrationFailed', (e) => {
      setStatus('Falha no registro');
      console.error('Registration failed:', e);
    });

    // Eventos de chamada
    ua.on('newRTCSession', (e: any) => {
      const session = e.session;
      sessionRef.current = session;

      session.on('accepted', () => {
        setStatus('Em chamada');
        setInCall(true);
        onCallStart?.();
      });

      session.on('ended', () => {
        setStatus('Pronto para receber chamadas');
        setInCall(false);
        onCallEnd?.();
      });

      session.on('failed', () => {
        setStatus('Chamada falhou');
        setInCall(false);
      });

      // Conectar áudio
      session.on('peerconnection', (e: any) => {
        const pc = e.peerconnection;
        
        pc.ontrack = (event: RTCTrackEvent) => {
          if (audioRef.current) {
            audioRef.current.srcObject = event.streams[0];
            audioRef.current.play();
          }
        };
      });

      // Auto-atender chamadas recebidas
      if (session.direction === 'incoming') {
        session.answer({
          mediaConstraints: { audio: true, video: false }
        });
      }
    });

    ua.start();

    return () => {
      if (uaRef.current) {
        uaRef.current.stop();
      }
    };
  }, [agentId, onCallStart, onCallEnd]);

  const handleHangup = () => {
    if (sessionRef.current) {
      sessionRef.current.terminate();
    }
  };

  return (
    <div className="softphone-widget">
      <div className="status-indicator">
        <span className={`status-dot ${inCall ? 'active' : 'ready'}`} />
        <span>{status}</span>
      </div>
      
      {inCall && (
        <button 
          onClick={handleHangup}
          className="hangup-button"
        >
          Desligar
        </button>
      )}
      
      <audio ref={audioRef} autoPlay />
    </div>
  );
};
```

### Integração no CRM (modificar componente existente)
```typescript
import { Softphone } from './Softphone';

export const CRMInterface: React.FC = () => {
  const [agentId] = useState('1001'); // Vem do login
  
  const handleClickToCall = async (phoneNumber: string) => {
    try {
      const response = await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          companyId: currentCompany.id,
          agentId: agentId
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao iniciar chamada');
      }
      
      // O Asterisk vai chamar o agente via WebRTC
      // O Softphone vai atender automaticamente
    } catch (error) {
      console.error('Erro:', error);
    }
  };
  
  return (
    <div>
      {/* Interface do CRM */}
      
      {/* Widget do Softphone sempre visível */}
      <Softphone 
        agentId={agentId}
        onCallStart={() => console.log('Chamada iniciada')}
        onCallEnd={() => console.log('Chamada finalizada')}
      />
    </div>
  );
};
```

## 4. Configuração de Ambiente

### .env (Backend)
```env
# Asterisk
ASTERISK_HOST=asterisk.suaempresa.com.br
ASTERISK_AMI_USER=admin
ASTERISK_AMI_PASSWORD=senhasegura
ASTERISK_AMI_PORT=5038

# Remover variáveis do Twilio
# API_TWILIO_ACCOUNT_SID=xxx
# API_TWILIO_AUTH_TOKEN=xxx
```

### .env (Frontend)
```env
REACT_APP_ASTERISK_HOST=asterisk.suaempresa.com.br
REACT_APP_AGENT_PASSWORD=senhasegura123
```

## 5. Certificados SSL para WebRTC

```bash
# Gerar certificados com Let's Encrypt
certbot certonly --standalone -d asterisk.suaempresa.com.br

# Copiar para o container Asterisk
cp /etc/letsencrypt/live/asterisk.suaempresa.com.br/fullchain.pem ./asterisk/certs/cert.pem
cp /etc/letsencrypt/live/asterisk.suaempresa.com.br/privkey.pem ./asterisk/certs/key.pem
```

## 6. Testes Iniciais

1. **Testar registro WebRTC**: Verificar se o agente consegue se registrar
2. **Testar chamada interna**: Entre dois agentes WebRTC
3. **Testar chamada externa**: Via tronco SIP para número real
4. **Verificar gravações**: Se os arquivos estão sendo salvos
5. **Monitorar eventos**: Via console do Asterisk

## Próximos Passos

1. Implementar autenticação dinâmica de agentes
2. Sistema de filas para distribuição de chamadas
3. Relatórios e métricas em tempo real
4. Interface administrativa para gerenciar agentes
5. Integração com webhooks para o RD Station CRM 