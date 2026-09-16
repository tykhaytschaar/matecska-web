import type { GameCharacter } from '../core/characters';
import { attemptEvent } from '../core/events';
import type { PracticeMode } from '../core/operation';
import { buildProfile, EMPTY_SUMMARY, freshState, importFrom, type ImportedProfile, type PlayerState } from '../core/player';
import { dummyProfile, ownsCharacter, type PlayerProfile } from '../core/profile';
import type { ScoreBreakdown } from '../core/scoring';
import type { Backend, PlayerListing } from './backend';
import { LocalCache, loadLegacyProfile, removeLegacyProfile } from './localCache';
import type { KeyValueStorage } from './storage';
import { mergePending, syncPlayer, type SyncStatus } from './sync';

/** Mennyi ideig gyűjtjük az eseményeket egy feltöltésbe. */
const SYNC_DELAY_MS = 1500;

/**
 * A fiók játékosai és az aktív játékos játékállapota. Minden módosítás azonnal helyben
 * mentődik, és rövid késleltetéssel a szerverre kerül; net nélkül a függő események
 * megmaradnak a következő alkalomig.
 */
export class PlayerStore {
  players = $state<PlayerListing[]>([]);
  active = $state<PlayerState | null>(null);
  /** Igaz, ha a helyi gyorstár (és ha volt net, a szerver) már betöltődött. */
  ready = $state(false);
  /** A szerver elérhetetlen volt az utolsó próbálkozásnál. */
  offline = $state(false);
  /** A fiók nélküli, korábbi helyi profil, amit az első játékos átvehet. */
  legacy = $state<PlayerProfile | null>(null);

  profile = $derived<PlayerProfile>(this.active ? buildProfile(this.active) : dummyProfile());
  syncStatus = $derived<SyncStatus | 'pending'>(
    this.offline ? 'offline' : this.active && (this.active.pending.length > 0 || this.active.dirty) ? 'pending' : 'synced',
  );

