import type { MathOperation } from './operation';

/** Egy konkrét feladat: művelet, operandusok és a helyes eredmény. */
export interface Exercise {
  operation: MathOperation;
  operands: readonly [number, number];
  answer: number;
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

function evaluate(operation: MathOperation, a: number, b: number): number {
  switch (operation) {
    case 'addition': return a + b;
    case 'subtraction': return a - b;
    case 'multiplication': return a * b;
    case 'division': return a / b;
  }
}

export function makeExercise(operation: MathOperation, a: number, b: number): Exercise {
  return { operation, operands: [a, b], answer: evaluate(operation, a, b) };
}

/**
 * Véletlen feladat. Minden művelet háromjegyű „fő” számmal dolgozik,
 * a szorzó és az osztó egyjegyű, az osztás maradék nélküli.
 */
export function randomExercise(operation: MathOperation, rng: Rng = Math.random): Exercise {
  switch (operation) {
    case 'addition':
      return makeExercise(operation, randomInt(100, 999, rng), randomInt(100, 999, rng));
    case 'subtraction': {
      const a = randomInt(100, 999, rng);
      return makeExercise(operation, a, randomInt(100, a, rng));
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
