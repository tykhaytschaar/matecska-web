import { PATIENT_TIMING, QUICK_TIMING, type BonusTiming } from './scoring';

/** A gyakorolható írásbeli alapműveletek. Az azonosítók megegyeznek az iOS app JSON-kulcsaival. */
export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export const OPERATIONS: readonly MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division'];

/** A feladat elrendezése a képernyőn. */
export type ProblemLayout =
  /** Két operandus egymás alatt, vonal, alatta a rubrikák (összeadás, kivonás). */
  | 'stacked'
  /** `352 · 6` egy sorban, vonal, alatta a rubrikák (szorzás). */
  | 'productRow'
  /** `456 : 8 =` és a rubrikák ugyanabban a sorban (osztás). */
  | 'equationRow';

export interface OperationInfo {
  title: string;
  /** Magyar iskolai jelölés: a szorzás pont, az osztás kettőspont. */
  symbol: string;
  layout: ProblemLayout;
  /** Hány rubrikába kell beírni a választ. */
  answerCellCount: number;
  bonusTiming: BonusTiming;
}

export const OPERATION_INFO: Record<MathOperation, OperationInfo> = {
  addition: { title: 'Összeadás', symbol: '+', layout: 'stacked', answerCellCount: 4, bonusTiming: QUICK_TIMING },
  subtraction: { title: 'Kivonás', symbol: '−', layout: 'stacked', answerCellCount: 3, bonusTiming: QUICK_TIMING },
  multiplication: { title: 'Szorzás', symbol: '·', layout: 'productRow', answerCellCount: 4, bonusTiming: PATIENT_TIMING },
  division: { title: 'Osztás', symbol: ':', layout: 'equationRow', answerCellCount: 3, bonusTiming: PATIENT_TIMING },
};

export function isMathOperation(value: unknown): value is MathOperation {
  return typeof value === 'string' && (OPERATIONS as readonly string[]).includes(value);
}
