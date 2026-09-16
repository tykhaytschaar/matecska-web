import { describe, expect, it } from 'vitest';
import { answerCellCount, makeExercise, randomExercise, seededRng } from '../src/core/exercise';
import { MODE_INFO, modesOf, OPERATIONS, PRACTICE_MODES } from '../src/core/operation';

describe('feladatgenerátorok', () => {
  it('írásbeli összeadás: két háromjegyű, az eredmény négy rubrikába fér', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('addition-written', rng);
      const [a, b] = e.operands;
      expect(e.operation).toBe('addition');
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(100); expect(b).toBeLessThanOrEqual(999);
      expect(e.result).toBe(a + b);
      expect(e.result).toBeLessThan(10_000);
    }
  });

  it('írásbeli kivonás: eredmény nemnegatív, három rubrika', () => {
    const rng = seededRng(2);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('subtraction-written', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(100); expect(b).toBeLessThanOrEqual(a);
      expect(e.result).toBe(a - b);
      expect(e.result).toBeGreaterThanOrEqual(0); expect(e.result).toBeLessThan(1000);
    }
  });

  it('egyjegyű összeadás: 2…9 + 2…9, az összeg két rubrikába fér', () => {
    const rng = seededRng(11);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('addition-single', rng);
      const [a, b] = e.operands;
      expect(e.operation).toBe('addition');
      expect(a).toBeGreaterThanOrEqual(2); expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(2); expect(b).toBeLessThanOrEqual(9);
      expect(e.result).toBe(a + b);
      expect(e.result).toBeLessThanOrEqual(18);
    }
  });

  it('egyjegyű kivonás: a kivonandó és a különbség 2…9, a kisebbítendő 4…18', () => {
    const rng = seededRng(14);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('subtraction-single', rng);
      const [a, b] = e.operands;
      expect(e.operation).toBe('subtraction');
      expect(b).toBeGreaterThanOrEqual(2); expect(b).toBeLessThanOrEqual(9);
      expect(e.result).toBe(a - b);
      expect(e.result).toBeGreaterThanOrEqual(2); expect(e.result).toBeLessThanOrEqual(9);
      expect(a).toBeGreaterThanOrEqual(4); expect(a).toBeLessThanOrEqual(18);
    }
  });

  it('egyjegyű típusok: egyik operandus és az eredmény sem 1 vagy 0', () => {
    const rng = seededRng(15);
    for (const mode of ['addition-single', 'subtraction-single', 'multiplication-table', 'division-table'] as const) {
      for (let i = 0; i < 1000; i++) {
        const e = randomExercise(mode, rng);
        for (const value of [...e.operands, e.result]) expect(value).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('szorzótábla: 2…9 · 2…9, az 1-es sor kimarad', () => {
    const rng = seededRng(12);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('multiplication-table', rng);
      const [a, b] = e.operands;
      expect(e.operation).toBe('multiplication');
      expect(a).toBeGreaterThanOrEqual(2); expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(2); expect(b).toBeLessThanOrEqual(9);
      expect(e.result).toBe(a * b);
      expect(e.result).toBeLessThanOrEqual(81);
    }
  });

  it('szorzótábla visszafelé: az osztandó két 2…9 közti szám szorzata, az osztó és a hányados is 2…9', () => {
    const rng = seededRng(13);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('division-table', rng);
      const [a, b] = e.operands;
      expect(e.operation).toBe('division');
      expect(b).toBeGreaterThanOrEqual(2); expect(b).toBeLessThanOrEqual(9);
      expect(a % b).toBe(0);
      expect(e.result).toBe(a / b);
      expect(e.result).toBeGreaterThanOrEqual(2); expect(e.result).toBeLessThanOrEqual(9);
      expect(a).toBeLessThanOrEqual(81);
    }
  });

  it.each(PRACTICE_MODES.filter((mode) => MODE_INFO[mode].randomBlank))(
    '%s: az üres hely 50% eredmény, 25-25% operandus',
    (mode) => {
      const rng = seededRng(7);
      const seen = { first: 0, second: 0, result: 0 };
      const N = 4000;
      for (let i = 0; i < N; i++) {
        const e = randomExercise(mode, rng);
        seen[e.blank]++;
        const expected = e.blank === 'first' ? e.operands[0] : e.blank === 'second' ? e.operands[1] : e.result;
        expect(e.answer).toBe(expected);
        expect(answerCellCount(e)).toBe(e.blank === 'result' ? MODE_INFO[mode].answerCellCount : String(e.answer).length);
        expect(String(e.answer).length).toBeLessThanOrEqual(answerCellCount(e));
      }
      // ±4 százalékpont tűrés a seedelt mintán
      expect(seen.result / N).toBeGreaterThan(0.46); expect(seen.result / N).toBeLessThan(0.54);
      expect(seen.first / N).toBeGreaterThan(0.21); expect(seen.first / N).toBeLessThan(0.29);
      expect(seen.second / N).toBeGreaterThan(0.21); expect(seen.second / N).toBeLessThan(0.29);
    },
  );

  it.each(['multiplication-written', 'division-written'] as const)('%s: mindig az eredmény az üres hely', (mode) => {
    const rng = seededRng(8);
    for (let i = 0; i < 200; i++) expect(randomExercise(mode, rng).blank).toBe('result');
  });

  it('makeExercise: az üres hely szerint a válasz az operandus vagy az eredmény', () => {
    expect(makeExercise('addition-written', 352, 636).answer).toBe(988);
    expect(makeExercise('addition-written', 352, 636, 'first').answer).toBe(352);
    expect(makeExercise('subtraction-written', 805, 347, 'second').answer).toBe(347);
    expect(makeExercise('subtraction-written', 805, 347, 'second').result).toBe(458);
    expect(makeExercise('division-table', 42, 6, 'first').answer).toBe(42);
    expect(makeExercise('multiplication-table', 6, 7, 'second')).toMatchObject({ operation: 'multiplication', result: 42, answer: 7 });
  });

  it('írásbeli szorzás egyjegyűvel: szorzó 2…9, eredmény négy rubrikába fér', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('multiplication-written', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(2); expect(b).toBeLessThanOrEqual(9);
      expect(e.answer).toBe(a * b);
      expect(e.answer).toBeLessThan(10_000);
    }
  });

  it('írásbeli osztás egyjegyűvel: háromjegyű osztandó, maradék nélkül, három rubrika', () => {
    const rng = seededRng(4);
    for (let i = 0; i < 1000; i++) {
      const e = randomExercise('division-written', rng);
      const [a, b] = e.operands;
      expect(a).toBeGreaterThanOrEqual(100); expect(a).toBeLessThanOrEqual(999);
      expect(b).toBeGreaterThanOrEqual(2); expect(b).toBeLessThanOrEqual(9);
      expect(a % b).toBe(0);
      expect(e.answer).toBe(a / b);
      expect(e.answer).toBeLessThan(1000);
    }
  });

  it('a válasz mindig belefér a rubrikaszámba, és a feladat művelete a típus műveletével egyezik', () => {
    const rng = seededRng(5);
    for (const mode of PRACTICE_MODES) {
      for (let i = 0; i < 500; i++) {
        const e = randomExercise(mode, rng);
        expect(e.mode).toBe(mode);
        expect(e.operation).toBe(MODE_INFO[mode].operation);
        expect(String(e.answer).length).toBeLessThanOrEqual(answerCellCount(e));
      }
    }
  });

  it('alkategóriák: minden műveletnek egyjegyű és írásbeli változata van', () => {
    expect(modesOf('addition')).toEqual(['addition-single', 'addition-written']);
    expect(modesOf('subtraction')).toEqual(['subtraction-single', 'subtraction-written']);
    expect(modesOf('multiplication')).toEqual(['multiplication-table', 'multiplication-written']);
    expect(modesOf('division')).toEqual(['division-table', 'division-written']);
    expect(OPERATIONS.flatMap(modesOf)).toEqual(PRACTICE_MODES);
  });
});
