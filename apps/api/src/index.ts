import express from 'express';
import routes from './routes'; // Importa nosso roteador principal

const app = express();
const port = process.env.PORT || 3001;

// A configuração de CORS foi removida, pois o EasyPanel gerencia o roteamento
// no mesmo domínio, tornando o CORS explícito desnecessário e potencialmente problemático.

app.use(express.json()); // Adiciona o middleware para parsear o corpo da requisição JSON

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'click-to-call-api',
    version: '1.0.0'
  });
});

app.use('/api', routes); // Usa o roteador principal sob o prefixo /api

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
}); 