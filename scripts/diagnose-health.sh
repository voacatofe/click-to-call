#!/bin/bash

# Script de diagnóstico para Click-to-Call System
# Verifica a saúde dos serviços e identifica problemas

echo "🔍 Diagnóstico do Click-to-Call System"
echo "======================================"

# Verificar se os containers estão rodando
echo ""
echo "📋 Status dos containers:"
docker-compose ps

# Verificar health checks
echo ""
echo "🏥 Health checks:"
echo "Backend: http://localhost:3001/api/health"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health
echo ""

echo "Frontend: http://localhost:3000"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
echo ""

# Verificar logs do backend
echo ""
echo "📋 Últimos logs do backend:"
docker-compose logs --tail=20 backend

# Verificar logs do Asterisk
echo ""
echo "📋 Últimos logs do Asterisk:"
docker-compose logs --tail=20 voip

# Verificar conectividade interna
echo ""
echo "🔗 Testando conectividade interna:"
echo "Backend → Asterisk AMI (porta 5038):"
docker exec clicktocall-backend nc -zv voip 5038 2>&1 || echo "❌ Falha na conexão"

# Verificar variáveis de ambiente
echo ""
echo "🌍 Variáveis de ambiente do backend:"
docker exec clicktocall-backend env | grep -E "ASTERISK|SUPABASE|NODE_ENV|PORT"

echo ""
echo "✅ Diagnóstico concluído!"
echo "Se houver problemas, verifique os logs acima e o arquivo EASYPANEL_CONFIG.md" 