  private readonly cache: LocalCache;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private syncing: Promise<void> | null = null;
  private readonly onOnline = () => void this.sync();

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly backend: Backend,
    userId: string,
  ) {
    this.cache = new LocalCache(storage, userId);
    globalThis.addEventListener?.('online', this.onOnline);
    void this.load();
  }

  private async load(): Promise<void> {
    const [cached, activeId, legacy] = await Promise.all([
      this.cache.loadPlayers(),
      this.cache.loadActiveId(),
      loadLegacyProfile(this.storage),
    ]);
    this.players = cached ?? [];
    this.legacy = legacy;
    if (activeId) {
      const state = await this.cache.loadState(activeId);
      if (state) this.active = state;
    }
    await this.refreshPlayers();
    this.ready = true;
    void this.sync();
  }

  /** A játékoslista frissítése a szerverről; net nélkül a gyorstár marad. */
  async refreshPlayers(): Promise<void> {
    try {
      const listing = await this.backend.listPlayers();
      this.offline = false;
      this.players = listing;
      await this.cache.savePlayers(listing);
      if (this.active && !listing.some((l) => l.player.id === this.active!.player.id)) {
        await this.deactivate();
      }
    } catch {
      this.offline = true;
    }
  }

  /** Új játékos; ha még nincs egy sem és van korábbi helyi profil, azt átveszi. */
  async createPlayer(name: string): Promise<void> {
    let imported: ImportedProfile | null = null;
    if (this.players.length === 0 && this.legacy) imported = importFrom(this.legacy);
    const player = await this.backend.createPlayer(name, imported);
    this.offline = false;
    if (imported) {
      await removeLegacyProfile(this.storage);
      this.legacy = null;
    }
    const listing: PlayerListing = { player, summary: EMPTY_SUMMARY };
    this.players = [...this.players, listing];
    await this.cache.savePlayers(this.players);
    await this.activate(player.id);
  }

  async activate(playerId: string): Promise<void> {
    await this.flush();
    const listing = this.players.find((l) => l.player.id === playerId);
    if (!listing) return;
    const cached = await this.cache.loadState(playerId);
    this.active = cached
      ? { ...cached, player: cached.dirty ? cached.player : listing.player, summary: cached.pending.length ? cached.summary : listing.summary }
      : freshState(listing.player, listing.summary);
    await Promise.all([this.cache.saveActiveId(playerId), this.cache.saveState(this.active)]);
    void this.sync();
  }

  async deactivate(): Promise<void> {
    await this.flush();
    this.active = null;
    await this.cache.saveActiveId(null);
  }

  record(score: ScoreBreakdown, correct: boolean, mode: PracticeMode): void {
    if (!this.active) return;
    const event = attemptEvent(this.profile, score, correct, mode);
    this.commit({ ...this.active, pending: [...this.active.pending, event] });
  }

  select(character: GameCharacter): void {
    if (!this.active || !ownsCharacter(this.profile, character.id)) return;
    this.commit({ ...this.active, player: { ...this.active.player, selectedCharacterID: character.id }, dirty: true });
  }

  /** Fejlesztői mód: a játékos összpontja a megadott értékre áll (pontkorrekcióval, a válaszok maradnak). */
  async setPoints(playerId: string, target: number): Promise<void> {
    const goal = Math.max(0, Math.floor(target));
    if (this.active?.player.id === playerId) {
      const delta = goal - this.profile.totalPoints;
      this.commit({ ...this.active, player: { ...this.active.player, pointAdjustment: this.active.player.pointAdjustment + delta }, dirty: true });
      await this.flush();
      return;
    }
    const listing = this.players.find((l) => l.player.id === playerId);
    if (!listing) return;
    const current = buildProfile(freshState(listing.player, listing.summary)).totalPoints;
    const player = { ...listing.player, pointAdjustment: listing.player.pointAdjustment + (goal - current) };
    await this.backend.updatePlayer(player);
    await this.refreshPlayers();
  }

  /** Fejlesztői mód: egy játékos statisztikája, pontja és karakterei törlődnek a szerveren és helyben. */
  async resetPlayer(playerId: string): Promise<void> {
    await this.backend.resetPlayer(playerId);
    await this.cache.removeState(playerId);
    if (this.active?.player.id === playerId) {
      this.active = freshState({ ...this.active.player, imported: null, selectedCharacterID: 'cat', pointAdjustment: 0 });
      await this.cache.saveState(this.active);
    }
    await this.refreshPlayers();
  }

  /** Kijelentkezés előtt: feltöltés, majd a fiók helyi adatainak törlése. */
  async clearLocal(): Promise<void> {
    await this.flush();
    await this.cache.clear(this.players.map((l) => l.player.id));
    this.active = null;
    this.players = [];
  }

  dispose(): void {
    globalThis.removeEventListener?.('online', this.onOnline);
    if (this.timer) clearTimeout(this.timer);
  }

  private commit(state: PlayerState): void {
    this.active = state;
    void this.cache.saveState(state);
    this.schedule();
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.sync(), SYNC_DELAY_MS);
  }

  /** Azonnali feltöltés, a késleltetést átugorva; a hibát elnyeli. */
  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.sync();
  }

  async sync(): Promise<void> {
    if (this.syncing) return this.syncing;
    this.syncing = this.run().finally(() => (this.syncing = null));
    return this.syncing;
  }

  private async run(): Promise<void> {
    const snapshot = this.active;
    if (!snapshot) return;
    const result = await syncPlayer(snapshot, this.backend);
    this.offline = result.status === 'offline';
    if (!this.active || this.active.player.id !== snapshot.player.id) return;
    const merged = mergePending(result.state, this.active, snapshot);
    this.active = merged;
    await this.cache.saveState(merged);
    if (result.status === 'synced') {
      const summary = merged.summary;
      this.players = this.players.map((l) => (l.player.id === merged.player.id ? { player: merged.player, summary } : l));
      await this.cache.savePlayers(this.players);
    }
  }
}
