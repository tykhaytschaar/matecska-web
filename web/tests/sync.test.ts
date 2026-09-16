import { describe, expect, it } from 'vitest';
import { attemptEvent, type PlayerEvent } from '../src/core/events';
import { buildProfile, EMPTY_SUMMARY, freshState, type ImportedProfile, type PlayerRecord, type PlayerSummary } from '../src/core/player';
import type { Backend, PlayerListing } from '../src/store/backend';
import { LocalCache } from '../src/store/localCache';
import { memoryStorage } from '../src/store/storage';
import { adoptListing, mergePending, syncPlayer } from '../src/store/sync';

/** Szerver-utánzat: eseménynaplóból számol, mint a player_summaries nézet. */
class FakeBackend implements Backend {
  players: PlayerRecord[] = [];
  events = new Map<string, PlayerEvent>();
  online = true;
  calls: string[] = [];

  private guard(name: string) {
    this.calls.push(name);
    if (!this.online) throw new Error('Failed to fetch');
  }

  async listPlayers(): Promise<PlayerListing[]> {
    this.guard('list');
    return Promise.all(this.players.map(async (player) => ({ player, summary: await this.fetchSummary(player.id) })));
  }
  async createPlayer(name: string, imported: ImportedProfile | null): Promise<PlayerRecord> {
    this.guard('create');
    const player = { id: `p${this.players.length + 1}`, name, selectedCharacterID: 'cat', imported, pointAdjustment: 0, createdAt: '' };
    this.players.push(player);
    return player;
  }
  async updatePlayer(player: PlayerRecord): Promise<void> {
    this.guard('update');
    this.players = this.players.map((p) => (p.id === player.id ? player : p));
  }
  async pushEvents(events: PlayerEvent[]): Promise<void> {
    this.guard('push');
    for (const e of events) if (!this.events.has(e.id)) this.events.set(e.id, e);
  }
  async fetchSummary(playerId: string): Promise<PlayerSummary> {
    this.guard('summary');
    const summary: PlayerSummary = { pointsDelta: 0, stats: {} };
    for (const e of this.events.values()) {
      if (e.playerId !== playerId) continue;
      summary.pointsDelta += e.points;
      const prev = summary.stats[e.operation] ?? { solved: 0, correct: 0 };
      summary.stats[e.operation] = { solved: prev.solved + 1, correct: prev.correct + (e.correct ? 1 : 0) };
    }
    return summary;
  }
  async resetPlayer(playerId: string): Promise<void> {
    this.guard('reset');
    for (const [id, e] of this.events) if (e.playerId === playerId) this.events.delete(id);
  }
}

const player: PlayerRecord = { id: 'p1', name: 'Anna', selectedCharacterID: 'cat', imported: null, pointAdjustment: 0, createdAt: '' };
const good = { base: 10, bonus: 5, penalty: 0 };

describe('szinkron a szerverrel', () => {
  it('a függő események felmennek, az összesítés lejön, a függő lista kiürül', async () => {
    const backend = new FakeBackend();
    backend.players.push(player);
    let state = freshState(player);
    state = { ...state, pending: [attemptEvent(buildProfile(state), good, true, 'addition-single')] };

    const result = await syncPlayer(state, backend);
    expect(result.status).toBe('synced');
    expect(result.state.pending).toEqual([]);
    expect(result.state.summary.pointsDelta).toBe(15);
    expect(buildProfile(result.state).totalPoints).toBe(15);
    expect(backend.calls).toEqual(['push', 'summary']);
  });

  it('net nélkül a helyi állapot és a függő események megmaradnak', async () => {
    const backend = new FakeBackend();
    backend.online = false;
    const state = { ...freshState(player), pending: [attemptEvent(buildProfile(freshState(player)), good, true, 'addition-single')], dirty: true };
    const result = await syncPlayer(state, backend);
    expect(result.status).toBe('offline');
    expect(result.state).toEqual(state);
    expect(buildProfile(result.state).totalPoints).toBe(15);
  });

  it('újraküldés idempotens: ugyanaz az esemény kétszer sem számít duplán', async () => {
    const backend = new FakeBackend();
    const state = { ...freshState(player), pending: [attemptEvent(buildProfile(freshState(player)), good, true, 'addition-single')] };
    await backend.pushEvents(state.pending);
    const result = await syncPlayer(state, backend);
    expect(result.state.summary.pointsDelta).toBe(15);
  });

  it('a módosult gyereksor (kiválasztott karakter) felmegy és tisztává válik', async () => {
    const backend = new FakeBackend();
    backend.players.push(player);
    const state = { ...freshState({ ...player, selectedCharacterID: 'fox' }), dirty: true };
    const result = await syncPlayer(state, backend);
    expect(result.state.dirty).toBe(false);
    expect(backend.players[0].selectedCharacterID).toBe('fox');
  });

  it('mergePending: a szinkron közben keletkezett események megmaradnak', () => {
    const snapshot = { ...freshState(player), pending: [attemptEvent(buildProfile(freshState(player)), good, true, 'addition-single')] };
    const later = attemptEvent(buildProfile(snapshot), good, true, 'division-table');
    const current = { ...snapshot, pending: [...snapshot.pending, later] };
    const synced = { ...snapshot, pending: [], summary: { ...EMPTY_SUMMARY, pointsDelta: 15 } };
    const merged = mergePending(synced, current, snapshot);
    expect(merged.pending).toEqual([later]);
    expect(merged.summary.pointsDelta).toBe(15);
    expect(buildProfile(merged).totalPoints).toBe(30);
  });

  it('mergePending: sikertelen feltöltésnél minden függő marad; közbeni sorváltozás dirty marad', () => {
    const snapshot = { ...freshState(player), pending: [attemptEvent(buildProfile(freshState(player)), good, true, 'addition-single')] };
    const current = { ...snapshot, player: { ...player, selectedCharacterID: 'fox' }, dirty: true };
    const merged = mergePending(snapshot, current, snapshot);
    expect(merged.pending).toHaveLength(1);
    expect(merged.dirty).toBe(true);
    expect(merged.player.selectedCharacterID).toBe('fox');
  });
});

