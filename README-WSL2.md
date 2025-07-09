# 🚀 Migração para WSL2 - Click-to-Call

## ⚡ Por que migrar?

Você já tem WSL2 instalado, e essa é uma **excelente oportunidade** de otimizar significativamente seu ambiente de desenvolvimento:

### Melhorias de Performance
- **Docker 70-80% mais rápido**
- **I/O de arquivos 20x mais eficiente**
- **Git operations 85% mais rápidas**
- **Hot reload muito mais responsivo**
- **Compatibilidade nativa com Asterisk**

### Ambiente Mais Estável
- **Networking simplificado** para containers
- **Debugging mais fácil** com ferramentas Linux nativas
- **Ambiente idêntico à produção**

## 🎯 Migração Rápida (15 minutos)

### Passo 1: Preparar WSL2
```powershell
# No PowerShell (como administrador, se necessário)
wsl --set-default-version 2
wsl --set-default Ubuntu-22.04

# Abrir WSL2
wsl
```

### Passo 2: Migrar o Projeto
```bash
# Dentro do WSL2
cd ~

# Opção A: Clonar novamente (recomendado)
git clone <seu-repositorio> click-to-call
cd click-to-call

# Opção B: Copiar projeto existente
# cp -r /mnt/c/Users/darla/OneDrive/Documentos/click-to-call ~/click-to-call
# cd ~/click-to-call
```

### Passo 3: Executar Script Automático
```bash
# Execute o script de migração automática
./scripts/migrate-to-wsl2.sh
```

O script irá:
- ✅ Verificar e instalar todas as ferramentas necessárias
- ✅ Configurar Node.js via NVM
- ✅ Verificar integração Docker
- ✅ Configurar scripts bash otimizados
- ✅ Instalar ferramentas úteis
- ✅ Otimizar configurações Git
- ✅ Criar aliases práticos

### Passo 4: Configurar Cursor para WSL2
```bash
# Abrir projeto no Cursor a partir do WSL2
cursor .
```

Ou via Cursor:
- `Ctrl+Shift+P` → "Remote-WSL: New WSL Window"
- Abrir pasta: `~/click-to-call`

## 📊 Scripts Otimizados

### Desenvolvimento
```bash
# Iniciar ambiente
./scripts/dev.sh start

# Ver status
./scripts/dev.sh status

# Ver logs
./scripts/dev.sh logs

# Parar ambiente
./scripts/dev.sh stop

# Limpar ambiente
./scripts/dev.sh clean
```

### WebSocket/WSS
```bash
# Modo desenvolvimento (WS)
./scripts/setup-wss.sh ws

# Modo produção (WSS)
./scripts/setup-wss.sh wss

# Testar conectividade
./scripts/setup-wss.sh test
```

### Aliases Práticos (configurados automaticamente)
```bash
cstart    # ./scripts/dev.sh start
cstop     # ./scripts/dev.sh stop
cstatus   # ./scripts/dev.sh status
clogs     # ./scripts/dev.sh logs
cclean    # ./scripts/dev.sh clean
ctest     # ./scripts/setup-wss.sh test
```

## 🔧 Configuração Docker Desktop

1. **Settings** → **General** → ✅ "Use the WSL 2 based engine"
2. **Resources** → **WSL Integration** → ✅ "Enable integration with my default WSL distro"
3. ✅ Ativar para "Ubuntu-22.04"
4. **Apply & Restart**

## 📝 Próximos Passos

1. **Configure credenciais** nos arquivos `.env`
2. **Teste o ambiente**: `./scripts/dev.sh start`
3. **Configure Cursor** para usar terminal WSL2
4. **Desfrute da performance melhorada!**

## 🐛 Solução de Problemas

### Docker não encontrado
```bash
# Verificar Docker
docker --version

# Se não funcionar, reconfigurar Docker Desktop para WSL2
```

### Scripts não executáveis
```bash
chmod +x scripts/*.sh
```

### Dependências Node.js
```bash
# Reinstalar via script
./scripts/dev.sh install
```

## 📖 Documentação Completa

Para detalhes completos, consulte: [`docs/WSL2-MIGRATION-GUIDE.md`](docs/WSL2-MIGRATION-GUIDE.md)

## 🎉 Resultado Esperado

Após a migração:
- ⚡ **Docker muito mais rápido**
- 🔄 **Hot reload instantâneo**
- 🐛 **Debugging mais eficiente**
- 🛠️ **Ferramentas Linux nativas**
- 📊 **Monitoring com htop, docker stats**
- 🎯 **Ambiente consistente com produção**

---

**💡 Dica**: Mantenha o desenvolvimento consistentemente no WSL2. Evite misturar Windows e WSL2 para máxima performance. 