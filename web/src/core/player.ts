import { CAT, findCharacter } from './characters';
import type { PlayerEvent } from './events';
import { isMathOperation, type MathOperation } from './operation';
import type { OperationStats, PlayerProfile } from './profile';

/** Egy gyerek sora a szerveren. */
export interface PlayerRecord {
  id: string;
  name: string;
  selectedCharacterID: string;
  /** A fiók előtti, készüléken gyűjtött adatok egyszeri átvétele; egyébként `null`. */
  imported: ImportedProfile | null;
  createdAt: string;
}

export interface ImportedProfile {
  totalPoints: number;
  stats: Partial<Record<MathOperation, OperationStats>>;
  ownedCharacterIDs: string[];
}

/** A szerver összesítése a gyerek eseménynaplójából (`player_summaries` nézet). */
export interface PlayerSummary {
  /** Válaszokért kapott pont mínusz a vásárlások ára. */
  pointsDelta: number;
  stats: Partial<Record<MathOperation, OperationStats>>;
  purchasedCharacterIDs: string[];
}

export const EMPTY_SUMMARY: PlayerSummary = { pointsDelta: 0, stats: {}, purchasedCharacterIDs: [] };

/**
 * A gyerek helyi állapota: a szerverről ismert sor és összesítés, plusz a még fel nem
 * töltött események. A képernyőkön látott profil ebből számolódik.
 */
export interface PlayerState {
  player: PlayerRecord;
  summary: PlayerSummary;
  pending: PlayerEvent[];
  /** Igaz, ha a `player` sor helyben módosult és még nem került fel. */
  dirty: boolean;
}

export function freshState(player: PlayerRecord, summary: PlayerSummary = EMPTY_SUMMARY): PlayerState {
  return { player, summary, pending: [], dirty: false };
}

function addStats(
  into: Partial<Record<MathOperation, OperationStats>>,
  from: Partial<Record<MathOperation, OperationStats>>,
): void {
  for (const [key, value] of Object.entries(from)) {
    if (!isMathOperation(key) || !value) continue;
    const prev = into[key] ?? { solved: 0, correct: 0 };
    into[key] = { solved: prev.solved + value.solved, correct: prev.correct + value.correct };
  }
}

/** Az összesítésből, az átvett adatból és a függő eseményekből a megjelenített profil. */
export function buildProfile(state: PlayerState): PlayerProfile {
  const { player, summary, pending } = state;
  const stats: PlayerProfile['stats'] = {};
  const owned = new Set<string>([CAT.id]);
  let points = 0;

  if (player.imported) {
    points += player.imported.totalPoints;
    addStats(stats, player.imported.stats);
    player.imported.ownedCharacterIDs.forEach((id) => owned.add(id));
  }
  points += summary.pointsDelta;
  addStats(stats, summary.stats);
  summary.purchasedCharacterIDs.forEach((id) => owned.add(id));

  for (const event of pending) {
    if (event.kind === 'attempt') {
      points += event.points;
      const prev = stats[event.operation] ?? { solved: 0, correct: 0 };
      stats[event.operation] = { solved: prev.solved + 1, correct: prev.correct + (event.correct ? 1 : 0) };
    } else {
      points -= event.price;
      owned.add(event.characterId);
    }
  }

  const selected = owned.has(player.selectedCharacterID) && findCharacter(player.selectedCharacterID)
    ? player.selectedCharacterID
    : CAT.id;
  return {
    id: player.id,
    name: player.name,
    totalPoints: Math.max(0, points),
    ownedCharacterIDs: [...owned],
    selectedCharacterID: selected,
    stats,
  };
}

/** A fiók nélküli helyi profilból átvehető adat; `null`, ha nincs mit átvenni. */
export function importFrom(profile: PlayerProfile): ImportedProfile | null {
  const hasStats = Object.values(profile.stats).some((s) => s && s.solved > 0);
  const hasCharacters = profile.ownedCharacterIDs.some((id) => id !== CAT.id);
  if (profile.totalPoints <= 0 && !hasStats && !hasCharacters) return null;
  return {
    totalPoints: profile.totalPoints,
    stats: profile.stats,
    ownedCharacterIDs: profile.ownedCharacterIDs,
  };
}

/** Óvatos beolvasás JSON-értékből (szerver `imported` oszlop vagy helyi gyorstár). */
export function parseImported(raw: unknown): ImportedProfile | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.totalPoints !== 'number') return null;
  return {
    totalPoints: Math.max(0, Math.floor(r.totalPoints)),
    stats: parseStats(r.stats),
    ownedCharacterIDs: Array.isArray(r.ownedCharacterIDs)
      ? r.ownedCharacterIDs.filter((id): id is string => typeof id === 'string')
      : [],
  };
}

export function parseStats(raw: unknown): Partial<Record<MathOperation, OperationStats>> {
  const stats: Partial<Record<MathOperation, OperationStats>> = {};
  if (typeof raw !== 'object' || raw === null) return stats;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isMathOperation(key) || typeof value !== 'object' || value === null) continue;
    const v = value as Record<string, unknown>;
    if (typeof v.solved === 'number' && typeof v.correct === 'number') {
      stats[key] = { solved: Number(v.solved), correct: Number(v.correct) };
    }
  }
  return stats;
}
