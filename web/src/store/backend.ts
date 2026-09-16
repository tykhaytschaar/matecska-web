import type { PlayerEvent } from '../core/events';
import type { ImportedProfile, PlayerRecord, PlayerSummary } from '../core/player';

export interface PlayerListing {
  player: PlayerRecord;
  summary: PlayerSummary;
}

/**
 * A szerver felülete a bejelentkezett szülő nevében. A jogosultságot a szerver ellenőrzi
 * (Supabase RLS); itt csak a saját játékosok érhetők el.
 */
export interface Backend {
  listPlayers(): Promise<PlayerListing[]>;
  createPlayer(name: string, imported: ImportedProfile | null): Promise<PlayerRecord>;
  updatePlayer(player: PlayerRecord): Promise<void>;
  /** Idempotens: már ismert azonosítójú eseményt csendben átugor. */
  pushEvents(events: PlayerEvent[]): Promise<void>;
  fetchSummary(playerId: string): Promise<PlayerSummary>;
  /** Fejlesztői mód: a játékos minden eseményének és átvett adatának törlése. */
  resetPlayer(playerId: string): Promise<void>;
}

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthUser {
  id: string;
  email: string;
}

/** Jelszó nélküli belépés: e-mailre küldött kód. Regisztráció és belépés ugyanaz a lépés. */
export interface AuthClient {
  currentUser(): Promise<AuthUser | null>;
  onChange(listener: (user: AuthUser | null) => void): () => void;
  requestCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
}
