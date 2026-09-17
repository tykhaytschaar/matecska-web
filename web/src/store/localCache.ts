import type { PlayerEvent } from '../core/events';
import { EMPTY_SUMMARY, parseImported, parseStats, type PlayerRecord, type PlayerState, type PlayerSummary } from '../core/player';
import { parseProfile, type PlayerProfile } from '../core/profile';
import type { PlayerListing } from './backend';
import { LEGACY_PROFILE_KEY, type KeyValueStorage } from './storage';

/**
 * A szülő fiókjához tartozó helyi gyorstár: a játékoslista és játékosonként az állapot a
 * függő eseményekkel. Felhasználónként külön kulcsok, hogy egy készüléken több fiók se
 * lásson át egymásba. Az app net nélkül ebből dolgozik.
 */
export class LocalCache {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly userId: string,
  ) {}

  private key(suffix: string): string {
    return `matecska.${this.userId}.${suffix}`;
  }

  async loadPlayers(): Promise<PlayerListing[] | null> {
    const json = await this.storage.get(this.key('players'));
    if (!json) return null;
    try {
      const raw: unknown = JSON.parse(json);
      if (!Array.isArray(raw)) return null;
      return raw.map(parseListing).filter((l): l is PlayerListing => l !== null);
    } catch {
      return null;
    }
  }

  async savePlayers(players: PlayerListing[]): Promise<void> {
    await this.storage.set(this.key('players'), JSON.stringify(players));
  }

  async loadActiveId(): Promise<string | null> {
    return this.storage.get(this.key('active'));
  }

  async saveActiveId(id: string | null): Promise<void> {
    if (id) await this.storage.set(this.key('active'), id);
    else await this.storage.remove(this.key('active'));
  }

  async loadState(playerId: string): Promise<PlayerState | null> {
    const json = await this.storage.get(this.key(`player.${playerId}`));
    if (!json) return null;
    try {
      return parseState(JSON.parse(json));
    } catch {
      return null;
    }
  }

  async saveState(state: PlayerState): Promise<void> {
    await this.storage.set(this.key(`player.${state.player.id}`), JSON.stringify(state));
  }

  async removeState(playerId: string): Promise<void> {
    await this.storage.remove(this.key(`player.${playerId}`));
  }

  /** Kijelentkezésnél minden, ami ehhez a fiókhoz tartozott. */
  async clear(playerIds: string[]): Promise<void> {
    await Promise.all([
      this.storage.remove(this.key('players')),
      this.storage.remove(this.key('active')),
      ...playerIds.map((id) => this.removeState(id)),
    ]);
  }
}

/** A fiók előtti egyprofilos változat mentése, ha van a készüléken. */
export async function loadLegacyProfile(storage: KeyValueStorage): Promise<PlayerProfile | null> {
  const json = await storage.get(LEGACY_PROFILE_KEY);
  return json ? parseProfile(json) : null;
}

export async function removeLegacyProfile(storage: KeyValueStorage): Promise<void> {
  await storage.remove(LEGACY_PROFILE_KEY);
}

function parseRecord(raw: unknown): PlayerRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string') return null;
  return {
    id: r.id,
    name: r.name,
    selectedCharacterID: typeof r.selectedCharacterID === 'string' ? r.selectedCharacterID : 'cat',
    imported: parseImported(r.imported),
    pointAdjustment: typeof r.pointAdjustment === 'number' ? r.pointAdjustment : 0,
    askOperands: r.askOperands === true,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : '',
  };
}

function parseSummary(raw: unknown): PlayerSummary {
  if (typeof raw !== 'object' || raw === null) return EMPTY_SUMMARY;
  const r = raw as Record<string, unknown>;
  return {
    pointsDelta: typeof r.pointsDelta === 'number' ? r.pointsDelta : 0,
    stats: parseStats(r.stats),
  };
}

function parseListing(raw: unknown): PlayerListing | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const player = parseRecord(r.player);
  return player ? { player, summary: parseSummary(r.summary) } : null;
}

function isDetail(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const d = raw as Record<string, unknown>;
  const task = d.task as Record<string, unknown> | undefined;
  const answer = d.answer as Record<string, unknown> | undefined;
  return typeof d.elapsedMs === 'number' && typeof task?.kind === 'string' && typeof answer?.kind === 'string';
}

function isEvent(raw: unknown): raw is PlayerEvent {
  if (typeof raw !== 'object' || raw === null) return false;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.playerId !== 'string' || typeof r.createdAt !== 'string') return false;
  if (r.kind !== 'attempt') return false;
  if (r.bonus !== undefined && typeof r.bonus !== 'number') return false;
  if (r.sessionId !== undefined && typeof r.sessionId !== 'string') return false;
  if (r.detail !== undefined && !isDetail(r.detail)) return false;
  return typeof r.operation === 'string' && typeof r.mode === 'string' && typeof r.correct === 'boolean' && typeof r.points === 'number';
}

function parseState(raw: unknown): PlayerState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const player = parseRecord(r.player);
  if (!player) return null;
  return {
    player,
    summary: parseSummary(r.summary),
    pending: Array.isArray(r.pending) ? r.pending.filter(isEvent) : [],
    dirty: r.dirty === true,
  };
}
