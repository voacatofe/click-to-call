import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';

// Estendendo a interface Request para adicionar nossa propriedade customizada
interface AuthenticatedRequest extends Request {
  rdApiToken?: string;
}

export const injectRdTokenMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Em um cenário real, pegaríamos o ID da empresa do usuário autenticado (ex: req.user.companyId)
  // Por agora, vamos usar um ID de empresa fixo para fins de desenvolvimento.
  // Você pode pegar um ID da sua tabela 'companies' no Supabase para testar.
  const companyIdForDev = '41b4dc00-18d2-4995-95d1-7e9bad7ae143'; 

  if (!companyIdForDev) {
    res.status(401).json({ message: 'Could not identify the company for this request.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('rd_station_token')
      .eq('id', companyIdForDev)
      .single();

    if (error || !data || !data.rd_station_token) {
      throw new Error('Company RD Station token not found or database error.');
    }

    // Injeta o token na requisição para que o próximo handler possa usá-lo
    req.rdApiToken = data.rd_station_token;

    next(); // Passa para o próximo middleware ou para o controller
  } catch (error: any) {
    console.error('Error in injectRdTokenMiddleware:', error.message);
    res.status(403).json({ message: 'Invalid or missing RD Station token for this company.' });
  }
}; 