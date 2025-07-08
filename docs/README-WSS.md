# 🔐 WSS Implementation - Click-to-Call

## 🚀 Quick Start

### Modo Desenvolvimento (WS apenas)
```powershell
# Iniciar com WebSocket não-seguro
.\scripts\setup-wss.ps1 ws

# Acessar: http://localhost:3000
```

### Modo Produção (WS + WSS)
```powershell
# Iniciar com ambos protocolos
.\scripts\setup-wss.ps1 wss

# Acessar: 
# - HTTP: http://localhost:3000 (usa WS)
# - HTTPS: https://localhost:3000 (usa WSS)
```

### Testar Conectividade
```powershell
# Verificar se tudo está funcionando
.\scripts\setup-wss.ps1 test
```

---

## 📋 Status da Implementação

### ✅ Fase 1: Configuração Base (CONCLUÍDA)
- [x] **Certificados auto-assinados** para desenvolvimento
- [x] **Configuração Asterisk dual** (WS + WSS)
- [x] **Frontend adaptativo** com detecção automática
- [x] **Docker Compose WSS** com geração automática de certificados
- [x] **Scripts PowerShell** para facilitar configuração
- [x] **Documentação completa** com guias e troubleshooting

### 🔄 Fase 2: Testes e Refinamentos (EM ANDAMENTO)
- [ ] Testar em diferentes navegadores
- [ ] Validar performance WS vs WSS
- [ ] Otimizar configurações RTP
- [ ] Implementar métricas de conexão

### 🚀 Fase 3: Produção (PENDENTE)
- [ ] Integração Let's Encrypt automática
- [ ] Configurações de segurança avançadas
- [ ] Monitoramento e alertas
- [ ] Documentação de deploy

---

## 🛠️ Arquivos Criados

### Configurações Asterisk
- `asterisk/etc/pjsip-unified.conf` - Configuração WS + WSS
- `asterisk/etc/pjsip-wss.conf` - Configuração WSS apenas
- `asterisk/certs/generate-dev-certs.sh` - Gerador de certificados

### Frontend
- `apps/web/src/components/SoftphoneAdaptive.tsx` - Componente adaptativo
- `apps/web/src/app/page.tsx` - Página com ambos componentes

### Docker & Scripts
- `docker-compose-wss.yml` - Configuração Docker para WSS
- `scripts/setup-wss.ps1` - Script PowerShell de configuração

### Documentação
- `docs/WSS-IMPLEMENTATION-GUIDE.md` - Guia completo
- `README-WSS.md` - Este arquivo

---

## 🔧 Configurações Principais

### Portas
- **8088**: WebSocket (WS) - Desenvolvimento
- **8089**: WebSocket Secure (WSS) - Produção
- **5000-5100**: RTP para áudio

### Endpoints Asterisk
- **agent-1001-ws**: Endpoint para conexões WS
- **agent-1001-wss**: Endpoint para conexões WSS

### Variáveis de Ambiente
```env
NEXT_PUBLIC_ASTERISK_HOST=localhost
NEXT_PUBLIC_ASTERISK_WS_PORT=8088
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_FORCE_PROTOCOL=ws|wss  # Opcional
```

---

## 🧪 Como Testar

### 1. Teste Básico WS
```powershell
.\scripts\setup-wss.ps1 ws
# Acesse: http://localhost:3000
# Componente adaptativo deve mostrar "WS"
```

### 2. Teste Básico WSS
```powershell
.\scripts\setup-wss.ps1 wss
# Acesse: https://localhost:3000
# Aceite certificado auto-assinado
# Componente adaptativo deve mostrar "WSS"
```

### 3. Teste de Fallback
```powershell
# Com containers WSS rodando:
# 1. Acesse https://localhost:3000
# 2. Se WSS falhar, deve fazer fallback para WS
# 3. Verificar logs no console do navegador
```

### 4. Testes de Chamada
- **9999**: Teste de eco (Echo)
- **8888**: Teste de playback

---

## 🐛 Troubleshooting Rápido

### Problema: Certificado rejeitado
```
Solução: Aceitar certificado auto-assinado no navegador
Chrome: Clicar em "Avançado" → "Continuar para localhost"
```

### Problema: WSS não conecta
```powershell
# Verificar se porta está aberta
.\scripts\setup-wss.ps1 test

# Verificar logs
docker logs asterisk-clicktocall-wss --follow
```

### Problema: Containers não sobem
```powershell
# Limpar volumes e reiniciar
docker-compose -f docker-compose-wss.yml down -v
.\scripts\setup-wss.ps1 wss
```

---

## 📞 Comandos Úteis

```powershell
# Status dos containers
docker-compose -f docker-compose-wss.yml ps

# Logs em tempo real
docker-compose -f docker-compose-wss.yml logs -f

# Verificar certificados
docker exec asterisk-clicktocall-wss ls -la /etc/asterisk/keys/

# Reiniciar apenas Asterisk
docker-compose -f docker-compose-wss.yml restart asterisk

# Limpar tudo e recomeçar
docker-compose -f docker-compose-wss.yml down -v
```

---

## 🎯 Próximos Passos

1. **Testar o sistema atual** com WS funcionando
2. **Implementar WSS** usando os arquivos criados
3. **Validar ambos protocolos** funcionando
4. **Otimizar configurações** baseado nos testes
5. **Preparar para produção** com certificados reais

---

## 📚 Documentação Completa

Para informações detalhadas, consulte:
- **Guia Completo**: `docs/WSS-IMPLEMENTATION-GUIDE.md`
- **Configurações**: Arquivos em `asterisk/etc/`
- **Scripts**: `scripts/setup-wss.ps1`

---

**Status**: 🟡 Implementação Base Concluída - Pronto para Testes  
**Última Atualização**: Janeiro 2025 

