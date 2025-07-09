# 🚀 Roadmap para Produção - Click-to-Call

Este documento descreve as mudanças necessárias para levar o projeto de desenvolvimento para produção.

## 🧪 **Estado Atual (Desenvolvimento)**

O projeto está configurado para **testes rápidos** com alguns hardcodes e fallbacks que facilitam o desenvolvimento.

## 📋 **Checklist de Produção**

### 🔐 **1. Autenticação JWT (CRÍTICO)**

**Arquivo:** `apps/api/src/middlewares/injectRdToken.middleware.ts`

**Estado atual:**
```typescript
// ⚠️ FALLBACK para desenvolvimento
companyId = '41b4dc00-18d2-4995-95d1-7e9bad7ae143';
```

**Produção - Opções:**

#### **Opção A: JWT Completo**
```typescript
import jwt from 'jsonwebtoken';

const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
companyId = decoded.companyId;
```

#### **Opção B: Supabase Auth + Metadata**
```typescript
const { data: { user } } = await supabase.auth.getUser(token);
companyId = user.user_metadata?.company_id;
```

#### **Opção C: Tabela de Usuários**
```sql
-- Criar tabela users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

```typescript
const { data: userData } = await supabase
  .from('users')
  .select('company_id')
  .eq('id', user.id)
  .single();
companyId = userData.company_id;
```

### 🏢 **2. Gerenciamento Multi-Empresa**

**APIs já implementadas:**
- ✅ `GET /api/companies` - Listar empresas
- ✅ `POST /api/companies` - Criar empresa
- ✅ `GET /api/companies/:id` - Ver empresa
- ✅ `PATCH /api/companies/:id` - Atualizar empresa
- ✅ `DELETE /api/companies/:id` - Deletar empresa

**TODO Produção:**
- [ ] Interface admin para gerenciar empresas
- [ ] Associar usuários às empresas no cadastro
- [ ] Validação de permissões por empresa

### 🔑 **3. Tokens RD Station**

**Estado atual:** ✅ Implementado via API

**API disponível:**
- ✅ `POST /api/rdcrm/token/:companyId` - Salvar token
- ✅ `GET /api/rdcrm/contacts` - Listar contatos (usa token da empresa)

**TODO Produção:**
- [ ] Interface para empresas gerenciarem seus tokens
- [ ] Validação/teste automático de tokens
- [ ] Rotação automática de tokens (se RD Station suportar)

### 🔒 **4. Segurança**

**Variáveis de ambiente:**
```bash
# Produção - valores reais
JWT_SECRET=chave_super_secreta_256_bits_aqui
ENCRYPTION_SECRET=outra_chave_super_secreta_aqui
NODE_ENV=production

# Database - usar connection string de produção
DATABASE_URL=postgresql://...produção...
```

**Headers de segurança:**
- [ ] Implementar CORS restritivo
- [ ] Rate limiting por empresa
- [ ] Logs de auditoria

### 🌐 **5. URLs e Domínios**

**Estado atual:** localhost

**TODO Produção:**
```bash
# Frontend
NEXT_PUBLIC_API_URL=https://api.catofecall.com

# RD Station
RD_STATION_REDIRECT_URI=https://api.catofecall.com/api/rdcrm/callback

# Asterisk
NEXT_PUBLIC_ASTERISK_HOST=call.catofecall.com
EXTERNAL_IP=IP_PUBLICO_DO_SERVIDOR
```

### 📊 **6. Monitoramento**

**TODO Produção:**
- [ ] Logs estruturados (Winston/Pino)
- [ ] Métricas de performance
- [ ] Health checks avançados
- [ ] Alertas de erro

### 🏗️ **7. Infraestrutura**

**TODO Produção:**
- [ ] Docker Compose para produção
- [ ] HTTPS com certificados válidos
- [ ] Backup automático do banco
- [ ] CI/CD pipeline

## 🎯 **Plano de Migração**

### **Fase 1: Teste Completo (Atual)**
- [x] Usar ID hardcoded para teste
- [x] Configurar RD Station token
- [ ] Testar todas as funcionalidades

### **Fase 2: Auth Básico**
- [ ] Implementar JWT básico
- [ ] Criar sistema de login simples
- [ ] Associar usuários a empresas

### **Fase 3: Multi-empresa**
- [ ] Interface de gerenciamento
- [ ] Isolamento completo por empresa
- [ ] Permissões granulares

### **Fase 4: Produção**
- [ ] Deploy com domínio próprio
- [ ] Monitoramento completo
- [ ] Backup e segurança

## 📞 **Especificamente para RD Station**

### **Desenvolvimento:**
```bash
# Qualquer callback URL (não é usada)
RD_STATION_REDIRECT_URI=http://localhost:3001/dummy
```

### **Produção:**
```bash
# URL real caso implementem OAuth futuro
RD_STATION_REDIRECT_URI=https://api.catofecall.com/api/rdcrm/callback
```

## 🚨 **Avisos Importantes**

1. **Nunca commitar** tokens/senhas reais
2. **Remover hardcodes** antes do deploy de produção
3. **Testar autenticação** em ambiente de staging primeiro
4. **Backup do banco** antes de mudanças de schema

---

**📝 Última atualização:** Janeiro 2025  
**🎯 Próxima revisão:** Após testes completos 