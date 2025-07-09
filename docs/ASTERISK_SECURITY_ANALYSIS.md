# ANÁLISE DE SEGURANÇA ASTERISK - Inconsistências Críticas Identificadas

## SUMÁRIO EXECUTIVO

Durante a auditoria detalhada das configurações do Asterisk comparadas à documentação oficial, foram identificadas **inconsistências críticas e vulnerabilidades específicas** que comprometem a segurança do sistema VoIP. Esta análise foca especificamente nos componentes do Asterisk que requerem atenção imediata.

---

## ⚠️ INCONSISTÊNCIAS CRÍTICAS IDENTIFICADAS

### 1. CONFIGURAÇÃO PJSIP - PROBLEMAS GRAVES

#### 1.1. Configuração de Endpoint WebRTC Incompleta
**PROBLEMA:** Suas configurações PJSIP não seguem as melhores práticas da documentação oficial.

**CONFIGURAÇÃO ATUAL (PROBLEMÁTICA):**
```ini
[agent-1001-wss]
type=endpoint
webrtc=yes
use_avpf=yes
media_encryption=dtls
dtls_verify=fingerprint
dtls_setup=actpass
dtls_auto_generate_cert=yes
```

**CONFIGURAÇÃO RECOMENDADA PELA DOCUMENTAÇÃO:**
```ini
[agent-1001-wss]
type=endpoint
webrtc=yes
use_avpf=yes
media_encryption=dtls
dtls_verify=fingerprint
dtls_setup=actpass
dtls_cert_file=/etc/asterisk/keys/asterisk.crt
dtls_private_key=/etc/asterisk/keys/asterisk.key
dtls_ca_file=/etc/asterisk/keys/asterisk.crt
; NUNCA usar dtls_auto_generate_cert=yes em produção
ice_support=yes
```

**IMPACTO CRÍTICO:**
- `dtls_auto_generate_cert=yes` gera certificados auto-assinados fracos
- Ausência de `ice_support=yes` compromete conectividade NAT
- Falta de verificação adequada de certificados DTLS

#### 1.2. Configuração de Transport Insegura
**PROBLEMA:** Transport WSS mal configurado.

**CONFIGURAÇÃO ATUAL:**
```ini
[transport-wss]
type=transport
protocol=wss
bind=127.0.0.1:8089
external_media_address=localhost
external_signaling_address=localhost
```

**PROBLEMA IDENTIFICADO:**
- `external_*_address=localhost` é inválido para produção
- Falta configuração de cipher adequada
- Ausência de `method=tlsv1_2` mínimo

**CONFIGURAÇÃO CORRETA:**
```ini
[transport-wss]
type=transport
protocol=wss
bind=127.0.0.1:8089
cert_file=/etc/asterisk/keys/asterisk.crt
priv_key_file=/etc/asterisk/keys/asterisk.key
method=tlsv1_2
cipher=ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256
external_media_address=SEU_IP_PUBLICO
external_signaling_address=SEU_IP_PUBLICO
```

### 2. CONFIGURAÇÃO HTTP - VULNERABILIDADES CRÍTICAS

#### 2.1. Configuração HTTP Perigosa
**CONFIGURAÇÃO ATUAL:**
```ini
[general]
enabled=yes
bindaddr=127.0.0.1
bindport=8088
tlsenable=yes
tlsbindaddr=127.0.0.1:8089
```

**PROBLEMAS IDENTIFICADOS:**
1. **HTTP habilitado desnecessariamente** (porta 8088) - só WSS deveria estar ativo
2. **Falta configuração de cipher** para TLS
3. **Ausência de configurações de segurança obrigatórias**

**CONFIGURAÇÃO CORRETA SEGUNDO DOCUMENTAÇÃO:**
```ini
[general]
enabled=yes
bindaddr=127.0.0.1
bindport=8088
; Desabilitar HTTP se só usar WSS
tlsenable=yes
tlsbindaddr=127.0.0.1:8089
tlscertfile=/etc/asterisk/keys/asterisk.crt
tlsprivatekey=/etc/asterisk/keys/asterisk.key
; Configurações de segurança obrigatórias
enablestatic=no
redirect=URI_VALIDATION
prefix=/asterisk
sessionlimit=100
```

