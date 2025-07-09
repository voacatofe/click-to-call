# 🚨 Correções Urgentes de Segurança - Exemplos de Código

Este arquivo contém as correções específicas para os problemas mais críticos identificados na auditoria.

---

## 🔥 **CORREÇÕES IMEDIATAS**

### 1. **Corrigir Senhas Hardcoded**

#### ✅ **manager.conf - ANTES vs DEPOIS**

**❌ ANTES (INSEGURO):**
```ini
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[admin]
secret = secret
```

**✅ DEPOIS (SEGURO):**
```ini
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1  # Apenas localhost

[admin]
secret = $(openssl rand -base64 32)  # Gerar senha única
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.255  # Apenas localhost
read = system,call,log,verbose,command,dtmf,reporting,cdr
write = system,call,log,verbose,command,dtmf,reporting,cdr
; Removidas permissões perigosas: agent,user,config,dialplan,originate
```

#### ✅ **PJSIP Configurations - Exemplo de Correção**

**❌ ANTES (INSEGURO):**
```ini
[agent-1001]
type=auth
auth_type=userpass
username=agent-1001
password=changeme  # VULNERABILIDADE CRÍTICA
```

**✅ DEPOIS (SEGURO):**
```ini
[agent-1001]
type=auth
auth_type=userpass
username=agent-1001
password=${AGENT_1001_PASSWORD}  # Variável de ambiente
realm=clicktocall.local
```

### 2. **Corrigir Dockerfile do Asterisk**

#### ✅ **Certificados Corretos**

**❌ ANTES (INCORRETO):**
```dockerfile
RUN openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout /etc/asterisk/keys/asterisk.pem \
    -out /etc/asterisk/keys/asterisk.pem \  # ERRO: mesmo arquivo!
    -days 3650 -subj "/CN=clicktocall.local"
```

**✅ DEPOIS (CORRETO):**
```dockerfile
RUN mkdir -p /etc/asterisk/keys && \
    openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout /etc/asterisk/keys/asterisk.key \
    -out /etc/asterisk/keys/asterisk.crt \
    -days 365 \
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=ClickToCall/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" && \
    chmod 600 /etc/asterisk/keys/asterisk.key && \
    chmod 644 /etc/asterisk/keys/asterisk.crt && \
    chown asterisk:asterisk /etc/asterisk/keys/*
```

### 3. **Remover Duplicações**

#### ✅ **Limpar pjsip-unified.conf**

**Comando para identificar duplicações:**
```bash
# Verificar duplicações no arquivo
awk 'seen[$0]++' asterisk/etc/pjsip-unified.conf
```

**Ação necessária:** Remover as linhas 68-151 que são cópias exatas das linhas 1-67.

#### ✅ **Corrigir setup-wss.ps1**

**Comando para remover duplicação:**
```bash
# Manter apenas a primeira metade (linhas 1-188)
head -n 188 scripts/setup-wss.ps1 > scripts/setup-wss-fixed.ps1
mv scripts/setup-wss-fixed.ps1 scripts/setup-wss.ps1
```

### 4. **Corrigir Middleware de Autenticação**

#### ✅ **injectRdToken.middleware.ts**

**❌ ANTES (INSEGURO):**
```typescript
// TODO: Em um cenário real, pegaríamos o ID da empresa do usuário autenticado
const companyIdForDev = '41b4dc00-18d2-4995-95d1-7e9bad7ae143';
```

**✅ DEPOIS (SEGURO):**
```typescript
export const injectRdTokenMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // Extrair company ID do token JWT autenticado
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ message: 'Authorization token required.' });
    return;
  }

  try {
    // Validar JWT e extrair companyId
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const companyId = decoded.companyId;
    
    if (!companyId) {
      res.status(401).json({ message: 'Invalid token: missing company ID.' });
      return;
    }

    const { data, error } = await supabase
      .from('companies')
      .select('rd_station_token')
      .eq('id', companyId)
      .single();

    if (error || !data || !data.rd_station_token) {
      throw new Error('Company RD Station token not found.');
    }

    req.rdApiToken = data.rd_station_token;
    next();
  } catch (error: any) {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
};
```

### 5. **Remover Logs de Debug**

#### ✅ **SoftphoneAdaptive.tsx**

**❌ ANTES (INSEGURO):**
```typescript
console.log('[DEBUG] Iniciando Softphone WSS-Only...');
JsSIP.debug.enable('JsSIP:*');  // PERIGO: Debug global habilitado
```

