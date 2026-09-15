import { describe, expect, it } from 'vitest';
import { OPERATION_INFO } from '../src/core/operation';
import { bonusFraction, PATIENT_TIMING, points, QUICK_TIMING, totalPoints } from '../src/core/scoring';

describe('pontozás', () => {
  it.each([
    [0, 20], [3, 20], [6.5, 15], [10, 10], [15, 10],
  ])('összeadás/kivonás: %s mp után %s pont', (elapsed, expected) => {
    const s = points(true, elapsed, QUICK_TIMING);
    expect(s.base).toBe(10);
    expect(s.penalty).toBe(0);
    expect(totalPoints(s)).toBe(expected);
  });

  it.each([
    [0, 20], [5, 20], [10, 15], [15, 10], [20, 10],
  ])('szorzás/osztás: %s mp után %s pont', (elapsed, expected) => {
    expect(totalPoints(points(true, elapsed, PATIENT_TIMING))).toBe(expected);
  });

  it('a műveletek a megfelelő időzítést kapják', () => {
    expect(OPERATION_INFO.addition.bonusTiming).toBe(QUICK_TIMING);
    expect(OPERATION_INFO.subtraction.bonusTiming).toBe(QUICK_TIMING);
    expect(OPERATION_INFO.multiplication.bonusTiming).toBe(PATIENT_TIMING);
    expect(OPERATION_INFO.division.bonusTiming).toBe(PATIENT_TIMING);
  });

  it('helytelen válasz: levonás, nincs alap és bónusz', () => {
    const s = points(false, 1, QUICK_TIMING);
    expect(s).toEqual({ base: 0, bonus: 0, penalty: 5 });
    expect(totalPoints(s)).toBe(-5);
  });

  it('a bónuszarány 1-ről 0-ra csökken a teljes és a nulla időpont között', () => {
    expect(bonusFraction(0, QUICK_TIMING)).toBe(1);
    expect(bonusFraction(3, QUICK_TIMING)).toBe(1);
    expect(bonusFraction(6.5, QUICK_TIMING)).toBeCloseTo(0.5);
    expect(bonusFraction(10, QUICK_TIMING)).toBe(0);
    expect(bonusFraction(4, PATIENT_TIMING)).toBe(1);
    expect(bonusFraction(10, PATIENT_TIMING)).toBeCloseTo(0.5);
    expect(bonusFraction(99, PATIENT_TIMING)).toBe(0);
  });
});
