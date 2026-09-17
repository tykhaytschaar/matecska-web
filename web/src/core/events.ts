import type { BlankSlot } from './exercise';
import { MODE_INFO, type MathOperation, type PracticeMode } from './operation';
import type { PlayerProfile } from './profile';
import { totalPoints, type ScoreBreakdown } from './scoring';

/**
 * A játékos eseményei. Ezek kerülnek a szerverre; a pont, a statisztika és a
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
  /** A megszerzett gyorsasági bónusz (helyes válasznál); a statisztika átlagolja. Régi soroknál hiányzik. */
  bonus?: number;
  /** A munkamenet azonosítója (5 perc szünet vagy játékosváltás után új); régi soroknál hiányzik. */
  sessionId?: string;
  /** A feladat részletei a későbbi visszanézéshez; régi soroknál hiányoznak. */
  detail?: AttemptDetail;
  createdAt: string;
}

export interface AttemptDetail {
  operands: readonly [number, number];
  blank: BlankSlot;
  /** A beírt válasz. */
  given: number;
  /** A feladat megjelenésétől a beküldésig eltelt idő, ezredmásodpercben. */
  elapsedMs: number;
}

export type PlayerEvent = AttemptEvent;
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
  extra: { sessionId?: string; detail?: AttemptDetail } = {},
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
    bonus: correct ? score.bonus : 0,
    ...(extra.sessionId ? { sessionId: extra.sessionId } : {}),
    ...(extra.detail ? { detail: extra.detail } : {}),
    createdAt: now.toISOString(),
  };
}
