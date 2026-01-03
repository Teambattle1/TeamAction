import { createClient } from '@supabase/supabase-js';

// NOTE: These defaults keep the app working out-of-the-box.
// For production, prefer providing Vite env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
// or setting localStorage keys (SUPABASE_URL / SUPABASE_ANON_KEY) so you can rotate without code changes.
const DEFAULT_SUPABASE_URL = 'https://yktaxljydisfjyqhbnja.supabase.co';
// Using newer publishable key format (more reliable)
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_p-hMXBWqcvE4l_Ud7D0L8Q_faGIPYOc';

const getSupabaseUrl = () => {
  const local = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_URL') : null;
  const env = (import.meta as any).env?.VITE_SUPABASE_URL;
  return local || env || DEFAULT_SUPABASE_URL;
};

const getSupabaseAnonKey = () => {
  const local = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') : null;
  const env = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  return local || env || DEFAULT_SUPABASE_ANON_KEY;
};

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    persistSession: false
  }
});
