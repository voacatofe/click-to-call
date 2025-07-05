import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/auth';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({
      error: 'Token não fornecido',
      message: 'Token de autenticação é obrigatório'
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // Token secret não configurado
      res.status(500).json({
        error: 'Erro de configuração do servidor',
        message: 'JWT secret não configurado'
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  } catch {
    res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticação inválido'
    });
  }
}; 