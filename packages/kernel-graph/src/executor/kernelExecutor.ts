import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        '[SIMIS] FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Server-side kernel cannot start without valid credentials. ' +
        'Set these env vars and restart.'
      );
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}
