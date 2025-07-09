# 🔒 Relatório de Auditoria de Segurança - Click-to-Call

**Data da Auditoria:** $(date +%Y-%m-%d)  
**Escopo:** Análise completa de segurança, inconsistências e códigos fracos  
**Foco Especial:** Asterisk (componente crítico e sensível)

---

## 🚨 **PROBLEMAS CRÍTICOS DE SEGURANÇA**

### 1. **Credenciais Hardcoded - GRAVIDADE EXTREMA**

#### 🔴 Asterisk Manager Interface (AMI)
- **Arquivo:** `asterisk/etc/manager.conf`
- **Problema:** Senha hardcoded `secret = secret`
- **Impacto:** Acesso total ao sistema Asterisk via AMI na porta 5038
- **Exposição:** Porta 5038 exposta no Docker (permite acesso externo)

#### 🔴 PJSIP Authentication
- **Arquivos:** Múltiplos arquivos de configuração PJSIP
- **Problema:** Senha padrão `password=changeme` em TODOS os endpoints
- **Impacto:** Qualquer pessoa pode se registrar como agente SIP
- **Localização:**
  - `asterisk/etc/pjsip.conf:41`
  - `asterisk/etc/pjsip-wss.conf:22,73`
  - `asterisk/etc/pjsip-wss-only.conf:24`
  - `asterisk/etc/pjsip-unified.conf:30,105`

### 2. **Configurações de Rede Inseguras**

#### 🔴 Bind em 0.0.0.0
- **Problema:** Todos os serviços fazem bind em `0.0.0.0` 
- **Impacto:** Exposição para todas as interfaces de rede
- **Localização:**
  - Manager: `bindaddr = 0.0.0.0`
  - HTTP WSS: `bindaddr=0.0.0.0`
  - Transports PJSIP: `bind=0.0.0.0:8088/8089`

#### 🔴 Permissões AMI Excessivas
- **Problema:** Usuário `admin` tem TODAS as permissões
- **Configuração Atual:**
```
read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan,originate
write = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan,originate
```
- **Impacto:** Acesso total para modificar/controlar o sistema Asterisk

---

## 🔄 **DUPLICAÇÕES E INCONSISTÊNCIAS**

### 1. **Duplicação Completa de Código**

#### 🟡 Script PowerShell Duplicado
- **Arquivo:** `scripts/setup-wss.ps1`
- **Problema:** Todo o script está duplicado (linhas 1-188 e 189-377)
- **Impacto:** Manutenção difícil, confusão na execução

#### 🟡 Configurações PJSIP Repetidas
- **Arquivo:** `asterisk/etc/pjsip-unified.conf`
- **Problema:** Configurações de transport e endpoint duplicadas
- **Linhas duplicadas:** 1-67 repetidas em 68-151

### 2. **Inconsistências de Certificados**

#### 🟠 Paths de Certificados Conflitantes
- **Dockerfile:** Gera certificado como `asterisk.pem` (único arquivo)
- **Configurações:** Esperam arquivos separados:
  - `asterisk.crt` (certificado)
  - `asterisk.key` (chave privada)
- **Resultado:** Configuração WSS não funciona corretamente

#### 🟠 Geração de Certificados Inconsistente
- **Docker:** `openssl req -x509 -nodes -newkey rsa:2048 -keyout /etc/asterisk/keys/asterisk.pem -out /etc/asterisk/keys/asterisk.pem`
- **Script generate-dev-certs.sh:** Gera arquivos separados `.crt` e `.key`
- **Resultado:** Métodos diferentes produzem estruturas diferentes

---

## 🐛 **CÓDIGOS FRACOS E PROBLEMAS DE IMPLEMENTAÇÃO**

### 1. **Logs Excessivos em Produção**

#### 🟡 Debug Habilitado Globalmente
- **Arquivo:** `apps/web/src/components/SoftphoneAdaptive.tsx:114`
- **Código:** `JsSIP.debug.enable('JsSIP:*');`
- **Problema:** Debug ativo em produção expõe informações sensíveis

#### 🟡 Console.logs Sensíveis
- **Múltiplos arquivos** contêm 50+ console.log/error
- **Expõem:** Tokens, configurações, estados internos
- **Exemplo:** Senhas aparecendo em logs do navegador

### 2. **Autenticação e Autorização Fracas**

