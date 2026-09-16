import type { AuthClient, Backend } from '../store/backend';
import type { KeyValueStorage } from '../store/storage';
import { supabaseAuth, supabaseBackend } from '../store/supabaseBackend';
import { fakeServices } from './fakeBackend';
import { createSupabase, supabaseConfigured } from './supabase';

export interface Services {
  auth: AuthClient;
  backend: Backend;
}

/**
 * A szerveroldal kiválasztása: Supabase, ha be van állítva; fejlesztői buildben
 * `VITE_FAKE_BACKEND=1` esetén memóriabeli utánzat. `null`, ha nincs beállítva semmi.
 */
export function createServices(storage: KeyValueStorage): Services | null {
  if (import.meta.env.DEV && import.meta.env.VITE_FAKE_BACKEND === '1') return fakeServices(storage);
  if (!supabaseConfigured()) return null;
  const client = createSupabase(storage);
  return { auth: supabaseAuth(client), backend: supabaseBackend(client) };
}
