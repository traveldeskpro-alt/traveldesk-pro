// Supabase browser client — uses @supabase/ssr so the session is stored in
// cookies (not localStorage). This makes the token readable by the Next.js
// Edge middleware, which is required for server-side auth gating.
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Module-level singleton. null when env vars are absent (local dev without Supabase).
export const supabase = (supabaseUrl && supabaseKey)
  ? createBrowserClient(supabaseUrl, supabaseKey)
  : null;

export function withAgencyFilter(query: any, agencyId: string) {
  return query.eq('agency_id', agencyId);
}

export function withAgencyInsert(data: any, agencyId: string) {
  return { ...data, agency_id: agencyId };
}
