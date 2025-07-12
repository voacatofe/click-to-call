import express from 'express';
import routes from './routes'; // Importa nosso roteador principal
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// --- Configuração Robusta de CORS ---
const whitelist = [
  'http://localhost:3000', // Desenvolvimento Local
  'https://click-to-call-ctc.hvlihi.easypanel.host' // Domínio de Produção do Frontend
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (ex: Postman, apps mobile) ou da nossa whitelist
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permite o envio de cookies e headers de autorização
};

app.use(cors(corsOptions));
// --- Fim da Configuração de CORS ---

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