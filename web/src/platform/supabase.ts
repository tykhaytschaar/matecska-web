import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { KeyValueStorage } from '../store/storage';

/** A Supabase-projekt nyilvános adatai; `.env.local`-ból (fejlesztés) vagy CI-változóból. */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY ?? '';

export function supabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
}

/**
 * Supabase kliens, a bejelentkezés tokenjeit a platform tárolójában tartva (natívan
 * Preferences, hogy a WebView tárhelyürítése ne jelentkeztesse ki a szülőt).
 */
export function createSupabase(storage: KeyValueStorage): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: {
        getItem: (key) => storage.get(key),
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.remove(key),
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  });
}
