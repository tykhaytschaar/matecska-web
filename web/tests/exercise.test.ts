import { describe, expect, it } from 'vitest';
import { randomExercise, seededRng } from '../src/core/exercise';
import { OPERATION_INFO, OPERATIONS } from '../src/core/operation';

describe('feladatgenerátorok', () => {
  it('összeadás: két háromjegyű, az eredmény négy rubrikába fér', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('addition', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(100); expect(b).toBeLessThanOrEqual(999);
      expect(e.answer).toBe(a + b);
      expect(e.answer).toBeLessThan(10_000);
    }
  });

  it('kivonás: eredmény nemnegatív, három rubrika', () => {
    const rng = seededRng(2);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('subtraction', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(100); expect(b).toBeLessThanOrEqual(a);
      expect(e.answer).toBe(a - b);
      expect(e.answer).toBeGreaterThanOrEqual(0); expect(e.answer).toBeLessThan(1000);
    }
  });

  it('szorzás egyjegyűvel: szorzó 2…9, eredmény négy rubrikába fér', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('multiplication', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(2); expect(b).toBeLessThanOrEqual(9);
      expect(e.answer).toBe(a * b);
      expect(e.answer).toBeLessThan(10_000);
    }
  });

  it('osztás egyjegyűvel: háromjegyű osztandó, maradék nélkül, három rubrika', () => {
    const rng = seededRng(4);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('division', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(2); expect(b).toBeLessThanOrEqual(9);
      expect(a % b).toBe(0);
      expect(e.answer).toBe(a / b);
      expect(e.answer).toBeLessThan(1000);
    }
  });

  it('a válasz mindig belefér a művelet rubrikaszámába', () => {
    const rng = seededRng(5);
    for (const op of OPERATIONS) {
      for (let i = 0; i < 500; i++) {
        const e = randomExercise(op, rng);
        expect(String(e.answer).length).toBeLessThanOrEqual(OPERATION_INFO[op].answerCellCount);
      }
    }
  });
});
