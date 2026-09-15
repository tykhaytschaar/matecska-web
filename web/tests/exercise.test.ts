import { describe, expect, it } from 'vitest';
import { answerCellCount, makeExercise, randomExercise, seededRng } from '../src/core/exercise';
import { OPERATION_INFO, OPERATIONS } from '../src/core/operation';

describe('feladatgenerátorok', () => {
  it('összeadás: két háromjegyű, az eredmény négy rubrikába fér', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('addition', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(100); expect(b).toBeLessThanOrEqual(999);
      expect(e.result).toBe(a + b);
      expect(e.result).toBeLessThan(10_000);
    }
  });

  it('kivonás: eredmény nemnegatív, három rubrika', () => {
    const rng = seededRng(2);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('subtraction', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(100); expect(b).toBeLessThanOrEqual(a);
      expect(e.result).toBe(a - b);
      expect(e.result).toBeGreaterThanOrEqual(0); expect(e.result).toBeLessThan(1000);
    }
  });

  it.each(['addition', 'subtraction'] as const)('%s: az üres hely 50% eredmény, 25-25% operandus', (op) => {
    const rng = seededRng(7);
    const seen = { first: 0, second: 0, result: 0 };
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const e = randomExercise(op, rng);
      seen[e.blank]++;
      const expected = e.blank === 'first' ? e.operands[0] : e.blank === 'second' ? e.operands[1] : e.result;
      expect(e.answer).toBe(expected);
      expect(answerCellCount(e)).toBe(e.blank === 'result' ? OPERATION_INFO[op].answerCellCount : 3);
      expect(String(e.answer).length).toBeLessThanOrEqual(answerCellCount(e));
    }
    // ±4 százalékpont tűrés a seedelt mintán
    expect(seen.result / N).toBeGreaterThan(0.46); expect(seen.result / N).toBeLessThan(0.54);
    expect(seen.first / N).toBeGreaterThan(0.21); expect(seen.first / N).toBeLessThan(0.29);
    expect(seen.second / N).toBeGreaterThan(0.21); expect(seen.second / N).toBeLessThan(0.29);
  });

  it.each(['multiplication', 'division'] as const)('%s: mindig az eredmény az üres hely', (op) => {
    const rng = seededRng(8);
    for (let i = 0; i < 200; i++) expect(randomExercise(op, rng).blank).toBe('result');
  });

  it('makeExercise: az üres hely szerint a válasz az operandus vagy az eredmény', () => {
    expect(makeExercise('addition', 352, 636).answer).toBe(988);
    expect(makeExercise('addition', 352, 636, 'first').answer).toBe(352);
    expect(makeExercise('subtraction', 805, 347, 'second').answer).toBe(347);
    expect(makeExercise('subtraction', 805, 347, 'second').result).toBe(458);
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
        expect(String(e.answer).length).toBeLessThanOrEqual(answerCellCount(e));
      }
    }
  });
});
