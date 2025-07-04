import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Autenticação necessária',
      message: 'Token de autenticação não fornecido ou em formato inválido.'
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET não está configurado no ambiente.');
    return res.status(500).json({
      error: 'Erro de configuração do servidor',
      message: 'A chave secreta para JWT não está configurada.'
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido ou expirado',
      message: 'Seu token de autenticação é inválido ou já expirou.'
    });
  }
}; 