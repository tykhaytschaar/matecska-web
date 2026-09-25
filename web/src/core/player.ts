import { CAT, CATALOG, findCharacter, unlockedCharacterIDs, type GameCharacter } from './characters';
import type { PlayerEvent } from './events';
import { isMathOperation, type MathOperation } from './operation';
import { asRecord } from './parse';
import { parseStats, withAttempt, type OperationStats, type PlayerProfile } from './profile';

/** Egy játékos sora a szerveren. */
export interface PlayerRecord {
  id: string;
  name: string;
  selectedCharacterID: string;
  /** A fiók előtti, készüléken gyűjtött adatok egyszeri átvétele; egyébként `null`. */
  imported: ImportedProfile | null;
  /** Fejlesztői módban beállított pontkorrekció; a pont ennyivel tér el a válaszok összegétől. */
  pointAdjustment: number;
  /** Kérdezhet-e a feladat operandusra is (vegyes), vagy mindig az eredményt kérdezi. */
  askOperands: boolean;
  createdAt: string;
}

export interface ImportedProfile {
  totalPoints: number;
  stats: Partial<Record<MathOperation, OperationStats>>;
  ownedCharacterIDs: string[];
}

/** A szerver összesítése a játékos eseménynaplójából (`player_summaries` nézet). */
export interface PlayerSummary {
  /** A válaszokért kapott pontok összege. */
  pointsDelta: number;
  stats: Partial<Record<MathOperation, OperationStats>>;
}

export const EMPTY_SUMMARY: PlayerSummary = { pointsDelta: 0, stats: {} };

/**
 * A játékos helyi állapota: a szerverről ismert sor és összesítés, plusz a még fel nem
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
export function buildProfile(state: PlayerState, catalog: readonly GameCharacter[] = CATALOG): PlayerProfile {
  const { player, summary, pending } = state;
  let stats: PlayerProfile['stats'] = {};
  let points = 0;

  if (player.imported) {
    points += player.imported.totalPoints;
    addStats(stats, player.imported.stats);
  }
  points += summary.pointsDelta + player.pointAdjustment;
  addStats(stats, summary.stats);

  for (const event of pending) {
    points += event.points;
    stats = withAttempt(stats, event.operation, event.correct);
  }

  // A karakterek pontküszöbre oldódnak fel, a pont nem fogy: a birtoklás az összpontból következik.
  const total = Math.max(0, points);
  const owned = unlockedCharacterIDs(total, catalog);
  const selected = owned.includes(player.selectedCharacterID) && findCharacter(player.selectedCharacterID, catalog)
    ? player.selectedCharacterID
    : CAT.id;
  return {
    id: player.id,
    name: player.name,
    totalPoints: total,
    ownedCharacterIDs: owned,
    selectedCharacterID: selected,
    stats,
  };
}

/** A fiók nélküli helyi profilból átvehető adat; `null`, ha nincs mit átvenni. */
export function importFrom(profile: PlayerProfile): ImportedProfile | null {
  const hasStats = Object.values(profile.stats).some((s) => s && s.solved > 0);
  if (profile.totalPoints <= 0 && !hasStats) return null;
  return {
    totalPoints: profile.totalPoints,
    stats: profile.stats,
    ownedCharacterIDs: profile.ownedCharacterIDs,
  };
}

/** Óvatos beolvasás JSON-értékből (szerver `imported` oszlop vagy helyi gyorstár). */
export function parseImported(raw: unknown): ImportedProfile | null {
  const r = asRecord(raw);
  if (!r || typeof r.totalPoints !== 'number') return null;
  return {
    totalPoints: Math.max(0, Math.floor(r.totalPoints)),
    stats: parseStats(r.stats),
    ownedCharacterIDs: Array.isArray(r.ownedCharacterIDs)
      ? r.ownedCharacterIDs.filter((id): id is string => typeof id === 'string')
      : [],
  };
}
