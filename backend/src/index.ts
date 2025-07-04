import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user-auth.routes'; // Importar as novas rotas

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.use('/api/auth', userRoutes); // Usar as novas rotas de usuário/empresa
app.use('/api/integration', authRoutes); // Manter as rotas de integração (legado/futuro)

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
