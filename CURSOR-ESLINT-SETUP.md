# 🚀 **ESLint no Cursor - Setup Completo**

## ✅ **1. Verificar Extensão ESLint**

1. Abra o **Cursor**
2. Pressione `Ctrl+Shift+X` (Windows) ou `Cmd+Shift+X` (Mac)
3. Procure por **"ESLint"**
4. Instale a extensão **"ESLint" by Dirk Baeumer**

## 🔄 **2. Recarregar Cursor**

Após instalar a extensão:
```
Ctrl+Shift+P → "Developer: Reload Window"
```

## 🎯 **3. Verificar se Está Funcionando**

### **✅ Sinais de que está funcionando:**
- Linhas onduladas vermelhas/amarelas nos arquivos TypeScript
- Warnings/erros aparecendo no painel "Problems" 
- Tooltip com detalhes ao passar mouse sobre problemas

### **📁 Teste em arquivos:**
- `backend/src/index.ts` 
- `frontend/src/app/page.tsx`
- Qualquer arquivo `.ts` ou `.tsx`

## 🔧 **4. Se NÃO estiver funcionando:**

### **Opção A: Reiniciar ESLint**
```
Ctrl+Shift+P → "ESLint: Restart ESLint Server"
```

### **Opção B: Verificar Output**
```
Ctrl+Shift+P → "Output" → Selecionar "ESLint" no dropdown
```

### **Opção C: Verificar configuração**
```
Ctrl+Shift+P → "Preferences: Open Settings (JSON)"
```

Verificar se tem estas configurações:
```json
{
  "eslint.enable": true,
  "eslint.experimental.useFlatConfig": true
}
```

## 🎪 **5. Comandos Úteis no Cursor**

| Comando | Atalho | Descrição |
|---------|---------|-----------|
| ESLint: Fix all auto-fixable Problems | `Ctrl+Shift+P` | Corrige problemas automáticos |
| ESLint: Restart ESLint Server | `Ctrl+Shift+P` | Reinicia o servidor ESLint |
| Problems: Focus on Problems View | `Ctrl+Shift+M` | Mostra painel de problemas |

## 📊 **6. Como Usar no Dia a Dia**

### **🔍 Ver Problemas:**
- **Painel Problems**: `Ctrl+Shift+M`
- **Inline**: Passar mouse sobre linhas marcadas
- **Lista completa**: Ver todos os warnings/erros

### **🔧 Corrigir Problemas:**
- **Auto-fix**: `Ctrl+Shift+P` → "ESLint: Fix all"
- **Manual**: Seguir sugestões do tooltip
- **Em lote**: `npm run lint:fix` no terminal

### **⚡ Productivity Tips:**
```bash
# Terminal integrado no Cursor
npm run lint              # Ver todos os problemas
npm run lint:fix          # Corrigir automáticos  
npm run check             # Lint + Build
```

## 🚨 **Problemas Comuns e Soluções**

### **❌ "ESLint is disabled"**
```
Ctrl+Shift+P → "ESLint: Enable ESLint"
```

### **❌ "No ESLint configuration found"**
Verificar se existe `eslint.config.mjs` na raiz do projeto.

### **❌ "Failed to load config"**
```bash
npm install  # Reinstalar dependências
```

### **❌ "TypeScript errors"**
Verificar se `tsconfig.json` existe nas pastas.

## 🎯 **Status Esperado**

Quando funcionando corretamente, você deve ver:

**📊 Problemas detectados:**
- **Backend**: ~100+ warnings/erros
- **Frontend**: ~50+ warnings/erros 
- **Tipos**: Unsafe assignments, console.log, unused vars

**🎨 Visual no Cursor:**
- Linhas onduladas coloridas
- Tooltips informativos
- Painel Problems preenchido
- Auto-complete melhorado

## ✅ **Teste Final**

1. Abra `backend/src/index.ts`
2. Adicione linha: `console.log("teste");`
3. Deve aparecer warning amarelo
4. Passar mouse = tooltip "Unexpected console statement"
5. `Ctrl+Shift+M` = ver no painel Problems

---

> **🎉 Se você vê warnings/erros coloridos nos arquivos, está funcionando perfeitamente!** 