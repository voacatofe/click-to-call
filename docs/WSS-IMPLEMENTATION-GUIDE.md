# 🔐 Guia de Implementação WSS (WebSocket Secure)

## 📋 Visão Geral

Este documento detalha a implementação de WSS (WebSocket Secure) no sistema Click-to-Call, fornecendo suporte tanto para desenvolvimento (WS) quanto produção (WSS).

## 🎯 Objetivos

- ✅ **Manter compatibilidade WS** para desenvolvimento local
- ✅ **Implementar WSS** para produção segura  
- ✅ **Detecção automática** de protocolo no frontend
- ✅ **Fallback inteligente** WSS → WS quando necessário
- ✅ **Configuração flexível** via variáveis de ambiente

---

## 🚀 Implementação Rápida

### Passo 1: Usar Docker Compose WSS
```bash
# Parar containers atuais
docker-compose down

# Usar configuração WSS
docker-compose -f docker-compose-wss.yml up -d

# Verificar logs
docker-compose -f docker-compose-wss.yml logs -f
```

### Passo 2: Testar Ambos Protocolos
```bash
# Teste WS (HTTP)
curl http://localhost:3000

# Teste WSS (HTTPS) - Aceitar certificado auto-assinado
curl -k https://localhost:3000
```

---

## 📁 Estrutura de Arquivos

```
click-to-call/
├── asterisk/
│   ├── certs/
│   │   └── generate-dev-certs.sh       # Gerador de certificados dev
│   └── etc/
│       ├── pjsip.conf                  # Configuração atual (WS apenas)
│       ├── pjsip-wss.conf             # Configuração WSS apenas
│       └── pjsip-unified.conf         # Configuração WS + WSS
├── apps/web/src/components/
│   ├── Softphone.tsx                   # Componente original (WS)
│   └── SoftphoneAdaptive.tsx          # Componente adaptativo (WS/WSS)
├── docker-compose.yml                  # Configuração atual (WS)
├── docker-compose-wss.yml             # Configuração WSS
└── docs/
    └── WSS-IMPLEMENTATION-GUIDE.md     # Este documento
```

---

## 🔧 Configurações Detalhadas

### Asterisk - Configuração Unificada

**Arquivo:** `asterisk/etc/pjsip-unified.conf`

```ini
;============================ TRANSPORTE DUAL ============================
[transport-ws]
type=transport
protocol=ws
bind=0.0.0.0:8088

[transport-wss] 
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=/etc/asterisk/keys/asterisk.crt
priv_key_file=/etc/asterisk/keys/asterisk.key

;============================ ENDPOINTS ============================
; Endpoint WS (desenvolvimento)
[agent-1001-ws]
type=endpoint
transport=transport-ws
# Configuração simplificada sem DTLS

; Endpoint WSS (produção)  
[agent-1001-wss]
type=endpoint
transport=transport-wss
webrtc=yes
media_encryption=dtls
# Configuração completa WebRTC
```

### Frontend - Detecção Automática

**Componente:** `SoftphoneAdaptive.tsx`

```typescript
const detectConfig = (): SoftphoneConfig => {
  const isSecure = window.location.protocol === 'https:';
  const forceProtocol = process.env.NEXT_PUBLIC_FORCE_PROTOCOL;
  
  if (forceProtocol) {
    return { protocol: forceProtocol, ... };
  }
  
  return isSecure 
    ? { protocol: 'wss', port: 8089, enableFallback: true }
    : { protocol: 'ws', port: 8088, enableFallback: false };
};
```

---

## 🌍 Variáveis de Ambiente

### Desenvolvimento Local
```env
# .env ou docker-compose
NEXT_PUBLIC_ASTERISK_HOST=localhost
NEXT_PUBLIC_ASTERISK_WS_PORT=8088
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_AGENT_PASSWORD=changeme

# Forçar protocolo específico (opcional)
# NEXT_PUBLIC_FORCE_PROTOCOL=ws
# NEXT_PUBLIC_FORCE_PROTOCOL=wss
```

### Produção
```env
# Configurações de produção
NEXT_PUBLIC_ASTERISK_HOST=seu-dominio.com
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_AGENT_PASSWORD=senha-forte-aqui

# Certificados Let's Encrypt
ASTERISK_CERT_PATH=/etc/letsencrypt/live/seu-dominio.com/fullchain.pem
ASTERISK_KEY_PATH=/etc/letsencrypt/live/seu-dominio.com/privkey.pem
```

---

## 🧪 Testes e Validação

