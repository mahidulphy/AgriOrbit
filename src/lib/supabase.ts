import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

/**
 * Validates whether real, production Supabase environment credentials are provided.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    !supabaseAnonKey.includes('your-anon-key-here') &&
    supabaseUrl.startsWith('https://')
  );
};

// Fallback dummy URL and Key for client instantiation when credentials are not yet set
// This ensures createClient never throws during initial evaluation or test suites
const safeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-agriorbit.supabase.co';
const safeKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'agriorbit-supabase-auth',
  },
});
