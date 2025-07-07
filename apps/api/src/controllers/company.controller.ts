import { Request, Response } from 'express';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } from '../services/company.service';

export const listCompaniesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const companies = await getCompanies();
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
};

export const getCompanyByIdController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const company = await getCompanyById(id);
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch company' });
  }
};

export const createCompanyController = async (req: Request, res: Response): Promise<void> => {
  const { name, twilio_account_sid, twilio_auth_token } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Company name is required' });
    return;
  }

  try {
    const newCompany = await createCompany({ name, twilio_account_sid, twilio_auth_token });
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create company' });
  }
};

export const updateCompanyController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const updatedCompany = await updateCompany(id, req.body);
    res.status(200).json(updatedCompany);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update company' });
  }
};

export const deleteCompanyController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await deleteCompany(id);
    res.status(204).send(); // 204 No Content é a resposta padrão para um delete bem-sucedido
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete company' });
  }
}; 