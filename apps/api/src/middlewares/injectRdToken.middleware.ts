import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';
import jwt from 'jsonwebtoken'; // Usar uma biblioteca JWT real

// Estendendo a interface Request para adicionar nossa propriedade customizada
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    companyId: string;
  };
  rdApiToken?: string;
}

const getRequiredEnv = (varName: string): string => {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
  return value;
};

const JWT_SECRET = getRequiredEnv('JWT_SECRET');

export const injectRdTokenMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    res.status(401).json({ message: 'Authorization token is required.' });
    return;
  }

  try {
    // 1. Decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string; [key: string]: any };

    const companyId = decoded.companyId;

    if (!companyId) {
      res.status(401).json({ message: 'Invalid token: companyId not found in token payload.' });
      return;
    }
    
    // Injetar informações do usuário na requisição para uso posterior
    req.user = {
      id: decoded.userId,
      companyId: companyId
    };

    // 2. Buscar o token do RD Station para a empresa
    const { data: companyData, error } = await supabase
      .from('companies')
      .select('rd_station_token')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error(`Error fetching RD token for company ${companyId}:`, error);
      res.status(500).json({ message: 'Failed to retrieve company data.' });
      return;
    }
    
    if (!companyData || !companyData.rd_station_token) {
      res.status(403).json({ message: 'RD Station token not configured for this company.' });
      return;
    }

    // 3. Injetar o token do RD Station na requisição
    req.rdApiToken = companyData.rd_station_token;

    next();
  } catch (error) {
    console.error('JWT validation failed:', error);
    res.status(401).json({ message: 'Authentication failed. Invalid or expired token.' });
  }
}; 