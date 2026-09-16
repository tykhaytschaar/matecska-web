import type { GameCharacter } from './characters';
import { MODE_INFO, type MathOperation, type PracticeMode } from './operation';
import type { PlayerProfile } from './profile';
import { totalPoints, type ScoreBreakdown } from './scoring';

/**
 * A gyerek játékának eseményei. Ezek kerülnek a szerverre; a pont, a statisztika és a
 * karakterek ebből számolódnak. Az azonosítót a kliens adja, így az újraküldés ártalmatlan.
 */
export interface AttemptEvent {
  kind: 'attempt';
  id: string;
  playerId: string;
  operation: MathOperation;
  mode: PracticeMode;
  correct: boolean;
  /** A ténylegesen könyvelt pontváltozás: nulla pontnál a levonás 0. */
  points: number;
  createdAt: string;
}

export interface PurchaseEvent {
  kind: 'purchase';
  id: string;
  playerId: string;
  characterId: string;
  price: number;
  createdAt: string;
}

export type PlayerEvent = AttemptEvent | PurchaseEvent;

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Egy beküldött válasz eseménye; a pontot a profil mostani állásához csonkolja. */
export function attemptEvent(
  profile: PlayerProfile,
  score: ScoreBreakdown,
  correct: boolean,
  mode: PracticeMode,
  now: Date = new Date(),
): AttemptEvent {
  const applied = Math.max(0, profile.totalPoints + totalPoints(score)) - profile.totalPoints;
  return {
    kind: 'attempt',
    id: newId(),
    playerId: profile.id,
    operation: MODE_INFO[mode].operation,
    mode,
    correct,
    points: applied,
    createdAt: now.toISOString(),
  };
}

export function purchaseEvent(profile: PlayerProfile, character: GameCharacter, now: Date = new Date()): PurchaseEvent {
  return {
    kind: 'purchase',
    id: newId(),
    playerId: profile.id,
    characterId: character.id,
    price: character.price,
    createdAt: now.toISOString(),
  };
}
