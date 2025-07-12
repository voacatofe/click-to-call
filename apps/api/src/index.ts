import express from 'express';
import routes from './routes'; // Importa nosso roteador principal

const app = express();
const port = process.env.PORT || 3001;

// Configuração de CORS para desenvolvimento local
// Detecta se está rodando em ambiente de desenvolvimento baseado no hostname
// Em produção (EasyPanel), o roteamento é no mesmo domínio, não precisando de CORS
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     process.env.CORS_ORIGIN || 
                     process.env.EXTERNAL_IP === '127.0.0.1' ||
                     process.env.EXTERNAL_IP === 'localhost';

if (isDevelopment) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });
}

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