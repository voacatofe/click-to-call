import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.API_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.API_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not defined in the environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); 