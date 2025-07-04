import { Router } from 'express';
import { register, login, setRdStationToken, getProfile } from '../controllers/user-auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Rotas públicas
router.post('/register', register);
router.post('/login', login);

// Rotas protegidas (requerem token JWT)
router.get('/profile', authenticate, getProfile);
router.post('/rdstation-token', authenticate, setRdStationToken);

export default router; 