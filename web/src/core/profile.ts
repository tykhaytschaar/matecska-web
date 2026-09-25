import { CAT, CATALOG, findCharacter, unlockedCharacterIDs, type GameCharacter } from './characters';
import { newId } from './events';
import { isMathOperation, type MathOperation } from './operation';
import { asRecord } from './parse';
import { totalPoints, type ScoreBreakdown } from './scoring';

export interface OperationStats {
  solved: number;
  correct: number;
}

/**
 * Egy játékos adatai. A JSON-séma megegyezik az iOS app profile.json fájljával,
 * hogy a későbbi natív csomagolás és a backend ugyanazt az adatot használja.
 */
export interface PlayerProfile {
  id: string;
  name: string;
  totalPoints: number;
  ownedCharacterIDs: string[];
  selectedCharacterID: string;
  stats: Partial<Record<MathOperation, OperationStats>>;
}

/** Egy válasz hozzáadása a műveletenkénti statisztikához; új objektumot ad vissza. */
export function withAttempt(
  stats: Partial<Record<MathOperation, OperationStats>>,
  operation: MathOperation,
  correct: boolean,
): Partial<Record<MathOperation, OperationStats>> {
  const prev = stats[operation] ?? { solved: 0, correct: 0 };
  return { ...stats, [operation]: { solved: prev.solved + 1, correct: prev.correct + (correct ? 1 : 0) } };
}

/** Óvatos beolvasás JSON-értékből: csak ismert művelet, számszerű `solved` és `correct`. */
export function parseStats(raw: unknown): Partial<Record<MathOperation, OperationStats>> {
  const stats: Partial<Record<MathOperation, OperationStats>> = {};
  const r = asRecord(raw);
  if (!r) return stats;
  for (const [key, value] of Object.entries(r)) {
    const v = asRecord(value);
    if (!isMathOperation(key) || !v) continue;
    if (typeof v.solved === 'number' && typeof v.correct === 'number') {
      stats[key] = { solved: v.solved, correct: v.correct };
    }
  }
  return stats;
}

export function dummyProfile(): PlayerProfile {
  return {
    id: newId(),
    name: 'Játékos',
    totalPoints: 0,
    ownedCharacterIDs: [CAT.id],
    selectedCharacterID: CAT.id,
    stats: {},
  };
}

export function ownsCharacter(profile: PlayerProfile, characterID: string): boolean {
  return profile.ownedCharacterIDs.includes(characterID);
}

export function selectedCharacter(profile: PlayerProfile, catalog: readonly GameCharacter[] = CATALOG): GameCharacter {
  return findCharacter(profile.selectedCharacterID, catalog) ?? CAT;
}

/** Egy beküldött válasz pontjának és statisztikájának könyvelése. Az összpont nem megy nulla alá. */
export function recordScore(
  profile: PlayerProfile,
  score: ScoreBreakdown,
  correct: boolean,
  operation: MathOperation,
): PlayerProfile {
  const total = Math.max(0, profile.totalPoints + totalPoints(score));
  return {
    ...profile,
    totalPoints: total,
    ownedCharacterIDs: unlockedCharacterIDs(total),
    stats: withAttempt(profile.stats, operation, correct),
  };
}

/** A műveletenkénti statisztika törlése; a pontok és a karakterek maradnak. */
export function resetStats(profile: PlayerProfile): PlayerProfile {
  return { ...profile, stats: {} };
}

export function selectCharacter(profile: PlayerProfile, character: GameCharacter): PlayerProfile {
  if (!ownsCharacter(profile, character.id)) return profile;
  return { ...profile, selectedCharacterID: character.id };
}

/** Óvatos beolvasás: hibás vagy hiányos adatnál `null`. */
export function parseProfile(json: string): PlayerProfile | null {
  try {
    const r = asRecord(JSON.parse(json));
    if (!r) return null;
    if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.totalPoints !== 'number') return null;
    if (!Array.isArray(r.ownedCharacterIDs) || typeof r.selectedCharacterID !== 'string') return null;
    return {
      id: r.id,
      name: r.name,
      totalPoints: Math.max(0, Math.floor(r.totalPoints)),
      ownedCharacterIDs: r.ownedCharacterIDs.filter((id): id is string => typeof id === 'string'),
      selectedCharacterID: r.selectedCharacterID,
      stats: parseStats(r.stats),
    };
  } catch {
    return null;
  }
}

export function serializeProfile(profile: PlayerProfile): string {
  return JSON.stringify(profile, null, 2);
}
