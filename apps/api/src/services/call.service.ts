import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/supabase';

// Helper para os tipos, para serem usados nos nossos serviços
type Call = Database['public']['Tables']['calls']['Row'];
type NewCall = Database['public']['Tables']['calls']['Insert'];
type CallUpdate = Database['public']['Tables']['calls']['Update'];

export const getCalls = async (): Promise<Call[]> => {
  const { data, error } = await supabase
    .from('calls')
    .select('*');

  if (error) {
    console.error('Error fetching calls from Supabase:', error);
    throw new Error('Failed to fetch calls.');
  }

  return data;
};

export const createCall = async (callData: NewCall): Promise<Call> => {
  const { data, error } = await supabase
    .from('calls')
    .insert([callData])
    .select()
    .single();

  if (error) {
    console.error('Error creating call in Supabase:', error);
    throw new Error('Failed to create call.');
  }

  return data;
};

export const updateCall = async (id: string, callData: CallUpdate): Promise<Call> => {
  const { data, error } = await supabase
    .from('calls')
    .update(callData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating call with id ${id}:`, error);
    throw new Error('Failed to update call.');
  }

  return data;
}; 