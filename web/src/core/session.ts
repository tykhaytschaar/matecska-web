import { answerCellCount, randomExercise, type Exercise } from './exercise';
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
/** Egy kijelölt maradék-rubrika az osztás segédrácsában. */
export interface ScratchSelection {
  row: number;
  col: number;
}

export interface SessionState {
  operation: MathOperation;
  exercise: Exercise;
  /** A 0. index a bal szélső, az utolsó a jobb szélső (egyes helyiérték). */
  cells: readonly (number | null)[];
  selectedIndex: number;
  /**
   * Nem kötelező segédrács a maradékok nyomon követésére (csak osztásnál): annyi sor, ahány
   * jegyű a hányados, annyi oszlop, ahány jegyű az osztandó. A beküldést és a pontozást nem érinti.
   */
  scratch: readonly (readonly (number | null)[])[];
  /** Ha nem `null`, a billentyűzet a segédrácsba ír, nem a válasz rubrikáiba. */
  scratchSelection: ScratchSelection | null;
  outcome: Outcome | null;
  startedAt: number;
  submittedAt: number | null;
}

export function cellCount(state: SessionState): number {
  return state.cells.length;
}

function startIndex(operation: MathOperation, count: number): number {
  return OPERATION_INFO[operation].entryDirection === 'ltr' ? 0 : count - 1;
}

function emptyScratch(exercise: Exercise): (number | null)[][] {
  if (exercise.operation !== 'division') return [];
  const rows = String(exercise.answer).length;
  const cols = String(exercise.operands[0]).length;
  return Array.from({ length: rows }, () => Array<number | null>(cols).fill(null));
}

export function createSession(operation: MathOperation, now: number, exercise?: Exercise): SessionState {
  const current = exercise ?? randomExercise(operation);
  const count = answerCellCount(current);
  return {
    operation,
    exercise: current,
    cells: Array<number | null>(count).fill(null),
    selectedIndex: startIndex(operation, count),
    scratch: emptyScratch(current),
    scratchSelection: null,
    outcome: null,
    startedAt: now,
    submittedAt: null,
  };
}

export function isSubmitted(state: SessionState): boolean {
  return state.outcome !== null;
}

/**
 * Érvényes a bevitel, ha van legalább egy számjegy, és az üres rubrikák nem két számjegy
 * között vannak: `15_` és `__1` jó, `4_5` és `___` nem.
 */
export function isValidEntry(cells: readonly (number | null)[]): boolean {
  const first = cells.findIndex((cell) => cell !== null);
  if (first === -1) return false;
  const last = cells.length - 1 - [...cells].reverse().findIndex((cell) => cell !== null);
  return cells.slice(first, last + 1).every((cell) => cell !== null);
}

export function canSubmit(state: SessionState): boolean {
  return !isSubmitted(state) && isValidEntry(state.cells);
}

/** A beírt számjegyekből képzett szám; az üres rubrikákat kihagyjuk. */
export function enteredValue(state: SessionState): number {
  return state.cells.reduce<number>((acc, cell) => (cell === null ? acc : acc * 10 + cell), 0);
}

/** A feladat megjelenése óta eltelt idő (beküldés után rögzül). */
export function elapsedSeconds(state: SessionState, now: number): number {
  return (state.submittedAt ?? now) - state.startedAt;
}

export function selectCell(state: SessionState, index: number): SessionState {
  if (isSubmitted(state) || index < 0 || index >= state.cells.length) return state;
  return { ...state, selectedIndex: index, scratchSelection: null };
}

export function selectScratch(state: SessionState, row: number, col: number): SessionState {
  if (isSubmitted(state) || row < 0 || row >= state.scratch.length) return state;
  if (col < 0 || col >= state.scratch[row].length) return state;
  return { ...state, scratchSelection: { row, col } };
}

function writeScratch(state: SessionState, sel: ScratchSelection, value: number | null, moveTo: number): SessionState {
  const scratch = state.scratch.map((r) => [...r]);
  scratch[sel.row][sel.col] = value;
  const col = Math.min(scratch[sel.row].length - 1, Math.max(0, moveTo));
  return { ...state, scratch, scratchSelection: { row: sel.row, col } };
}

/**
 * Beírja a számjegyet a kijelölt rubrikába, és a művelet irányában lép a következőre.
 * A segédrácsban balról jobbra halad, a sor végén megáll.
 */
export function enterDigit(state: SessionState, digit: number): SessionState {
  if (isSubmitted(state) || !Number.isInteger(digit) || digit < 0 || digit > 9) return state;
  if (state.scratchSelection) {
    return writeScratch(state, state.scratchSelection, digit, state.scratchSelection.col + 1);
  }
  const cells = [...state.cells];
  cells[state.selectedIndex] = digit;
  const step = OPERATION_INFO[state.operation].entryDirection === 'ltr' ? 1 : -1;
  const next = Math.min(cells.length - 1, Math.max(0, state.selectedIndex + step));
  return { ...state, cells, selectedIndex: next };
}

/** Törli a kijelölt rubrikát; ha az már üres, az előzőleg kitöltött irányban lévő szomszédot törli és oda lép. */
export function deleteDigit(state: SessionState): SessionState {
  if (isSubmitted(state)) return state;
  if (state.scratchSelection) {
    const sel = state.scratchSelection;
    const target = state.scratch[sel.row][sel.col] === null && sel.col > 0 ? { row: sel.row, col: sel.col - 1 } : sel;
    return writeScratch(state, target, null, target.col);
  }
  const back = OPERATION_INFO[state.operation].entryDirection === 'ltr' ? -1 : 1;
  let index = state.selectedIndex;
  const neighbour = index + back;
  if (state.cells[index] === null && neighbour >= 0 && neighbour < state.cells.length) index = neighbour;
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
