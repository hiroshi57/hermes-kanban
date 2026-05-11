import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env['VITE_SUPABASE_URL']  as string | undefined;
const supabaseKey  = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined;

/** Supabase が設定されているかどうか */
export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseKey) &&
  supabaseUrl !== 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co';

/** Supabase クライアント（未設定時は null） */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;
