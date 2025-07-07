import { Request, Response } from 'express';
import { getContacts } from '../services/rdcrm.service';
import { saveRdTokenForCompany } from '../services/company.service';

// Estendendo a interface Request para reconhecer nossa propriedade customizada
interface AuthenticatedRequest extends Request {
  rdApiToken?: string;
}

export const listContactsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const token = req.rdApiToken; // Pega o token injetado pelo middleware
    if (!token) {
      throw new Error('RD Station token is missing from request.');
    }
    const contacts = await getContacts(token);
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contacts from RD CRM' });
  }
};

export const updateRdTokenController = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.params;
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }

  try {
    await saveRdTokenForCompany(companyId, token);

    res.status(200).json({ message: `Token for company ${companyId} updated successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update RD CRM token' });
  }
}; 