**✅ DEPOIS (SEGURO):**
```typescript
// Sistema de log baseado em environment
const isDev = process.env.NODE_ENV === 'development';
const logger = {
  debug: isDev ? console.log : () => {},
  info: console.info,
  error: console.error
};

// Usar logger ao invés de console.log direto
logger.debug('[DEBUG] Iniciando Softphone WSS-Only...');

if (isDev) {
  JsSIP.debug.enable('JsSIP:*');
}
```

---

## 🔧 **DOCKER COMPOSE SEGURO**

### ✅ **docker-compose.yml Corrigido**

**❌ ANTES (INSEGURO):**
```yaml
asterisk:
  ports:
    - "5038:5038"      # AMI exposto publicamente
    - "8088:8088"      # WS exposto
    - "8089:8089"      # WSS exposto
```

**✅ DEPOIS (SEGURO):**
```yaml
asterisk:
  ports:
    - "127.0.0.1:5038:5038"      # AMI apenas localhost
    - "127.0.0.1:8088:8088"      # WS apenas localhost
    - "127.0.0.1:8089:8089"      # WSS apenas localhost
  environment:
    - AGENT_1001_PASSWORD=${AGENT_1001_PASSWORD}
    - AMI_SECRET=${AMI_SECRET}
```

---

## 🛡️ **VARIABLES DE AMBIENTE**

### ✅ **Arquivo .env.example**

```bash
# Senhas geradas com: openssl rand -base64 32
AMI_SECRET=YourStrongAMISecretHere123456789
AGENT_1001_PASSWORD=YourStrongAgentPasswordHere123456789
JWT_SECRET=YourJWTSecretKeyHere123456789

# Asterisk Configuration
ASTERISK_HOST=localhost
ASTERISK_WS_PORT=8088
ASTERISK_WSS_PORT=8089

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# RD Station
RD_STATION_CLIENT_ID=your_rd_client_id
RD_STATION_CLIENT_SECRET=your_rd_client_secret
```

---

## 🚀 **SCRIPT DE APLICAÇÃO RÁPIDA**

### ✅ **apply-security-fixes.sh**

```bash
#!/bin/bash
echo "🔒 Aplicando correções de segurança urgentes..."

# 1. Gerar senhas seguras
echo "📝 Gerando senhas seguras..."
AMI_SECRET=$(openssl rand -base64 32)
AGENT_PASSWORD=$(openssl rand -base64 32)

# 2. Criar arquivo de environment
cat > .env.security << EOF
AMI_SECRET=${AMI_SECRET}
AGENT_1001_PASSWORD=${AGENT_PASSWORD}
EOF

# 3. Corrigir manager.conf
echo "🔧 Corrigindo manager.conf..."
sed -i 's/secret = secret/secret = '${AMI_SECRET}'/' asterisk/etc/manager.conf
sed -i 's/bindaddr = 0.0.0.0/bindaddr = 127.0.0.1/' asterisk/etc/manager.conf

# 4. Corrigir senhas PJSIP
echo "🔧 Corrigindo senhas PJSIP..."
find asterisk/etc/ -name "pjsip*.conf" -exec sed -i 's/password=changeme/password='${AGENT_PASSWORD}'/' {} \;

# 5. Remover duplicações
echo "🧹 Removendo duplicações..."
head -n 67 asterisk/etc/pjsip-unified.conf > temp_file
mv temp_file asterisk/etc/pjsip-unified.conf

head -n 188 scripts/setup-wss.ps1 > temp_file
mv temp_file scripts/setup-wss.ps1

echo "✅ Correções aplicadas com sucesso!"
echo "📄 Senhas salvas em .env.security"
echo "⚠️  Lembre-se de adicionar .env.security ao .gitignore"
```

---

## ⚡ **VERIFICAÇÃO RÁPIDA**

### ✅ **Comando para verificar se correções foram aplicadas**

```bash
#!/bin/bash
echo "🔍 Verificando correções de segurança..."

# Verificar se senhas padrão ainda existem
if grep -r "changeme\|secret = secret" asterisk/etc/; then
    echo "❌ FALHA: Senhas padrão ainda encontradas!"
else
    echo "✅ Senhas padrão removidas"
fi

# Verificar bind addresses
if grep -r "bindaddr = 0.0.0.0" asterisk/etc/; then
    echo "❌ FALHA: Bind 0.0.0.0 ainda presente!"
else
    echo "✅ Bind addresses corrigidos"
fi

# Verificar duplicações
if [ $(wc -l < asterisk/etc/pjsip-unified.conf) -gt 70 ]; then
    echo "❌ FALHA: Possível duplicação em pjsip-unified.conf"
else
    echo "✅ Duplicações removidas"
fi

echo "🔍 Verificação concluída"
```

---

**⚠️ IMPORTANTE:** Execute essas correções em ambiente de desenvolvimento primeiro, teste completamente, e depois aplique em produção durante janela de manutenção.