import { Request } from 'express';

// Interface que estende Request do Express para adicionar propriedades customizadas
export interface AuthenticatedRequest extends Request {
  rdApiToken?: string;
  // Futuramente, podemos adicionar a propriedade user aqui
  user?: {
    id: string;
    companyId: string;
  }
} 