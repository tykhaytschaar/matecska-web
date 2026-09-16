import { MODE_INFO, type MathOperation, type PracticeMode } from './operation';

/** Melyik helyet kell kitölteni: az első vagy a második operandust, vagy az eredményt. */
export type BlankSlot = 'first' | 'second' | 'result';

export const BLANK_SLOTS: readonly BlankSlot[] = ['first', 'second', 'result'];

/**
 * Súlyozott választék: az eredménykeresős feladat 50%, az operandusok 25-25%.
 * Négy elemből választunk egyenletesen, kettő az eredmény.
 */
export const WEIGHTED_BLANK_SLOTS: readonly BlankSlot[] = ['first', 'second', 'result', 'result'];

/**
 * Egy konkrét feladat: gyakorlástípus, művelet, operandusok, a művelet eredménye,
 * az üres hely, és a beírandó válasz (az üres hely értéke).
 */
export interface Exercise {
  mode: PracticeMode;
  operation: MathOperation;
  operands: readonly [number, number];
  result: number;
  blank: BlankSlot;
  answer: number;
}

/** Hány rubrikába kell beírni a választ: az eredménynél a típus rubrikaszáma, operandusnál annak jegyei. */
export function answerCellCount(exercise: Exercise): number {
  if (exercise.blank === 'result') return MODE_INFO[exercise.mode].answerCellCount;
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

function randomBlank(mode: PracticeMode, rng: Rng, askOperands: boolean): BlankSlot {
  if (!MODE_INFO[mode].randomBlank || !askOperands) return 'result';
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

export function makeExercise(mode: PracticeMode, a: number, b: number, blank: BlankSlot = 'result'): Exercise {
  const operation = MODE_INFO[mode].operation;
  const result = evaluate(operation, a, b);
  const answer = blank === 'first' ? a : blank === 'second' ? b : result;
  return { mode, operation, operands: [a, b], result, blank, answer };
}

/**
 * Véletlen feladat. Az írásbeli típusok háromjegyű „fő” számmal dolgoznak, a szorzó és az osztó
 * egyjegyű, az osztás maradék nélküli. Az egyjegyű típusokban egyik operandus és az eredmény sem 1
 * (és nem 0): összeadás 2…9 + 2…9; kivonásnál a kivonandó és a különbség 2…9, a kisebbítendő így
 * 4…18; a szorzótábla és a visszafelé változata (a szorzatot osztjuk egyik tényezőjével) 2…9 közti
 * tényezőkkel.
 * A kétjegyű típusok 10…99 közti számokkal dolgoznak, a kivonás különbsége nemnegatív.
 * Az üres hely akkor véletlen (50% eredmény, 25-25% operandus), ha a típus engedi (`randomBlank`)
 * és a játékos is kéri (`askOperands`); egyébként mindig az eredmény.
 */
export function randomExercise(mode: PracticeMode, rng: Rng = Math.random, askOperands = true): Exercise {
  const blank = randomBlank(mode, rng, askOperands);
  switch (mode) {
    case 'addition-single':
      return makeExercise(mode, randomInt(2, 9, rng), randomInt(2, 9, rng), blank);
    case 'addition-double':
      return makeExercise(mode, randomInt(10, 99, rng), randomInt(10, 99, rng), blank);
    case 'addition-written':
      return makeExercise(mode, randomInt(100, 999, rng), randomInt(100, 999, rng), blank);
    case 'subtraction-single': {
      const subtrahend = randomInt(2, 9, rng);
      const difference = randomInt(2, 9, rng);
      return makeExercise(mode, subtrahend + difference, subtrahend, blank);
    }
    case 'subtraction-double': {
      const a = randomInt(10, 99, rng);
      return makeExercise(mode, a, randomInt(10, a, rng), blank);
    }
    case 'subtraction-written': {
      const a = randomInt(100, 999, rng);
      return makeExercise(mode, a, randomInt(100, a, rng), blank);
    }
    case 'multiplication-table':
      return makeExercise(mode, randomInt(2, 9, rng), randomInt(2, 9, rng), blank);
    case 'multiplication-written':
      return makeExercise(mode, randomInt(100, 999, rng), randomInt(2, 9, rng), blank);
    case 'division-table': {
      const divisor = randomInt(2, 9, rng);
      const quotient = randomInt(2, 9, rng);
      return makeExercise(mode, quotient * divisor, divisor, blank);
    }
    case 'division-written': {
      const divisor = randomInt(2, 9, rng);
      const minQuotient = Math.ceil(100 / divisor);
      const maxQuotient = Math.floor(999 / divisor);
      const quotient = randomInt(minQuotient, maxQuotient, rng);
      return makeExercise(mode, quotient * divisor, divisor, blank);
    }
  }
}
