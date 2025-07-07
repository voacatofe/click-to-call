import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/supabase';

// Helper para o tipo de uma nova chamada, para ser usado no 'create'
type NewCall = Database['public']['Tables']['calls']['Insert'];

export const getCalls = async () => {
  const { data, error } = await supabase
    .from('calls')
    .select('*');

  if (error) {
    console.error('Error fetching calls from Supabase:', error);
    throw new Error('Failed to fetch calls.');
  }

  return data;
};

export const createCall = async (callData: NewCall) => {
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