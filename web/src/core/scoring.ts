/** Egy válasz pontszámának összetevői. */
export interface ScoreBreakdown {
  base: number;
  bonus: number;
  penalty: number;
}

export function totalPoints(score: ScoreBreakdown): number {
  return score.base + score.bonus - score.penalty;
}

/** A sebességbónusz időzítése másodpercben: eddig teljes a bónusz, és ekkortól nincs már. */
export interface BonusTiming {
  fullBonusUntil: number;
  noBonusAfter: number;
}

/** Összeadás, kivonás: 3 másodpercig teljes, 10 másodpercre fogy el. */
export const QUICK_TIMING: BonusTiming = { fullBonusUntil: 3, noBonusAfter: 10 };
/** Szorzás, osztás: türelmesebb, 5 másodpercig teljes, 15 másodpercre fogy el. */
export const PATIENT_TIMING: BonusTiming = { fullBonusUntil: 5, noBonusAfter: 15 };

export const BASE_POINTS = 10;
export const MAX_BONUS = 10;
export const WRONG_ANSWER_PENALTY = 5;

/** A még elérhető bónusz aránya 0…1 között; a bónuszcsík ezt rajzolja. */
export function bonusFraction(elapsed: number, timing: BonusTiming): number {
  if (elapsed <= timing.fullBonusUntil) return 1;
  if (elapsed >= timing.noBonusAfter) return 0;
  return 1 - (elapsed - timing.fullBonusUntil) / (timing.noBonusAfter - timing.fullBonusUntil);
}

export function bonus(elapsed: number, timing: BonusTiming): number {
  return Math.round(MAX_BONUS * bonusFraction(elapsed, timing));
}

/**
 * Helyes válasz: alap pont + sebességbónusz.
 * Helytelen válasz: levonás (az alap pont fele).
 */
export function points(correct: boolean, elapsed: number, timing: BonusTiming): ScoreBreakdown {
  if (!correct) return { base: 0, bonus: 0, penalty: WRONG_ANSWER_PENALTY };
  return { base: BASE_POINTS, bonus: bonus(elapsed, timing), penalty: 0 };
}
