import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://anggsdesivvelfaawsah.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_cHTb-Af7H-0oyZ-tRly8LA_KvSNXQ0K';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_PUBLISHABLE_KEY = supabaseKey;

/**
 * Helper to check connection to Supabase database
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.from('farms').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Database Supabase berhasil terhubung.' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Gagal terhubung ke Supabase.' };
  }
}
