import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-supabase.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon-publica';

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseUrl !== 'https://sua-url-supabase.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'sua-chave-anon-publica' &&
    supabaseAnonKey !== 'COLE_SUA_CHAVE_ANON_AQUI'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
