import { Router, Request, Response, NextFunction } from 'express';
import { register, login, setRdStationToken, getProfile } from '../controllers/user-auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// Wrapper para funções async normais
const asyncHandler = (fn: (req: Request, res: Response, next?: NextFunction) => Promise<Response | undefined>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
};

// Wrapper para funções async autenticadas
const authAsyncHandler = (fn: (req: AuthenticatedRequest, res: Response, next?: NextFunction) => Promise<Response | undefined>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req as AuthenticatedRequest, res, next).catch(next);
  };
};

// Rotas públicas
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

// Rotas protegidas (requerem token JWT)
router.get('/profile', authenticate, authAsyncHandler(getProfile));
router.post('/rdstation-token', authenticate, authAsyncHandler(setRdStationToken));

export default router; 