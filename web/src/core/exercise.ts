import { OPERATION_INFO, type MathOperation } from './operation';

/** Melyik helyet kell kitölteni: az első vagy a második operandust, vagy az eredményt. */
export type BlankSlot = 'first' | 'second' | 'result';

export const BLANK_SLOTS: readonly BlankSlot[] = ['first', 'second', 'result'];

/**
 * Súlyozott választék: az eredménykeresős feladat 50%, az operandusok 25-25%.
 * Négy elemből választunk egyenletesen, kettő az eredmény.
 */
export const WEIGHTED_BLANK_SLOTS: readonly BlankSlot[] = ['first', 'second', 'result', 'result'];

/**
 * Egy konkrét feladat: művelet, operandusok, a művelet eredménye, az üres hely,
 * és a beírandó válasz (az üres hely értéke).
 */
export interface Exercise {
  operation: MathOperation;
  operands: readonly [number, number];
  result: number;
  blank: BlankSlot;
  answer: number;
}

/** Hány rubrikába kell beírni a választ: az eredménynél a művelet rubrikaszáma, operandusnál annak jegyei. */
export function answerCellCount(exercise: Exercise): number {
  if (exercise.blank === 'result') return OPERATION_INFO[exercise.operation].answerCellCount;
  return String(exercise.answer).length;
}

/** Véletlenszám-forrás a [0, 1) tartományban; tesztben seedelhető. */
export type Rng = () => number;

export function randomInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Determinisztikus generátor (mulberry32), tesztekhez. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBlank(rng: Rng): BlankSlot {
  return WEIGHTED_BLANK_SLOTS[randomInt(0, WEIGHTED_BLANK_SLOTS.length - 1, rng)];
}

function evaluate(operation: MathOperation, a: number, b: number): number {
  switch (operation) {
    case 'addition': return a + b;
    case 'subtraction': return a - b;
    case 'multiplication': return a * b;
    case 'division': return a / b;
  }
}

export function makeExercise(operation: MathOperation, a: number, b: number, blank: BlankSlot = 'result'): Exercise {
  const result = evaluate(operation, a, b);
  const answer = blank === 'first' ? a : blank === 'second' ? b : result;
  return { operation, operands: [a, b], result, blank, answer };
}

/**
 * Véletlen feladat. Minden művelet háromjegyű „fő” számmal dolgozik,
 * a szorzó és az osztó egyjegyű, az osztás maradék nélküli.
 * Összeadásnál és kivonásnál véletlen az üres hely: 50% eredmény, 25-25% valamelyik operandus;
 * szorzásnál és osztásnál mindig az eredmény.
 */
export function randomExercise(operation: MathOperation, rng: Rng = Math.random): Exercise {
  switch (operation) {
    case 'addition':
      return makeExercise(operation, randomInt(100, 999, rng), randomInt(100, 999, rng), randomBlank(rng));
    case 'subtraction': {
      const a = randomInt(100, 999, rng);
      return makeExercise(operation, a, randomInt(100, a, rng), randomBlank(rng));
    }
    case 'multiplication':
      return makeExercise(operation, randomInt(100, 999, rng), randomInt(2, 9, rng));
    case 'division': {
      const divisor = randomInt(2, 9, rng);
      const minQuotient = Math.ceil(100 / divisor);
      const maxQuotient = Math.floor(999 / divisor);
      const quotient = randomInt(minQuotient, maxQuotient, rng);
      return makeExercise(operation, quotient * divisor, divisor);
    }
  }
}