### 3. RTP - CONFIGURAÇÃO INSEGURA

#### 3.1. Range de Portas Muito Restrito
**CONFIGURAÇÃO ATUAL:**
```ini
[general]
rtpstart=5000
rtpend=5100
```

**PROBLEMA:** Range de apenas 100 portas é insuficiente e pode causar falhas de chamada (problema conhecido do Asterisk).

**SEGUNDO DOCUMENTAÇÃO OFICIAL:**
- Mínimo recomendado: 1000 portas
- Para produção: 5000+ portas

**CONFIGURAÇÃO CORRETA:**
```ini
[general]
rtpstart=10000
rtpend=20000
icesupport=yes
stunaddr=stun:stun.l.google.com:19302
; Configurações de segurança adicionais
strictrtp=yes
rtpchecksums=yes
```

### 4. MANAGER (AMI) - PROBLEMA DE SEGURANÇA GRAVE

#### 4.1. Permissões AMI Ainda Perigosas
Embora você tenha removido algumas permissões, ainda há problemas:

**CONFIGURAÇÃO ATUAL:**
```ini
read = system,call,log,verbose,command,dtmf,reporting,cdr
write = system,call,log,verbose,command,dtmf,reporting,cdr
```

**PROBLEMA:** `command` permite execução de comandos shell no Asterisk.

**CONFIGURAÇÃO SEGURA:**
```ini
read = system,call,log,verbose,dtmf,reporting,cdr
write = system,call,log,verbose,dtmf,reporting,cdr
; NUNCA incluir 'command' em produção
```

---

## 🔍 VULNERABILIDADES ESPECÍFICAS ASTERISK ENCONTRADAS

### 1. Vulnerabilidade DTLS ClientHello DoS
**Referência:** CVE mencionada em nossa busca de segurança
**IMPACTO:** Denial of Service em chamadas WebRTC
**SOLUÇÃO:** Configuração adequada de timeout DTLS

```ini
[agent-1001-wss]
; Adicionar proteção contra DoS DTLS
dtls_rekey=300
dtls_setup=actpass
; Nunca usar 'active' em produção
```

### 2. Problema de Binding RTCP (Documentado)
**Referência:** Artigo técnico sobre design flaw no Asterisk
**SINTOMA:** Falhas aleatórias com "488 Not Acceptable Here"
**CAUSA:** Asterisk não tenta re-bind RTCP adequadamente

**MITIGAÇÃO nas configurações:**
```ini
[general]
; No rtp.conf - aumentar range significativamente
rtpstart=10000
rtpend=30000
; Habilitar reuso de portas
rtpreuseenable=yes
```

### 3. Vulnerabilidade em Certificate Handling
**PROBLEMA:** Uso de `dtls_auto_generate_cert=yes`
**IMPACTO:** Certificados fracos gerados automaticamente
**CORREÇÃO OBRIGATÓRIA:**
```ini
; REMOVER esta linha:
; dtls_auto_generate_cert=yes

; ADICIONAR:
dtls_cert_file=/etc/asterisk/keys/asterisk.crt
dtls_private_key=/etc/asterisk/keys/asterisk.key
dtls_ca_file=/etc/asterisk/keys/asterisk.crt
dtls_verify=fingerprint
```

---

## 🛡️ CORREÇÕES IMEDIATAS NECESSÁRIAS

