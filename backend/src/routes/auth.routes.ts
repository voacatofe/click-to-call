import { Router } from 'express';
import { authenticateWithToken, getUserInfo, validateToken } from '../controllers/auth.controller';

const router = Router();

// Rota para autenticar com token do RD Station CRM
router.post('/rdstation-crm/authenticate', authenticateWithToken);

// Rota para obter informações do usuário
router.get('/user/:userId', getUserInfo);

// Rota para validar se o token ainda é válido
router.get('/user/:userId/validate-token', validateToken);

export default router;
