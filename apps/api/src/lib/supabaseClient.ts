import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase URL or Service Role Key is not defined in the environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); 