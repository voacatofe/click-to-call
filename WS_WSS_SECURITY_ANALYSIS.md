# 🔐 Análise de Segurança: WS vs WSS no Asterisk

## 🚨 **PROBLEMA IDENTIFICADO**

Sua configuração atual tem **CONFIGURAÇÃO MISTA INSEGURA**:

### ✅ **Correto (WSS):**
- Frontend usa `wss://` (linha 21 do SoftphoneAdaptive.tsx)
- Endpoint `agent-1001-wss` (configurado para WSS)
- Docker-compose WSS-only disponível
- Porta 8089 configurada para WSS

### ❌ **Problemático (WS):**
- Configurações de transport WS ainda existem nos arquivos PJSIP
- `pjsip-unified.conf` tem AMBOS WS e WSS (configuração dual)
- Endpoint `agent-1001-ws` ainda configurado
- Porta 8088 (WS) ainda exposta em algumas configurações

---

## 🔥 **POR QUE WS É PERIGOSO EM AMBIENTE HTTPS?**

### 1. **Mixed Content Error**
```
HTTPS site → WS connection = BLOCKED pelos navegadores
```
- **Chrome/Firefox/Safari** bloqueiam WS (inseguro) de sites HTTPS
- **Console Error**: "Mixed Content: The page at 'https://...' was loaded over HTTPS, but attempted to connect to the insecure WebSocket endpoint 'ws://...'"

### 2. **Vulnerabilidades de Segurança**
- **Dados em texto plano**: Senhas SIP, áudio, metadados
- **Man-in-the-middle**: Interceptação de chamadas
- **Eavesdropping**: Escuta de conversas comerciais
- **Session hijacking**: Roubo de sessões SIP

### 3. **Compliance e Regulamentação**
- **LGPD**: Dados pessoais não protegidos
- **SOC 2**: Falha em controles de segurança
- **ISO 27001**: Transmissão insegura de dados

---

## 📋 **CONFIGURAÇÃO ATUAL ANALISADA**

### Frontend (apps/web/src/components/):
```typescript
// ✅ SoftphoneAdaptive.tsx - CORRETO
const wsUrl = `wss://${host}:${wssPort}/ws`;  // WSS ✅

// ✅ Softphone.tsx - CORRETO  
wss://${host}:${port}/ws  // WSS ✅
```

### Asterisk (asterisk/etc/):
```ini
# ❌ PROBLEMA: Configuração mista em pjsip-unified.conf
[transport-ws]      # ← WS ainda configurado
protocol=ws         # ← INSEGURO

[transport-wss]     # ← WSS configurado  
protocol=wss        # ← SEGURO
```

### Docker:
```yaml
# ✅ docker-compose-wss-only.yml - CORRETO
ports:
  - "8089:8089"    # WSS only ✅
  # - "8088:8088"  # WS removido ✅

# ❌ docker-compose.yml - PROBLEMÁTICO
ports:
  - "127.0.0.1:8088:8088"  # WS ainda exposto ❌
  - "127.0.0.1:8089:8089"  # WSS correto ✅
```

---

## 🎯 **RECOMENDAÇÃO: WSS-ONLY CONFIGURATION**

### **Para seu ambiente (100% HTTPS):**

#### ✅ **DEVE USAR:**
- **WSS APENAS** (porta 8089)
- **Remove TODAS as configurações WS**
- **docker-compose-wss-only.yml**
- **pjsip-wss-only.conf**

#### ❌ **DEVE REMOVER:**
- Todas as configurações `transport-ws`
- Porta 8088 (WS)
- Endpoints `agent-*-ws`
- Configurações duais (unified)

---

## 🔧 **CORREÇÕES ESPECÍFICAS NECESSÁRIAS**

### 1. **Usar Docker Compose Correto**
```bash
# ❌ ATUAL (misto)
docker-compose up

# ✅ CORRETO (WSS-only)
docker-compose -f docker-compose-wss-only.yml up
```

### 2. **Limpar Configurações WS do Asterisk**
- Remover `[transport-ws]` de todos os arquivos
- Usar apenas `pjsip-wss-only.conf`
- Remover endpoints `-ws`

### 3. **Força WSS no Frontend**
```typescript
// ✅ Garantir sempre WSS
const protocol = 'wss'; // Nunca 'ws'
const wsUrl = `${protocol}://${host}:${wssPort}/ws`;
```

---

## ⚠️ **RISCOS SE NÃO CORRIGIR**

### **Técnicos:**
- Navegadores bloquearão conexões WS
- Softphone não funcionará em produção HTTPS
- Dados de chamadas em texto plano

### **Negócio:**
- Perda de chamadas importantes
- Vazamento de informações comerciais
- Multas de compliance (LGPD)

### **Operacional:**
- Sistema não funciona em produção
- Debugging complexo de "mixed content"
- Inconsistência entre ambientes

---

## 🚀 **PRÓXIMOS PASSOS IMEDIATOS**

1. **Pare configurações atuais**
2. **Use apenas docker-compose-wss-only.yml**
3. **Remova configurações WS dos arquivos PJSIP**
4. **Teste conectividade WSS**
5. **Valide certificados SSL**

**CONCLUSÃO**: Sua preocupação é 100% válida. Para ambiente HTTPS, WSS é OBRIGATÓRIO. Configuração mista é perigosa e não funcional.