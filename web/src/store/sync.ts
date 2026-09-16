import type { PlayerState } from '../core/player';
import type { Backend, PlayerListing } from './backend';

export type SyncStatus = 'synced' | 'offline';

export interface SyncResult {
  state: PlayerState;
  status: SyncStatus;
}

/**
 * Egy játékos helyi állapotának egyeztetése a szerverrel: a módosult sor és a függő
 * események felmennek, majd a friss összesítés lejön. Hiba (pl. nincs net) esetén a helyi
 * állapot marad, a függő események megőrződnek, és a státusz `offline`.
 *
 * A bemenetet nem módosítja; a hívó a visszaadott állapotot menti. A feltöltés közben
 * keletkezett új eseményeket a hívónak kell átvinnie (lásd `mergePending`).
 */
export async function syncPlayer(state: PlayerState, backend: Backend): Promise<SyncResult> {
  let next = state;
  try {
    if (next.dirty) {
      await backend.updatePlayer(next.player);
      next = { ...next, dirty: false };
    }
    if (next.pending.length > 0) {
      await backend.pushEvents(next.pending);
      next = { ...next, pending: [] };
    }
    const summary = await backend.fetchSummary(next.player.id);
    next = { ...next, summary };
    return { state: next, status: 'synced' };
  } catch {
    return { state: next, status: 'offline' };
  }
}

/**
 * A szinkron alatt helyben továbbfejlődött állapot összefésülése a szinkron eredményével:
 * a szerverről jött sor/összesítés győz, de a közben keletkezett események és a közben
 * beállt módosítás megmarad.
 */
export function mergePending(synced: PlayerState, current: PlayerState, snapshot: PlayerState): PlayerState {
  const uploaded = new Set(snapshot.pending.map((e) => e.id));
  const uploadedNow = synced.pending.length === 0;
  const pending = uploadedNow ? current.pending.filter((e) => !uploaded.has(e.id)) : current.pending;
  const playerChanged = current.player !== snapshot.player;
  return {
    player: playerChanged ? current.player : synced.player,
    summary: synced.summary,
    pending,
    dirty: playerChanged ? true : synced.dirty,
  };
}

/**
 * A szerverről frissen lekért lista sorának átvétele az aktív állapotba: a játékos sora
 * (név, karakter, pontkorrekció) mindig a szerveré, kivéve ha helyben módosult és még nem
 * ment fel; az összesítés csak akkor, ha nincs függő esemény, mert azok a régi összesítésre
 * épülnek. Ha a lista nem tartalmazza a játékost, `null` (törölték máshol).
 */
export function adoptListing(state: PlayerState, listing: PlayerListing[]): PlayerState | null {
  const mine = listing.find((l) => l.player.id === state.player.id);
  if (!mine) return null;
  return {
    ...state,
    player: state.dirty ? state.player : mine.player,
    summary: state.pending.length > 0 ? state.summary : mine.summary,
  };
}
