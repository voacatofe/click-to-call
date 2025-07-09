import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';

// Estendendo a interface Request para adicionar nossa propriedade customizada
interface AuthenticatedRequest extends Request {
  rdApiToken?: string;
  user?: any;
  companyId?: string;
}

export const injectRdTokenMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // Extrair token JWT do header Authorization
  const authHeader = (req as any).headers.authorization as string;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    res.status(401).json({ message: 'Authorization token required.' });
    return;
  }

  try {
    // IMPLEMENTAÇÃO TEMPORÁRIA: Validação básica de token
    // TODO: Implementar validação JWT completa com biblioteca jwt
    // Exemplo: const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Para agora, vamos simular a validação e extrair companyId do token
    // Em produção, isso deve ser feito com validação JWT apropriada
    let companyId: string;
    
    try {
      // Tentativa de usar Supabase Auth (pode variar conforme versão)
      const authResult = await (supabase.auth as any).getUser(token);
      const user = authResult?.data?.user || authResult?.user;
      
      if (!user) {
        res.status(401).json({ message: 'Invalid token: user not found.' });
        return;
      }
      
      companyId = user.user_metadata?.company_id || user.app_metadata?.company_id;
      req.user = user;
      
    } catch (authError) {
      // Fallback: Para desenvolvimento, aceitar um company ID fixo se não conseguir validar
      console.warn('Auth validation failed, using fallback. Configure proper JWT validation.');
      companyId = '41b4dc00-18d2-4995-95d1-7e9bad7ae143'; // REMOVER EM PRODUÇÃO
    }
    
    if (!companyId) {
      res.status(400).json({ message: 'User is not associated with any company.' });
      return;
    }

    req.companyId = companyId;

    // Buscar token RD Station da empresa
    const { data: companyData, error } = await supabase
      .from('companies')
      .select('rd_station_token')
      .eq('id', companyId)
      .single();

    if (error || !companyData || !companyData.rd_station_token) {
      res.status(403).json({ message: 'Company RD Station token not found.' });
      return;
    }

    // Injeta o token na requisição
    req.rdApiToken = companyData.rd_station_token;

    next(); // Passa para o próximo middleware ou controller
  } catch (error: any) {
    console.error('Error in injectRdTokenMiddleware:', error.message);
    res.status(403).json({ message: 'Authentication failed.' });
  }
}; 