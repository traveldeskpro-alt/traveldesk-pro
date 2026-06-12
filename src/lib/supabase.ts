// Supabase client — works when env vars are set, otherwise falls back to localStorage mode
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function withAgencyFilter(query: any, agencyId: string) {
  return query.eq('agency_id', agencyId);
}

export function withAgencyInsert(data: any, agencyId: string) {
  return { ...data, agency_id: agencyId };
}
