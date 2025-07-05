# 🤖 **Comandos Rápidos para IA - Click-to-Call**

## 🚀 **Setup Inicial (Uma vez só)**

```bash
npm run setup                    # ✅ Instala TUDO (raiz + backend + frontend)
```

## ⚡ **ESLint no Cursor (NOVO!)**

### **🎯 Setup ESLint Visual**
1. Instalar extensão **"ESLint"** no Cursor
2. `Ctrl+Shift+P` → **"Developer: Reload Window"**
3. Abrir qualquer arquivo `.ts` ou `.tsx`
4. **Deve aparecer linhas coloridas com warnings/erros!**

### **📋 Comandos ESLint no Cursor**
```
Ctrl+Shift+M              # 🔍 Painel Problems (ver todos os erros)
Ctrl+Shift+P → ESLint     # 🔧 Fix all auto-fixable problems  
Mouse hover               # 💡 Tooltip com detalhes do erro
```

### **🔄 Se não funcionar:**
```
Ctrl+Shift+P → "ESLint: Restart ESLint Server"
```

---

## ⚡ **Comandos Diários com IA**

### **🎯 Desenvolvimento Rápido**
```bash
# Opção 1: Backend e Frontend juntos (RECOMENDADO)
npm run dev:both                 # 🔥 Inicia AMBOS simultaneamente

# Opção 2: Separado (em terminais diferentes)
npm run dev:backend              # Terminal 1
npm run dev:frontend             # Terminal 2
```

### **🔍 Verificar Qualidade do Código**
```bash
npm run check                    # ✅ Lint + Build (tudo em um comando)
npm run lint                     # 🔍 Apenas ESLint
npm run lint:fix                 # 🔧 Corrige problemas automáticos
```

### **🔄 Reset Completo (Quando algo quebra)**
```bash
npm run reset                    # 🔄 Limpa tudo + reinstala + lint
```

### **🐳 Docker/Deploy**
```bash
npm run docker:dev              # 🐳 Build + Run com Docker
npm run docker:build            # 🏗️ Apenas build
npm run docker:up               # 🚀 Apenas run
```

---

## 📋 **Lista Completa de Comandos**

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `npm run setup` | Instala tudo pela primeira vez | ✅ Setup inicial |
| `npm run dev:both` | Backend + Frontend juntos | 🔥 Desenvolvimento diário |
| `npm run check` | Lint + Build completo | ✅ Antes de commit |
| `npm run reset` | Limpa e reinstala tudo | 🔄 Quando algo quebra |
| `npm run docker:dev` | Build e run com Docker | 🐳 Deploy local |
| `Ctrl+Shift+M` | Painel Problems ESLint | 🔍 Ver erros no Cursor |

---

## 🤖 **Comandos Para Copiar/Colar na IA**

### **Setup do Projeto**
```bash
npm run setup
```

### **Iniciar Desenvolvimento** 
```bash
npm run dev:both
```

### **Verificar Código**
```bash
npm run check
```

### **Reset Completo**
```bash
npm run reset
```

### **Deploy Docker**
```bash
npm run docker:dev
```

---

## 🎯 **Comandos por Situação**

### **🆕 Primeira vez no projeto**
```bash
git clone [repo]
cd click-to-call
npm run setup          # Instala tudo
npm run dev:both        # Inicia desenvolvimento
```

**+ No Cursor:** Instalar extensão ESLint + `Ctrl+Shift+P` → Reload Window

### **💻 Desenvolvimento diário**
```bash
npm run dev:both        # Um comando, tudo funcionando
```

**+ No Cursor:** `Ctrl+Shift+M` para ver problemas ESLint

### **🔧 Algo quebrou/problemas**
```bash
npm run reset           # Reset completo
npm run dev:both        # Volta ao desenvolvimento
```

**+ No Cursor:** `Ctrl+Shift+P` → "ESLint: Restart ESLint Server"

### **✅ Antes de fazer commit**
```bash
npm run check           # Verifica se está tudo ok
```

**+ No Cursor:** `Ctrl+Shift+M` → corrigir warnings críticos

### **🚀 Deploy/Produção**
```bash
npm run docker:dev      # Testa local com Docker
# Se tudo ok, faz deploy no EasyPanel
```

---

## 🎪 **Dicas Especiais para IA**

### **📝 Sempre use estes comandos:**
- **Setup**: `npm run setup`
- **Dev**: `npm run dev:both` 
- **Check**: `npm run check`
- **Reset**: `npm run reset`
- **ESLint Visual**: `Ctrl+Shift+M` no Cursor

### **❌ Evite comandos manuais:**
- ~~`cd backend && npm install`~~
- ~~`cd frontend && npm install`~~ 
- ~~`npm install` (só da raiz)~~

### **🎯 Fluxo Ideal:**
1. `npm run setup` (primeira vez)
2. Instalar extensão ESLint no Cursor
3. `npm run dev:both` (desenvolvimento)
4. `Ctrl+Shift+M` (ver problemas no Cursor)
5. `npm run check` (antes de commit)
6. `npm run docker:dev` (deploy)

---

> **💡 Agora você tem ESLint visual direto no Cursor + comandos automatizados! Nunca mais navegar entre pastas manualmente!** 