#### 🟠 Middleware com TODO Crítico
- **Arquivo:** `apps/api/src/middlewares/injectRdToken.middleware.ts:10`
- **Problema:** Company ID hardcoded para desenvolvimento
- **Código:**
```typescript
// TODO: Em um cenário real, pegaríamos o ID da empresa do usuário autenticado
const companyIdForDev = '41b4dc00-18d2-4995-95d1-7e9bad7ae143';
```
- **Impacto:** Qualquer usuário pode acessar dados de qualquer empresa

#### 🟠 Validação Insuficiente
- **Arquivo:** `apps/api/src/controllers/call.controller.ts:15`
- **Problema:** Validação simplificada demais
- **Código:**
```typescript
// Validação básica, pode ser aprimorada depois
if (!req.body || Object.keys(req.body).length === 0) {
```

### 3. **Gestão de Erros Inadequada**

#### 🟡 Erros Genéricos
- **Problema:** Mensagens de erro não informativas
- **Exemplo:** `Failed to fetch calls` sem detalhes
- **Impacto:** Dificulta debugging e pode mascarar problemas de segurança

#### 🟡 TODO Pendente em Funcionalidade Crítica
- **Arquivo:** `apps/api/src/controllers/call.controller.ts:46`
- **Código:** `// 3. TODO: Atualizar nosso registro com o twilio_call_sid`
- **Impacto:** Registro de chamadas incompleto

---

## 🔧 **PROBLEMAS DE CONFIGURAÇÃO**

### 1. **Inconsistências de Environment**

#### 🟠 Variáveis de Ambiente Inconsistentes
- **Web App:** Usa `NEXT_PUBLIC_*` para configurações do Asterisk
- **Problema:** Exposição de configurações sensíveis no cliente
- **Exemplo:** Senhas e hosts expostos no bundle JavaScript

### 2. **Docker e Orquestração**

#### 🟡 Volumes de Certificados Inconsistentes
- **docker-compose.yml:** `./asterisk/certs:/etc/asterisk/keys`
- **Problema:** Diretório `certs` pode não existir
- **Resultado:** Container falha ao iniciar

#### 🟡 Health Checks Inadequados
- **Asterisk:** Apenas verifica se o processo está rodando
- **Não verifica:** Se as configurações WSS estão funcionando

---

## 📋 **RECOMENDAÇÕES IMEDIATAS**

### 🔥 **AÇÃO URGENTE (Implementar HOJE)**

1. **Alterar TODAS as senhas padrão:**
   ```bash
   # Gerar senhas seguras
   openssl rand -base64 32
   ```

2. **Corrigir bind addresses:**
   ```
   bindaddr = 127.0.0.1  # ou IP específico
   ```

3. **Remover duplicações:**
   - Limpar `scripts/setup-wss.ps1`
   - Corrigir `asterisk/etc/pjsip-unified.conf`

### ⚡ **ALTA PRIORIDADE (Esta Semana)**

1. **Implementar autenticação real:**
   - Remover company ID hardcoded
   - Implementar JWT validation apropriada

2. **Corrigir certificados:**
   - Padronizar geração de certificados
   - Usar arquivos separados .crt/.key

3. **Remover logs de debug:**
   - Implementar sistema de log levels
   - Remover console.logs de produção

### 📈 **MELHORIAS GRADUAIS**

1. **Implementar rate limiting**
2. **Adicionar CORS adequado**
3. **Implementar logging estruturado**
4. **Adicionar testes de segurança automatizados**

---

## 🎯 **PRIORIZAÇÃO POR IMPACTO**

| Gravidade | Problema | Tempo Estimado | Impacto no Sistema |
|-----------|----------|----------------|-------------------|
| 🔴 CRÍTICO | Senhas hardcoded | 2h | Sistema comprometido |
| 🔴 CRÍTICO | Bind 0.0.0.0 | 1h | Exposição externa |
| 🟠 ALTO | Company ID fixo | 4h | Vazamento de dados |
| 🟡 MÉDIO | Duplicações | 2h | Manutenibilidade |
| 🟡 MÉDIO | Logs debug | 3h | Exposição de info |

---

## ✅ **CHECKLIST DE VERIFICAÇÃO**

- [ ] Todas as senhas alteradas
- [ ] Bind addresses corrigidos  
- [ ] Duplicações removidas
- [ ] Certificados padronizados
- [ ] Autenticação implementada
- [ ] Logs de debug removidos
- [ ] Testes de penetração executados
- [ ] Documentação atualizada

---

**⚠️ NOTA IMPORTANTE:** Este relatório identifica vulnerabilidades críticas que podem comprometer completamente o sistema. A implementação das correções deve ser tratada como emergência de segurança.