### 1. Arquivo pjsip-unified.conf (CRÍTICO)
```ini
;============================ TRANSPORTE WSS SEGURO ============================
[transport-wss]
type=transport
protocol=wss
bind=127.0.0.1:8089
cert_file=/etc/asterisk/keys/asterisk.crt
priv_key_file=/etc/asterisk/keys/asterisk.key
method=tlsv1_2
cipher=ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256
; CORRIGIR: external addresses devem ser IPs válidos
external_media_address=SEU_IP_REAL
external_signaling_address=SEU_IP_REAL

;============================ ENDPOINT WSS SEGURO ============================
[agent-1001-wss]
type=endpoint
aors=agent-1001
auth=agent-1001
transport=transport-wss
context=from-internal
; Configuração WebRTC correta segundo documentação
webrtc=yes
use_avpf=yes
media_encryption=dtls
dtls_verify=fingerprint
dtls_setup=actpass
; CRÍTICO: Usar certificados reais, não auto-gerados
dtls_cert_file=/etc/asterisk/keys/asterisk.crt
dtls_private_key=/etc/asterisk/keys/asterisk.key
dtls_ca_file=/etc/asterisk/keys/asterisk.crt
; ADICIONAR: suporte ICE obrigatório
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes
disallow=all
allow=opus,ulaw,alaw
rtp_symmetric=yes
force_rport=yes
direct_media=no
timers=yes
timers_min_se=90
timers_sess_expires=1800
; ADICIONAR: proteção contra DoS
dtls_rekey=300
```

### 2. Arquivo rtp.conf (CRÍTICO)
```ini
[general]
; CORRIGIR: Range muito pequeno causa falhas
rtpstart=10000
rtpend=30000
icesupport=yes
stunaddr=stun:stun.l.google.com:19302
; ADICIONAR: configurações de segurança
strictrtp=yes
rtpchecksums=yes
rtpreuseenable=yes
```

### 3. Arquivo http-wss.conf (MELHORAR)
```ini
[general]
enabled=yes
bindaddr=127.0.0.1
bindport=8088
; ADICIONAR: configurações de segurança
enablestatic=no
sessionlimit=100
; TLS obrigatório
tlsenable=yes
tlsbindaddr=127.0.0.1:8089
tlscertfile=/etc/asterisk/keys/asterisk.crt
tlsprivatekey=/etc/asterisk/keys/asterisk.key
; ADICIONAR: cipher adequado
tlscipher=ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256
```

### 4. Arquivo manager.conf (CRÍTICO)
```ini
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1
displayconnects = no
; ADICIONAR: configurações de segurança
httptimeout = 60
authtimeout = 30
authlimit = 50

[admin]
secret = ${AMI_SECRET:-changeme_update_this}
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.255
permit=172.16.0.0/255.240.0.0
; CORRIGIR: remover 'command' por segurança
read = system,call,log,verbose,dtmf,reporting,cdr
write = system,call,log,verbose,dtmf,reporting,cdr
```

---

## 📋 CHECKLIST DE SEGURANÇA ASTERISK

### ✅ Implementado Corretamente:
- [x] Binding apenas em localhost (127.0.0.1)
- [x] Uso de variáveis de ambiente para senhas
- [x] WSS-only (sem WS inseguro)
- [x] Certificados SSL/TLS configurados

### ❌ Precisa Correção Imediata:
- [ ] Corrigir range de portas RTP (muito pequeno)
- [ ] Remover `dtls_auto_generate_cert=yes`
- [ ] Adicionar `ice_support=yes`
- [ ] Corrigir external_*_address
- [ ] Remover permissão 'command' do AMI
- [ ] Adicionar cipher específico para TLS
- [ ] Implementar configurações anti-DoS

### ⚠️ Monitoramento Necessário:
- [ ] Logs de falhas "488 Not Acceptable Here"
- [ ] Tentativas de certificado DTLS inválido
- [ ] Exhaustion de portas RTP
- [ ] Conexões AMI não autorizadas

---

## 🎯 RECOMENDAÇÕES FINAIS

1. **IMEDIATO:** Corrigir configurações PJSIP conforme documentação oficial
2. **CRÍTICO:** Expandir range RTP para evitar falhas conhecidas do Asterisk
3. **SEGURANÇA:** Remover auto-geração de certificados DTLS
4. **MONITORAMENTO:** Implementar alertas para problemas específicos do Asterisk

O Asterisk é um sistema complexo com várias pegadinhas de segurança. Suas configurações atuais estão no caminho certo, mas essas inconsistências com a documentação oficial podem comprometer a estabilidade e segurança do sistema.