### Teste 1: Verificar Certificados
```bash
# Verificar certificado gerado
docker exec asterisk-clicktocall-wss openssl x509 -in /etc/asterisk/keys/asterisk.crt -text -noout

# Testar conectividade WSS
openssl s_client -connect localhost:8089 -servername localhost
```

### Teste 2: Validar Protocolos
```bash
# Testar WS
wscat -c ws://localhost:8088/ws

# Testar WSS (ignorar certificado auto-assinado)  
wscat -c wss://localhost:8089/ws --no-check
```

### Teste 3: Frontend Adaptativo
1. **HTTP** → Acesse `http://localhost:3000` → Deve usar WS
2. **HTTPS** → Acesse `https://localhost:3000` → Deve usar WSS com fallback

---

## 🔒 Segurança e Produção

### Certificados de Produção

#### Opção 1: Let's Encrypt (Recomendado)
```bash
# Instalar certbot
sudo apt install certbot

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Opção 2: Certificado Comercial
```bash
# Gerar CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout seu-dominio.com.key \
  -out seu-dominio.com.csr

# Enviar CSR para CA e obter certificado
# Configurar no Asterisk
```

### Docker Compose Produção
```yaml
services:
  asterisk:
    volumes:
      # Certificados de produção
      - /etc/letsencrypt/live/seu-dominio.com:/etc/asterisk/keys:ro
    environment:
      - EXTERNAL_IP=seu-ip-publico
```

### Configurações de Segurança
```ini
; asterisk/etc/pjsip-production.conf
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=/etc/asterisk/keys/fullchain.pem
priv_key_file=/etc/asterisk/keys/privkey.pem
external_media_address=seu-dominio.com
external_signaling_address=seu-dominio.com

[agent-1001-wss]
type=endpoint
# Senha forte obrigatória
password=senha-muito-forte-aqui
# Configurações de segurança adicionais
timers=yes
timers_min_se=90
```

---

## 🐛 Troubleshooting

### Problema: Certificado Auto-assinado Rejeitado
**Solução:**
1. No Chrome: Acesse `chrome://flags/#allow-insecure-localhost`
2. No Firefox: Acesse `about:config` → `security.tls.insecure_fallback_hosts`
3. Ou use certificado válido

### Problema: WSS Não Conecta
**Debug:**
```bash
# Verificar se porta está aberta
netstat -tlnp | grep 8089

# Verificar logs Asterisk
docker logs asterisk-clicktocall-wss | grep -i wss

# Testar conectividade
openssl s_client -connect localhost:8089
```

### Problema: Fallback Não Funciona
**Verificar:**
```javascript
// Console do navegador
console.log('Protocolo página:', window.location.protocol);
console.log('Força protocolo:', process.env.NEXT_PUBLIC_FORCE_PROTOCOL);
```

---

## 📈 Próximos Passos

### Fase 1: ✅ Configuração Base (Concluída)
- [x] Certificados auto-assinados
- [x] Configuração Asterisk dual
- [x] Frontend adaptativo
- [x] Docker Compose WSS

### Fase 2: 🔄 Testes e Refinamentos
- [ ] Testar em diferentes navegadores
- [ ] Validar performance WS vs WSS
- [ ] Otimizar configurações RTP
- [ ] Implementar métricas de conexão

### Fase 3: 🚀 Produção
- [ ] Integração Let's Encrypt automática
- [ ] Configurações de segurança avançadas  
- [ ] Monitoramento e alertas
- [ ] Documentação de deploy

### Fase 4: 🔧 Melhorias
- [ ] Balanceamento de carga
- [ ] Múltiplos endpoints Asterisk
- [ ] Autenticação OAuth2/JWT
- [ ] Interface de administração

---

## 📞 Comandos Úteis

```bash
# Desenvolvimento com WSS
docker-compose -f docker-compose-wss.yml up -d

# Desenvolvimento apenas WS  
docker-compose up -d

# Verificar certificados
docker exec asterisk-clicktocall-wss ls -la /etc/asterisk/keys/

# Logs em tempo real
docker-compose -f docker-compose-wss.yml logs -f asterisk

# Reiniciar apenas Asterisk
docker-compose -f docker-compose-wss.yml restart asterisk

# Limpar volumes (regenerar certificados)
docker-compose -f docker-compose-wss.yml down -v
```

---

## 📚 Referências

