import { supabase } from '../lib/supabaseClient';

export const saveRdTokenForCompany = async (companyId: string, token: string): Promise<void> => {
  const { error } = await supabase
    .from('companies')
    .update({ rd_station_token: token })
    .eq('id', companyId);

  if (error) {
    console.error('Error updating company token in Supabase:', error);
    throw new Error('Failed to update company token.');
  }
};

export const getCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*');

  if (error) {
    console.error('Error fetching companies from Supabase:', error);
    throw new Error('Failed to fetch companies.');
  }

  return data;
};

export const getCompanyById = async (id: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching company with id ${id}:`, error);
    throw new Error('Failed to fetch company.');
  }

  return data;
}

export const createCompany = async (companyData: { name: string; twilio_account_sid?: string; twilio_auth_token?: string }) => {
  const { data, error } = await supabase
    .from('companies')
    .insert([companyData])
    .select()
    .single();

  if (error) {
    console.error('Error creating company in Supabase:', error);
    throw new Error('Failed to create company.');
  }

  return data;
};

export const updateCompany = async (id: string, companyData: { name?: string; twilio_account_sid?: string; twilio_auth_token?: string }) => {
  const { data, error } = await supabase
    .from('companies')
    .update(companyData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating company with id ${id}:`, error);
    throw new Error('Failed to update company.');
  }

  return data;
};

export const deleteCompany = async (id: string) => {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting company with id ${id}:`, error);
    throw new Error('Failed to delete company.');
  }
}; 