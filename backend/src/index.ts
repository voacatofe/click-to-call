import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userAuthRoutes from './routes/user-auth.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rotas
app.use('/auth', authRoutes);
app.use('/auth', userAuthRoutes);

// Rota de teste
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor rodando!' });
});

// Iniciar servidor
app.listen(Number(PORT), '0.0.0.0', () => {
  // Servidor iniciado com sucesso
  process.stdout.write(`Servidor rodando na porta ${PORT}\n`);
});
