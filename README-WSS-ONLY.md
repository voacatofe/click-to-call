# Click-to-Call WSS-Only Configuration

Este README contém as instruções para usar **apenas WebSocket Secure (WSS)** no projeto, baseado na análise minuciosa da documentação oficial do Asterisk.

## 📋 Mudanças Implementadas

### ✅ Arquivos Criados/Modificados

1. **`docker-compose-wss-only.yml`** - Nova configuração Docker apenas para WSS
2. **`asterisk/etc/http-wss.conf`** - Configuração HTTP com TLS/WSS
3. **`asterisk/etc/pjsip-wss-only.conf`** - Configuração PJSIP apenas WSS
4. **`apps/web/src/components/SoftphoneAdaptive.tsx`** - Componente atualizado para WSS-only

### 🔧 Configurações Baseadas na Documentação Oficial

#### **HTTP Configuration (`http-wss.conf`)**
```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
; TLS/WSS Configuration (OBRIGATÓRIO)
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/etc/asterisk/keys/asterisk.crt
tlsprivatekey=/etc/asterisk/keys/asterisk.key
```

#### **PJSIP Configuration (`pjsip-wss-only.conf`)**
```ini
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0
; Nota: Outros parâmetros são IGNORADOS para WSS (doc oficial)

[agent-1001-wss]
type=endpoint
webrtc=yes  ; Habilita automaticamente todas as opções WebRTC
dtls_auto_generate_cert=yes
transport=transport-wss
```

## 🚀 Como Usar

### 1. Iniciar o Sistema WSS-Only

```powershell
# Parar qualquer container existente
docker-compose down

# Iniciar com WSS-only
docker-compose -f docker-compose-wss-only.yml up -d
```

### 2. Verificar Status

```powershell
# Ver logs do certificado
docker-compose -f docker-compose-wss-only.yml logs cert-generator

# Ver logs do Asterisk
docker-compose -f docker-compose-wss-only.yml logs asterisk

# Verificar se WSS está funcionando
docker-compose -f docker-compose-wss-only.yml exec asterisk asterisk -rx "http show status"
```

### 3. Acessar o Frontend

- **URL**: http://localhost:3000
- **Protocolo Forçado**: WSS (via `NEXT_PUBLIC_FORCE_PROTOCOL=wss`)
- **Porta WSS**: 8089

## 🔒 Recursos de Segurança

### Certificados TLS Automáticos
- **Geração Automática**: Certificados auto-assinados para desenvolvimento
- **Localização**: Volume Docker `asterisk_certs`
- **Validação**: SAN inclui localhost, 127.0.0.1, ::1

### WebRTC Seguro
- **DTLS**: Criptografia de mídia obrigatória
- **ICE Support**: Conectividade através de NAT
- **SRTP**: Mídia segura automaticamente

## 📊 Monitoramento

### Comandos CLI do Asterisk

```bash
# Conectar ao container Asterisk
docker-compose -f docker-compose-wss-only.yml exec asterisk asterisk -r

# Verificar status HTTP/WSS
http show status

# Verificar transports PJSIP
pjsip show transports

# Verificar endpoints registrados
pjsip show endpoints

# Ver registrações ativas
pjsip show registrations
```

### Logs Importantes

```bash
# Logs de certificado
docker-compose -f docker-compose-wss-only.yml logs cert-generator

# Logs do Asterisk
docker-compose -f docker-compose-wss-only.yml logs asterisk

# Logs do frontend
docker-compose -f docker-compose-wss-only.yml logs web
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **"WSS connection failed"**
   ```bash
   # Verificar se certificados foram gerados
   docker-compose -f docker-compose-wss-only.yml exec asterisk ls -la /etc/asterisk/keys/
   
   # Verificar se HTTPS está ativo
   docker-compose -f docker-compose-wss-only.yml exec asterisk asterisk -rx "http show status"
   ```

2. **"Registration failed"**
   ```bash
   # Verificar endpoint WSS
   docker-compose -f docker-compose-wss-only.yml exec asterisk asterisk -rx "pjsip show endpoint agent-1001-wss"
   ```

3. **"No audio"**
   ```bash
   # Verificar RTP
   docker-compose -f docker-compose-wss-only.yml exec asterisk asterisk -rx "rtp show settings"
   ```

### Network Mode (Windows)
Se tiver problemas com WSS no Windows, descomente no `docker-compose-wss-only.yml`:
```yaml
asterisk:
  network_mode: host  # Para Windows com problemas de WSS
```

## 🔄 Diferenças vs Configuração Anterior

| Aspecto | Antes (WS + WSS) | Agora (WSS-Only) |
|---------|------------------|------------------|
| **Portas** | 8088 (WS) + 8089 (WSS) | Apenas 8089 (WSS) |
| **Endpoints** | `agent-1001-ws` + `agent-1001-wss` | Apenas `agent-1001-wss` |
| **Fallback** | WS como fallback | Sem fallback |
| **Certificados** | Opcionais para WS | Obrigatórios para WSS |
| **Segurança** | Mista | Apenas conexões seguras |

## 📝 Notas Importantes

1. **Certificados**: WSS requer certificados TLS válidos (auto-gerados automaticamente)
2. **Browser**: Navegadores modernos preferem WSS por segurança
3. **Produção**: Use certificados válidos (Let's Encrypt, etc.) em produção
4. **Performance**: WSS pode ter overhead mínimo vs WS devido à criptografia
5. **Firewall**: Certifique-se de que a porta 8089 está acessível

## 🎯 Vantagens WSS-Only

- ✅ **Segurança**: Todas as conexões são criptografadas
- ✅ **Simplicidade**: Uma única configuração
- ✅ **Compliance**: Atende requisitos de segurança
- ✅ **Browser**: Evita warnings de conteúdo misto
- ✅ **Futuro**: Preparado para produção HTTPS

Para voltar à configuração dupla WS+WSS, use:
```bash
docker-compose -f docker-compose-wss.yml up -d
``` 