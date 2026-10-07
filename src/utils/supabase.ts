import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://anggsdesivvelfaawsah.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_cHTb-Af7H-0oyZ-tRly8LA_KvSNXQ0K';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
