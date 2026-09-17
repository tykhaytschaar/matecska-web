import type { PlayerEvent } from '../core/events';
import type { ImportedProfile, PlayerRecord, PlayerSummary } from '../core/player';
import type { ModeStats } from '../core/stats';

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
  /** Módonkénti statisztika a szerverről egy időponttól (`null` = mindentől). */
  fetchModeStats(playerId: string, since: Date | null): Promise<ModeStats[]>;
  /** A játékos munkamenet-azonosítói egy időponttól (a helyiekkel uniózva adja a számot). */
  fetchSessionIds(playerId: string, since: Date | null): Promise<string[]>;
  /** Fejlesztői mód: a játékos minden eseményének és átvett adatának törlése. */
  resetPlayer(playerId: string): Promise<void>;
  /**
   * Törlési megerősítő kód kérése e-mailben (fiókra vagy egy játékosra). A szerver percenként
   * egyet enged; a kód 10 percig érvényes. Hiba: `DeletionCodeError`.
   */
  requestDeletionCode(kind: 'account' | 'player', playerId?: string): Promise<void>;
  /** A játékos és minden adata (válaszok) végleges törlése, a kapott megerősítő kóddal. */
  deletePlayer(playerId: string, code: string): Promise<void>;
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
  /** A fiók és minden adata törlése, a kapott megerősítő kóddal. */
  deleteAccount(code: string): Promise<void>;
}

/** A megerősítő kódos folyamat hibái, emberi üzenettel a felületnek. */
export class DeletionCodeError extends Error {
  constructor(
    message: string,
    readonly reason: 'rate-limit' | 'invalid-code' | 'send-failed' | 'network' | 'other',
  ) {
    super(message);
  }
}
