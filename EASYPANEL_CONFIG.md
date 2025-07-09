# Configuração do Easypanel para Click-to-Call

Este arquivo contém todas as variáveis de ambiente necessárias para o deploy no Easypanel.

## ⚠️ Variáveis de Ambiente Obrigatórias

### 🔐 Segurança Asterisk
```
AMI_SECRET=K8mN2pQ9rS5tV7wX3yZ6aB1cD4eF8gH
AGENT_1001_PASSWORD=L9nP3qR8sT6uW4xY7zB2aD5eG1hJ9k
EXTERNAL_IP=SEU_IP_PUBLICO_AQUI
```

### 🗄️ Supabase
```
SUPABASE_URL=https://vosmwoctehquugfynqav.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc213b2N0ZWhxdXVnZnlucWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MTQ2NzMsImV4cCI6MjA1NjQ5MDY3M30.AInGFUDs9ch2seo0Kto0LomzL1OMPjpyr0aoSNpLhbI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc213b2N0ZWhxdXVnZnlucWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkxNDY3MywiZXhwIjoyMDU2NDkwNjczfQ.H3e7zPhJs53wGUcZvcqTY8fiBC9kSlP-DusyGzKEYSA
DATABASE_URL=postgresql://postgres:efDj9M5BiNKoXF6u@db.vosmwoctehquugfynqav.supabase.co:5432/postgres?sslmode=require
```

### 🏢 RD Station CRM
```
RD_STATION_CLIENT_ID=aa29d4bf-3267-4361-a1a6-90beaa0ec322
RD_STATION_CLIENT_SECRET=b9d6929d9bbc42ea959eb78713cca9e3
RD_STATION_REDIRECT_URI=https://SEU_DOMINIO.com/api/rdcrm/callback
```

### 🌐 Frontend (Next.js)
```
NEXT_PUBLIC_API_URL=https://SEU_DOMINIO.com
NEXT_PUBLIC_ASTERISK_HOST=SEU_DOMINIO.com
NEXT_PUBLIC_ASTERISK_WSS_PORT=8089
NEXT_PUBLIC_AGENT_PASSWORD=L9nP3qR8sT6uW4xY7zB2aD5eG1hJ9k
NEXT_PUBLIC_FORCE_PROTOCOL=wss
NEXT_PUBLIC_AGENT_ID=agent-1001-wss
NEXT_PUBLIC_ASTERISK_REALM=clicktocall.local
NEXT_PUBLIC_SUPABASE_URL=https://vosmwoctehquugfynqav.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc213b2N0ZWhxdXVnZnlucWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MTQ2NzMsImV4cCI6MjA1NjQ5MDY3M30.AInGFUDs9ch2seo0Kto0LomzL1OMPjpyr0aoSNpLhbI
```

### 🔒 Segurança Geral
```
JWT_SECRET=64a97de5b7422c06c9116bb96b076e3a396c3c92b27e87d5005dc345dc4aa2c9
CORS_ORIGIN=*
```

## 🔧 Configurações Específicas do Easypanel

### Network Mode
- O serviço `voip` (Asterisk) deve usar `network_mode: host` para suporte a RTP
- Os demais serviços devem usar a rede bridge padrão

### Portas Expostas
- **Frontend**: 3000
- **Backend**: 3001  
- **Asterisk AMI**: 5038 (apenas localhost)
- **Asterisk WSS**: 8089
- **RTP**: 10000-10200/udp

### Volumes Persistentes
- `asterisk_certs`: Certificados TLS
- `asterisk_recordings`: Gravações de chamadas

## 🚀 Instruções de Deploy

1. **Configure todas as variáveis de ambiente** listadas acima no painel do Easypanel
2. **Substitua os valores de exemplo** pelos seus valores reais:
   - `SEU_DOMINIO.com` → seu domínio real
   - `SEU_IP_PUBLICO_AQUI` → IP público do servidor
   - Senhas e secrets → valores únicos e seguros
3. **Faça o deploy** do repositório Git
4. **Aguarde** o build completar (pode demorar alguns minutos)
5. **Teste** os health checks:
   - Backend: `https://SEU_DOMINIO.com/api/health`
   - Frontend: `https://SEU_DOMINIO.com`

## 🐛 Troubleshooting

### Se o backend falhar no health check:
1. Verifique se todas as variáveis de ambiente estão configuradas
2. Verifique se o Supabase está acessível
3. Verifique os logs do container backend

### Se o Asterisk não conectar:
1. Verifique se `EXTERNAL_IP` está correto
2. Verifique se as portas RTP estão abertas
3. Verifique se o certificado TLS foi gerado

### Se o frontend não carregar:
1. Verifique se `NEXT_PUBLIC_API_URL` está correto
2. Verifique se o backend está healthy
3. Verifique se as variáveis `NEXT_PUBLIC_*` estão configuradas 