describe('a szerver listájának átvétele az aktív állapotba', () => {
  const serverPlayer: PlayerRecord = { ...player, name: 'Anna B', selectedCharacterID: 'whitecat', pointAdjustment: 780 };
  const listing: PlayerListing[] = [{ player: serverPlayer, summary: { pointsDelta: 331, stats: {} } }];

  it('tiszta állapotnál a szerver sora és összesítése győz (más eszközön állított pontkorrekció)', () => {
    const adopted = adoptListing(freshState(player), listing)!;
    expect(adopted.player).toEqual(serverPlayer);
    expect(adopted.summary.pointsDelta).toBe(331);
    expect(buildProfile(adopted).totalPoints).toBe(1111);
  });

  it('helyben módosult sor marad, függő eseményeknél az összesítés marad', () => {
    const local = { ...freshState({ ...player, selectedCharacterID: 'blackcat' }), dirty: true, pending: [attemptEvent(buildProfile(freshState(player)), good, true, 'addition-single')] };
    const adopted = adoptListing(local, listing)!;
    expect(adopted.player.selectedCharacterID).toBe('blackcat');
    expect(adopted.summary.pointsDelta).toBe(0);
    expect(adopted.pending).toHaveLength(1);
  });

  it('ha a játékos nincs a listában, null', () => {
    expect(adoptListing(freshState(player), [])).toBeNull();
  });
});

describe('helyi gyorstár', () => {
  it('gyereklista, aktív gyerek és állapot körút, felhasználónként külön', async () => {
    const storage = memoryStorage();
    const cache = new LocalCache(storage, 'u1');
    const other = new LocalCache(storage, 'u2');
    const listing: PlayerListing = { player, summary: { pointsDelta: 3, stats: { addition: { solved: 1, correct: 1 } } } };
    await cache.savePlayers([listing]);
    await cache.saveActiveId('p1');
    const state = { ...freshState(player), pending: [attemptEvent(buildProfile(freshState(player)), good, true, 'addition-single')], dirty: true };
    await cache.saveState(state);

    expect(await cache.loadPlayers()).toEqual([listing]);
    expect(await cache.loadActiveId()).toBe('p1');
    expect(await cache.loadState('p1')).toEqual(state);
    expect(await other.loadPlayers()).toBeNull();
    expect(await other.loadState('p1')).toBeNull();

    await cache.clear(['p1']);
    expect(await cache.loadPlayers()).toBeNull();
    expect(await cache.loadActiveId()).toBeNull();
    expect(await cache.loadState('p1')).toBeNull();
  });

  it('hibás gyorstár-tartalomnál null, nem kivétel', async () => {
    const cache = new LocalCache(memoryStorage({ 'matecska.u1.players': 'nem json', 'matecska.u1.player.p1': '{"player":{}}' }), 'u1');
    expect(await cache.loadPlayers()).toBeNull();
    expect(await cache.loadState('p1')).toBeNull();
  });
});
