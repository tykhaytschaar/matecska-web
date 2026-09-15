import { randomExercise, type Exercise } from './exercise';
import { OPERATION_INFO, type MathOperation } from './operation';
import { points, type ScoreBreakdown } from './scoring';

export type Outcome =
  | { kind: 'correct'; score: ScoreBreakdown }
  | { kind: 'wrong'; correctAnswer: number; score: ScoreBreakdown };

/**
 * Egy gyakorlás állapota: az aktuális feladat, a beírt számjegyek, a kijelölt rubrika,
 * az indulás ideje és a beküldés eredménye. Minden művelet új állapotot ad vissza,
 * így a Svelte reaktivitás egyszerű újra-hozzárendeléssel működik.
 * Az idők másodpercben, egy tetszőleges monoton órából.
 */
export interface SessionState {
  operation: MathOperation;
  exercise: Exercise;
  /** A 0. index a bal szélső, az utolsó a jobb szélső (egyes helyiérték). */
  cells: readonly (number | null)[];
  selectedIndex: number;
  outcome: Outcome | null;
  startedAt: number;
  submittedAt: number | null;
}

export function cellCount(state: SessionState): number {
  return OPERATION_INFO[state.operation].answerCellCount;
}

export function createSession(operation: MathOperation, now: number, exercise?: Exercise): SessionState {
  const count = OPERATION_INFO[operation].answerCellCount;
  return {
    operation,
    exercise: exercise ?? randomExercise(operation),
    cells: Array<number | null>(count).fill(null),
    selectedIndex: count - 1,
    outcome: null,
    startedAt: now,
    submittedAt: null,
  };
}

export function isSubmitted(state: SessionState): boolean {
  return state.outcome !== null;
}

/** A bal szélső rubrika üresen maradhat (ha az eredmény rövidebb), a többit ki kell tölteni. */
export function canSubmit(state: SessionState): boolean {
  return !isSubmitted(state) && state.cells.slice(1).every((cell) => cell !== null);
}

/** A beírt számjegyekből képzett szám; az üres rubrika nullának számít. */
export function enteredValue(state: SessionState): number {
  return state.cells.reduce<number>((acc, cell) => acc * 10 + (cell ?? 0), 0);
}

/** A feladat megjelenése óta eltelt idő (beküldés után rögzül). */
export function elapsedSeconds(state: SessionState, now: number): number {
  return (state.submittedAt ?? now) - state.startedAt;
}

export function selectCell(state: SessionState, index: number): SessionState {
  if (isSubmitted(state) || index < 0 || index >= state.cells.length) return state;
  return { ...state, selectedIndex: index };
}

/** Beírja a számjegyet a kijelölt rubrikába, és balra lép a következőre. */
export function enterDigit(state: SessionState, digit: number): SessionState {
  if (isSubmitted(state) || !Number.isInteger(digit) || digit < 0 || digit > 9) return state;
  const cells = [...state.cells];
  cells[state.selectedIndex] = digit;
  return { ...state, cells, selectedIndex: Math.max(0, state.selectedIndex - 1) };
}

/** Törli a kijelölt rubrikát; ha az már üres, az eggyel jobbra lévőt törli és oda lép. */
export function deleteDigit(state: SessionState): SessionState {
  if (isSubmitted(state)) return state;
  let index = state.selectedIndex;
  if (state.cells[index] === null && index < state.cells.length - 1) index += 1;
  const cells = [...state.cells];
  cells[index] = null;
  return { ...state, cells, selectedIndex: index };
}

export function submit(state: SessionState, now: number): SessionState {
  if (!canSubmit(state)) return state;
  const correct = enteredValue(state) === state.exercise.answer;
  const score = points(correct, now - state.startedAt, OPERATION_INFO[state.operation].bonusTiming);
  const outcome: Outcome = correct
    ? { kind: 'correct', score }
    : { kind: 'wrong', correctAnswer: state.exercise.answer, score };
  return { ...state, outcome, submittedAt: now };
}

export function nextExercise(state: SessionState, now: number, exercise?: Exercise): SessionState {
  return createSession(state.operation, now, exercise);
}
