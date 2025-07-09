import express from 'express';
import routes from './routes'; // Importa nosso roteador principal

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // Adiciona o middleware para parsear o corpo da requisição JSON

app.use('/api', routes); // Usa o roteador principal sob o prefixo /api

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
}); 