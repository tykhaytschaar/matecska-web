import type { AttemptEvent } from './events';
import { MODE_INFO, OPERATIONS, PRACTICE_MODES, type MathOperation, type PracticeMode } from './operation';

/** Egy alkategória összesítése egy időszakra. A bónusz csak azoknál a soroknál gyűlik, ahol el van tárolva. */
export interface ModeStats {
  mode: PracticeMode;
  solved: number;
  correct: number;
  bonusSum: number;
  bonusCount: number;
}

export type StatsPeriod = 'day' | 'month' | 'all';

export const PERIOD_LABEL: Record<StatsPeriod, string> = { day: 'Ma', month: 'Ebben a hónapban', all: 'Összesen' };

/** Az időszak kezdete helyi időben; `null` = minden. */
export function periodStart(period: StatsPeriod, now: Date = new Date()): Date | null {
  if (period === 'day') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

export function emptyModeStats(mode: PracticeMode): ModeStats {
  return { mode, solved: 0, correct: 0, bonusSum: 0, bonusCount: 0 };
}

/** Helyi (még fel nem töltött) válaszok összesítése módonként, az időszak kezdetétől. */
export function aggregateEvents(events: readonly AttemptEvent[], since: Date | null): ModeStats[] {
  const byMode = new Map<PracticeMode, ModeStats>();
  for (const e of events) {
    if (since && new Date(e.createdAt) < since) continue;
    const s = byMode.get(e.mode) ?? emptyModeStats(e.mode);
    s.solved += 1;
    if (e.correct) {
      s.correct += 1;
      if (typeof e.bonus === 'number') {
        s.bonusSum += e.bonus;
        s.bonusCount += 1;
      }
    }
    byMode.set(e.mode, s);
  }
  return [...byMode.values()];
}

/** Két összesítés (szerver + helyi) összege módonként. */
export function mergeModeStats(...lists: readonly (readonly ModeStats[])[]): ModeStats[] {
  const byMode = new Map<PracticeMode, ModeStats>();
  for (const list of lists) {
    for (const s of list) {
      const acc = byMode.get(s.mode) ?? emptyModeStats(s.mode);
      acc.solved += s.solved;
      acc.correct += s.correct;
      acc.bonusSum += s.bonusSum;
      acc.bonusCount += s.bonusCount;
      byMode.set(s.mode, acc);
    }
  }
  return [...byMode.values()];
}

/** Helyes válaszok aránya százalékban, egészre kerekítve; `null`, ha nincs megoldott feladat. */
export function correctRatio(s: { solved: number; correct: number }): number | null {
  return s.solved > 0 ? Math.round((s.correct / s.solved) * 100) : null;
}

/** Átlagos bónusz egy tizedesre; `null`, ha nincs bónusszal rögzített helyes válasz. */
export function averageBonus(s: { bonusSum: number; bonusCount: number }): number | null {
  return s.bonusCount > 0 ? Math.round((s.bonusSum / s.bonusCount) * 10) / 10 : null;
}

export interface OperationStatsGroup {
  operation: MathOperation;
  /** A művelet összes módjának összege. */
  total: { solved: number; correct: number; bonusSum: number; bonusCount: number };
  modes: ModeStats[];
}

/**
 * Megjelenítési csoportosítás: műveletenként az összes, alatta a módok a katalógus sorrendjében.
 * Minden módnak van sora (0-kal is), hogy a lista stabil legyen az időszakok közt.
 */
export function groupByOperation(stats: readonly ModeStats[]): OperationStatsGroup[] {
  const byMode = new Map(stats.map((s) => [s.mode, s]));
  return OPERATIONS.map((operation) => {
    const modes = PRACTICE_MODES.filter((m) => MODE_INFO[m].operation === operation).map((m) => byMode.get(m) ?? emptyModeStats(m));
    const total = modes.reduce(
      (acc, s) => ({ solved: acc.solved + s.solved, correct: acc.correct + s.correct, bonusSum: acc.bonusSum + s.bonusSum, bonusCount: acc.bonusCount + s.bonusCount }),
      { solved: 0, correct: 0, bonusSum: 0, bonusCount: 0 },
    );
    return { operation, total, modes };
  });
}
