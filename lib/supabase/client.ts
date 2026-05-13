import { createBrowserClient } from '@supabase/ssr';
import { resolveSupabasePublicKey } from '@/lib/env';

export function createSupabaseBrowserClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, resolveSupabasePublicKey());
}
