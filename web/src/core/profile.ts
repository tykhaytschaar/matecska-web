import { CAT, findCharacter, unlockedCharacterIDs, type GameCharacter } from './characters';
import { isMathOperation, type MathOperation } from './operation';
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

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function dummyProfile(): PlayerProfile {
  return {
    id: uuid(),
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

export function selectedCharacter(profile: PlayerProfile): GameCharacter {
  return findCharacter(profile.selectedCharacterID) ?? CAT;
}

/** Egy beküldött válasz pontjának és statisztikájának könyvelése. Az összpont nem megy nulla alá. */
export function recordScore(
  profile: PlayerProfile,
  score: ScoreBreakdown,
  correct: boolean,
  operation: MathOperation,
): PlayerProfile {
  const previous = profile.stats[operation] ?? { solved: 0, correct: 0 };
  const total = Math.max(0, profile.totalPoints + totalPoints(score));
  return {
    ...profile,
    totalPoints: total,
    ownedCharacterIDs: unlockedCharacterIDs(total),
    stats: {
      ...profile.stats,
      [operation]: { solved: previous.solved + 1, correct: previous.correct + (correct ? 1 : 0) },
    },
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
    const raw: unknown = JSON.parse(json);
    if (typeof raw !== 'object' || raw === null) return null;
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.totalPoints !== 'number') return null;
    if (!Array.isArray(r.ownedCharacterIDs) || typeof r.selectedCharacterID !== 'string') return null;
    const stats: PlayerProfile['stats'] = {};
    if (typeof r.stats === 'object' && r.stats !== null) {
      for (const [key, value] of Object.entries(r.stats as Record<string, unknown>)) {
        if (!isMathOperation(key) || typeof value !== 'object' || value === null) continue;
        const v = value as Record<string, unknown>;
        if (typeof v.solved === 'number' && typeof v.correct === 'number') {
          stats[key] = { solved: v.solved, correct: v.correct };
        }
      }
    }
    return {
      id: r.id,
      name: r.name,
      totalPoints: Math.max(0, Math.floor(r.totalPoints)),
      ownedCharacterIDs: r.ownedCharacterIDs.filter((id): id is string => typeof id === 'string'),
      selectedCharacterID: r.selectedCharacterID,
      stats,
    };
  } catch {
    return null;
  }
}

export function serializeProfile(profile: PlayerProfile): string {
  return JSON.stringify(profile, null, 2);
}
