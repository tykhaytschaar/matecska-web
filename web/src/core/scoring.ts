/** Egy válasz pontszámának összetevői. */
export interface ScoreBreakdown {
  base: number;
  bonus: number;
  penalty: number;
}

export function totalPoints(score: ScoreBreakdown): number {
  return score.base + score.bonus - score.penalty;
}

/**
 * A sebességbónusz időzítése.
 * `fullBonusUntil` másodpercig a teljes bónusz jár, utána minden `decayIntervalMs`
 * milliszekundumos periódusban pontosan eggyel csökken, nulláig.
 * A periódus később szintek szerint változhat.
 */
export interface BonusTiming {
  fullBonusUntil: number;
  decayIntervalMs: number;
}

export const DEFAULT_DECAY_INTERVAL_MS = 1000;

/** Egyjegyű, fejben számolós feladatok: 1 másodperc türelmi idő, utána másodpercenként eggyel kevesebb. */
export const INSTANT_TIMING: BonusTiming = { fullBonusUntil: 1, decayIntervalMs: DEFAULT_DECAY_INTERVAL_MS };
/** Írásbeli összeadás, kivonás: 3 másodpercig teljes, utána másodpercenként eggyel kevesebb. */
export const QUICK_TIMING: BonusTiming = { fullBonusUntil: 3, decayIntervalMs: DEFAULT_DECAY_INTERVAL_MS };
/** Írásbeli szorzás, osztás: türelmesebb, 5 másodpercig teljes, utána másodpercenként eggyel kevesebb. */
export const PATIENT_TIMING: BonusTiming = { fullBonusUntil: 5, decayIntervalMs: DEFAULT_DECAY_INTERVAL_MS };

/** Alappont a háromjegyű típusoknál; a többi típus a saját `basePoints` értékét adja át. */
export const BASE_POINTS = 10;
/** A bónusz maximuma a típus alappontja; ez a háromjegyű alap. */
export const MAX_BONUS = BASE_POINTS;
export const WRONG_ANSWER_PENALTY = 1;
/** Vegyes (operandust is kérdező) gyakorlásnál a bónusz ennyiszer lassabban fogy. */
export const MIXED_SLOWDOWN = 1.5;

/** Az időzítés lassítása: a fogyás periódusa `factor`-szorosára nő. */
export function scaledTiming(timing: BonusTiming, factor: number): BonusTiming {
  return { ...timing, decayIntervalMs: timing.decayIntervalMs * factor };
}

/** A még járó bónusz pontban: `max` (a típus alappontja), majd periódusonként eggyel kevesebb. */
export function bonus(elapsed: number, timing: BonusTiming, max: number = MAX_BONUS): number {
  const overtimeMs = Math.max(0, elapsed - timing.fullBonusUntil) * 1000;
  const lostPoints = Math.floor(overtimeMs / timing.decayIntervalMs);
  return Math.max(0, max - lostPoints);
}

/** A még elérhető bónusz aránya 0…1 között; a bónuszcsík ezt rajzolja. */
export function bonusFraction(elapsed: number, timing: BonusTiming, max: number = MAX_BONUS): number {
  return bonus(elapsed, timing, max) / max;
}

/**
 * Helyes válasz: a típus alappontja + ugyanannyi maximumú sebességbónusz.
 * Helytelen válasz: 1 pont levonás.
 */
export function points(correct: boolean, elapsed: number, timing: BonusTiming, base: number = BASE_POINTS): ScoreBreakdown {
  if (!correct) return { base: 0, bonus: 0, penalty: WRONG_ANSWER_PENALTY };
  return { base, bonus: bonus(elapsed, timing, base), penalty: 0 };
}
