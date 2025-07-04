import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user-auth.routes'; // Importar as novas rotas

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.use('/auth', userRoutes); // Removido o /api. O proxy cuida disso.
app.use('/integration', authRoutes); // Removido o /api.

app.listen(Number(port), '0.0.0.0', () => {
  // Server started successfully
});