- [Asterisk WebRTC Guide](https://wiki.asterisk.org/wiki/display/AST/WebRTC)
- [JsSIP Documentation](https://jssip.net/documentation/)
- [Let's Encrypt Guide](https://letsencrypt.org/getting-started/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

**Criado em:** Janeiro 2025  
**Versão:** 1.0  
**Status:** �� Em Implementação 

## 📋 Visão Geral

Este documento detalha a implementação de WSS (WebSocket Secure) no sistema Click-to-Call, fornecendo suporte tanto para desenvolvimento (WS) quanto produção (WSS).

## 🎯 Objetivos

- ✅ **Manter compatibilidade WS** para desenvolvimento local
- ✅ **Implementar WSS** para produção segura  
- ✅ **Detecção automática** de protocolo no frontend
- ✅ **Fallback inteligente** WSS → WS quando necessário
- ✅ **Configuração flexível** via variáveis de ambiente

---

## 🚀 Implementação Rápida

### Passo 1: Usar Docker Compose WSS
```bash
# Parar containers atuais
docker-compose down

# Usar configuração WSS
docker-compose -f docker-compose-wss.yml up -d

# Verificar logs
docker-compose -f docker-compose-wss.yml logs -f
```

### Passo 2: Testar Ambos Protocolos
```bash
# Teste WS (HTTP)
curl http://localhost:3000

# Teste WSS (HTTPS) - Aceitar certificado auto-assinado
curl -k https://localhost:3000
```

---

## 📁 Estrutura de Arquivos

```
click-to-call/
├── asterisk/
│   ├── certs/
│   │   └── generate-dev-certs.sh       # Gerador de certificados dev
│   └── etc/
│       ├── pjsip.conf                  # Configuração atual (WS apenas)
│       ├── pjsip-wss.conf             # Configuração WSS apenas
│       └── pjsip-unified.conf         # Configuração WS + WSS
├── apps/web/src/components/
│   ├── Softphone.tsx                   # Componente original (WS)
│   └── SoftphoneAdaptive.tsx          # Componente adaptativo (WS/WSS)
├── docker-compose.yml                  # Configuração atual (WS)
├── docker-compose-wss.yml             # Configuração WSS
└── docs/
    └── WSS-IMPLEMENTATION-GUIDE.md     # Este documento
```

---

## 🔧 Configurações Detalhadas

### Asterisk - Configuração Unificada

**Arquivo:** `asterisk/etc/pjsip-unified.conf`

```ini
;============================ TRANSPORTE DUAL ============================
[transport-ws]
type=transport
protocol=ws
bind=0.0.0.0:8088

[transport-wss] 
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=/etc/asterisk/keys/asterisk.crt
priv_key_file=/etc/asterisk/keys/asterisk.key

;============================ ENDPOINTS ============================
; Endpoint WS (desenvolvimento)
[agent-1001-ws]
type=endpoint
transport=transport-ws
# Configuração simplificada sem DTLS

; Endpoint WSS (produção)  
[agent-1001-wss]
type=endpoint
transport=transport-wss
webrtc=yes
media_encryption=dtls
# Configuração completa WebRTC
```

### Frontend - Detecção Automática

**Componente:** `SoftphoneAdaptive.tsx`

```typescript
const detectConfig = (): SoftphoneConfig => {
  const isSecure = window.location.protocol === 'https:';
  const forceProtocol = process.env.NEXT_PUBLIC_FORCE_PROTOCOL;
  
  if (forceProtocol) {
    return { protocol: forceProtocol, ... };
  }
  
  return isSecure 
    ? { protocol: 'wss', port: 8089, enableFallback: true }
    : { protocol: 'ws', port: 8088, enableFallback: false };
};
```

---

## 🌍 Variáveis de Ambiente

### Desenvolvimento Local
```env
# .env ou docker-compose
NEXT_PUBLIC_ASTERISK_HOST=localhost
NEXT_PUBLIC_ASTERISK_WS_PORT=8088
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_AGENT_PASSWORD=changeme

# Forçar protocolo específico (opcional)
# NEXT_PUBLIC_FORCE_PROTOCOL=ws
# NEXT_PUBLIC_FORCE_PROTOCOL=wss
```

### Produção
```env
# Configurações de produção
NEXT_PUBLIC_ASTERISK_HOST=seu-dominio.com
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_AGENT_PASSWORD=senha-forte-aqui

# Certificados Let's Encrypt
ASTERISK_CERT_PATH=/etc/letsencrypt/live/seu-dominio.com/fullchain.pem
ASTERISK_KEY_PATH=/etc/letsencrypt/live/seu-dominio.com/privkey.pem
```

---

## 🧪 Testes e Validação

### Teste 1: Verificar Certificados
```bash
# Verificar certificado gerado
docker exec asterisk-clicktocall-wss openssl x509 -in /etc/asterisk/keys/asterisk.crt -text -noout

# Testar conectividade WSS
openssl s_client -connect localhost:8089 -servername localhost
```

### Teste 2: Validar Protocolos
```bash
# Testar WS
wscat -c ws://localhost:8088/ws

# Testar WSS (ignorar certificado auto-assinado)  
wscat -c wss://localhost:8089/ws --no-check
```

### Teste 3: Frontend Adaptativo
1. **HTTP** → Acesse `http://localhost:3000` → Deve usar WS
2. **HTTPS** → Acesse `https://localhost:3000` → Deve usar WSS com fallback

---

## 🔒 Segurança e Produção

### Certificados de Produção

#### Opção 1: Let's Encrypt (Recomendado)
```bash
# Instalar certbot
sudo apt install certbot

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Opção 2: Certificado Comercial
```bash
# Gerar CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout seu-dominio.com.key \
  -out seu-dominio.com.csr

# Enviar CSR para CA e obter certificado
# Configurar no Asterisk
```

### Docker Compose Produção
```yaml
services:
  asterisk:
    volumes:
      # Certificados de produção
      - /etc/letsencrypt/live/seu-dominio.com:/etc/asterisk/keys:ro
    environment:
      - EXTERNAL_IP=seu-ip-publico
```

### Configurações de Segurança
```ini
; asterisk/etc/pjsip-production.conf
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=/etc/asterisk/keys/fullchain.pem
priv_key_file=/etc/asterisk/keys/privkey.pem
external_media_address=seu-dominio.com
external_signaling_address=seu-dominio.com

[agent-1001-wss]
type=endpoint
# Senha forte obrigatória
password=senha-muito-forte-aqui
# Configurações de segurança adicionais
timers=yes
timers_min_se=90
```

---

## 🐛 Troubleshooting

### Problema: Certificado Auto-assinado Rejeitado
**Solução:**
1. No Chrome: Acesse `chrome://flags/#allow-insecure-localhost`
2. No Firefox: Acesse `about:config` → `security.tls.insecure_fallback_hosts`
3. Ou use certificado válido

### Problema: WSS Não Conecta
**Debug:**
```bash
# Verificar se porta está aberta
netstat -tlnp | grep 8089

# Verificar logs Asterisk
docker logs asterisk-clicktocall-wss | grep -i wss

# Testar conectividade
openssl s_client -connect localhost:8089
```

### Problema: Fallback Não Funciona
**Verificar:**
```javascript
// Console do navegador
console.log('Protocolo página:', window.location.protocol);
console.log('Força protocolo:', process.env.NEXT_PUBLIC_FORCE_PROTOCOL);
```

---

## 📈 Próximos Passos

### Fase 1: ✅ Configuração Base (Concluída)
- [x] Certificados auto-assinados
- [x] Configuração Asterisk dual
- [x] Frontend adaptativo
- [x] Docker Compose WSS

### Fase 2: 🔄 Testes e Refinamentos
- [ ] Testar em diferentes navegadores
- [ ] Validar performance WS vs WSS
- [ ] Otimizar configurações RTP
- [ ] Implementar métricas de conexão

### Fase 3: 🚀 Produção
- [ ] Integração Let's Encrypt automática
- [ ] Configurações de segurança avançadas  
- [ ] Monitoramento e alertas
- [ ] Documentação de deploy

### Fase 4: 🔧 Melhorias
- [ ] Balanceamento de carga
- [ ] Múltiplos endpoints Asterisk
- [ ] Autenticação OAuth2/JWT
- [ ] Interface de administração

---

## 📞 Comandos Úteis

```bash
# Desenvolvimento com WSS
docker-compose -f docker-compose-wss.yml up -d

# Desenvolvimento apenas WS  
docker-compose up -d

# Verificar certificados
docker exec asterisk-clicktocall-wss ls -la /etc/asterisk/keys/

# Logs em tempo real
docker-compose -f docker-compose-wss.yml logs -f asterisk

# Reiniciar apenas Asterisk
docker-compose -f docker-compose-wss.yml restart asterisk

# Limpar volumes (regenerar certificados)
docker-compose -f docker-compose-wss.yml down -v
```

---

## 📚 Referências

- [Asterisk WebRTC Guide](https://wiki.asterisk.org/wiki/display/AST/WebRTC)
- [JsSIP Documentation](https://jssip.net/documentation/)
- [Let's Encrypt Guide](https://letsencrypt.org/getting-started/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

**Criado em:** Janeiro 2025  
**Versão:** 1.0  
**Status:** �� Em Implementação 