import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (customUrl?: string, customKey?: string): SupabaseClient | null => {
  const url = customUrl || envUrl;
  const key = customKey || envKey;

  if (!url || !key) {
    return null;
  }

  try {
    if (!supabaseInstance || customUrl || customKey) {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

export const defaultSupabaseUrl = envUrl || 'https://anggsdesivvelfaawsah.supabase.co';
export const defaultSupabaseKey = envKey || 'sb_publishable_cHTb-Af7H-0oyZ-tRly8LA_KvSNXQ0K';
