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

/** Összeadás, kivonás: 3 másodpercig teljes, utána másodpercenként eggyel kevesebb. */
export const QUICK_TIMING: BonusTiming = { fullBonusUntil: 3, decayIntervalMs: DEFAULT_DECAY_INTERVAL_MS };
/** Szorzás, osztás: türelmesebb, 5 másodpercig teljes, utána másodpercenként eggyel kevesebb. */
export const PATIENT_TIMING: BonusTiming = { fullBonusUntil: 5, decayIntervalMs: DEFAULT_DECAY_INTERVAL_MS };

export const BASE_POINTS = 10;
export const MAX_BONUS = 10;
export const WRONG_ANSWER_PENALTY = 1;

/** A még járó bónusz pontban: teljes, majd periódusonként eggyel kevesebb. */
export function bonus(elapsed: number, timing: BonusTiming): number {
  const overtimeMs = Math.max(0, elapsed - timing.fullBonusUntil) * 1000;
  const lostPoints = Math.floor(overtimeMs / timing.decayIntervalMs);
  return Math.max(0, MAX_BONUS - lostPoints);
}

/** A még elérhető bónusz aránya 0…1 között; a bónuszcsík ezt rajzolja. */
export function bonusFraction(elapsed: number, timing: BonusTiming): number {
  return bonus(elapsed, timing) / MAX_BONUS;
}

/**
 * Helyes válasz: alap pont + sebességbónusz.
 * Helytelen válasz: 1 pont levonás.
 */
export function points(correct: boolean, elapsed: number, timing: BonusTiming): ScoreBreakdown {
  if (!correct) return { base: 0, bonus: 0, penalty: WRONG_ANSWER_PENALTY };
  return { base: BASE_POINTS, bonus: bonus(elapsed, timing), penalty: 0 };
}