## 🚀 Quick Start

### Modo Desenvolvimento (WS apenas)
```powershell
# Iniciar com WebSocket não-seguro
.\scripts\setup-wss.ps1 ws

# Acessar: http://localhost:3000
```

### Modo Produção (WS + WSS)
```powershell
# Iniciar com ambos protocolos
.\scripts\setup-wss.ps1 wss

# Acessar: 
# - HTTP: http://localhost:3000 (usa WS)
# - HTTPS: https://localhost:3000 (usa WSS)
```

### Testar Conectividade
```powershell
# Verificar se tudo está funcionando
.\scripts\setup-wss.ps1 test
```

---

## 📋 Status da Implementação

### ✅ Fase 1: Configuração Base (CONCLUÍDA)
- [x] **Certificados auto-assinados** para desenvolvimento
- [x] **Configuração Asterisk dual** (WS + WSS)
- [x] **Frontend adaptativo** com detecção automática
- [x] **Docker Compose WSS** com geração automática de certificados
- [x] **Scripts PowerShell** para facilitar configuração
- [x] **Documentação completa** com guias e troubleshooting

### 🔄 Fase 2: Testes e Refinamentos (EM ANDAMENTO)
- [ ] Testar em diferentes navegadores
- [ ] Validar performance WS vs WSS
- [ ] Otimizar configurações RTP
- [ ] Implementar métricas de conexão

### 🚀 Fase 3: Produção (PENDENTE)
- [ ] Integração Let's Encrypt automática
- [ ] Configurações de segurança avançadas
- [ ] Monitoramento e alertas
- [ ] Documentação de deploy

---

## 🛠️ Arquivos Criados

### Configurações Asterisk
- `asterisk/etc/pjsip-unified.conf` - Configuração WS + WSS
- `asterisk/etc/pjsip-wss.conf` - Configuração WSS apenas
- `asterisk/certs/generate-dev-certs.sh` - Gerador de certificados

### Frontend
- `apps/web/src/components/SoftphoneAdaptive.tsx` - Componente adaptativo
- `apps/web/src/app/page.tsx` - Página com ambos componentes

### Docker & Scripts
- `docker-compose-wss.yml` - Configuração Docker para WSS
- `scripts/setup-wss.ps1` - Script PowerShell de configuração

### Documentação
- `docs/WSS-IMPLEMENTATION-GUIDE.md` - Guia completo
- `README-WSS.md` - Este arquivo

---

## 🔧 Configurações Principais

### Portas
- **8088**: WebSocket (WS) - Desenvolvimento
- **8089**: WebSocket Secure (WSS) - Produção
- **5000-5100**: RTP para áudio

### Endpoints Asterisk
- **agent-1001-ws**: Endpoint para conexões WS
- **agent-1001-wss**: Endpoint para conexões WSS

### Variáveis de Ambiente
```env
NEXT_PUBLIC_ASTERISK_HOST=localhost
NEXT_PUBLIC_ASTERISK_WS_PORT=8088
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_FORCE_PROTOCOL=ws|wss  # Opcional
```

---

## 🧪 Como Testar

### 1. Teste Básico WS
```powershell
.\scripts\setup-wss.ps1 ws
# Acesse: http://localhost:3000
# Componente adaptativo deve mostrar "WS"
```

### 2. Teste Básico WSS
```powershell
.\scripts\setup-wss.ps1 wss
# Acesse: https://localhost:3000
# Aceite certificado auto-assinado
# Componente adaptativo deve mostrar "WSS"
```

### 3. Teste de Fallback
```powershell
# Com containers WSS rodando:
# 1. Acesse https://localhost:3000
# 2. Se WSS falhar, deve fazer fallback para WS
# 3. Verificar logs no console do navegador
```

### 4. Testes de Chamada
- **9999**: Teste de eco (Echo)
- **8888**: Teste de playback

---

## 🐛 Troubleshooting Rápido

### Problema: Certificado rejeitado
```
Solução: Aceitar certificado auto-assinado no navegador
Chrome: Clicar em "Avançado" → "Continuar para localhost"
```

### Problema: WSS não conecta
```powershell
# Verificar se porta está aberta
.\scripts\setup-wss.ps1 test

# Verificar logs
docker logs asterisk-clicktocall-wss --follow
```

### Problema: Containers não sobem
```powershell
# Limpar volumes e reiniciar
docker-compose -f docker-compose-wss.yml down -v
.\scripts\setup-wss.ps1 wss
```

---

## 📞 Comandos Úteis

```powershell
# Status dos containers
docker-compose -f docker-compose-wss.yml ps

# Logs em tempo real
docker-compose -f docker-compose-wss.yml logs -f

# Verificar certificados
docker exec asterisk-clicktocall-wss ls -la /etc/asterisk/keys/

# Reiniciar apenas Asterisk
docker-compose -f docker-compose-wss.yml restart asterisk

# Limpar tudo e recomeçar
docker-compose -f docker-compose-wss.yml down -v
```

---

## 🎯 Próximos Passos

1. **Testar o sistema atual** com WS funcionando
2. **Implementar WSS** usando os arquivos criados
3. **Validar ambos protocolos** funcionando
4. **Otimizar configurações** baseado nos testes
5. **Preparar para produção** com certificados reais

---

## 📚 Documentação Completa

Para informações detalhadas, consulte:
- **Guia Completo**: `docs/WSS-IMPLEMENTATION-GUIDE.md`
- **Configurações**: Arquivos em `asterisk/etc/`
- **Scripts**: `scripts/setup-wss.ps1`

---

**Status**: 🟡 Implementação Base Concluída - Pronto para Testes  
**Última Atualização**: Janeiro 2025 