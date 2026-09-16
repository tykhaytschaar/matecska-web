import { describe, expect, it } from 'vitest';
import { MODE_INFO } from '../src/core/operation';
import { bonus, bonusFraction, INSTANT_TIMING, PATIENT_TIMING, points, QUICK_TIMING, totalPoints, type BonusTiming } from '../src/core/scoring';

describe('pontozás', () => {
  it.each([
    [0, 20], [3, 20], [3.9, 20], [4, 19], [4.99, 19], [5, 18], [10, 13], [12, 11], [13, 10], [20, 10],
  ])('összeadás/kivonás: %s mp után %s pont', (elapsed, expected) => {
    const s = points(true, elapsed, QUICK_TIMING);
    expect(s.base).toBe(10);
    expect(s.penalty).toBe(0);
    expect(totalPoints(s)).toBe(expected);
  });

  it.each([
    [0, 20], [5, 20], [5.5, 20], [6, 19], [10, 15], [12.7, 13], [15, 10], [20, 10],
  ])('szorzás/osztás: %s mp után %s pont', (elapsed, expected) => {
    expect(totalPoints(points(true, elapsed, PATIENT_TIMING))).toBe(expected);
  });

  it('a periódus hossza állítható: 500 ms-onként eggyel csökken', () => {
    const fast: BonusTiming = { fullBonusUntil: 2, decayIntervalMs: 500 };
    expect(bonus(2, fast)).toBe(10);
    expect(bonus(2.4, fast)).toBe(10);
    expect(bonus(2.5, fast)).toBe(9);
    expect(bonus(3, fast)).toBe(8);
    expect(bonus(7, fast)).toBe(0);
    expect(bonus(60, fast)).toBe(0);
  });

  it.each([
    [0, 20], [0.5, 20], [1, 19], [2.9, 18], [5, 15], [9.99, 11], [10, 10], [20, 10],
  ])('egyjegyű feladatok: %s mp után %s pont, nincs türelmi idő', (elapsed, expected) => {
    expect(totalPoints(points(true, elapsed, INSTANT_TIMING))).toBe(expected);
  });

  it('a gyakorlástípusok a megfelelő időzítést kapják, 1000 ms-os alapperiódussal', () => {
    expect(MODE_INFO['addition-single'].bonusTiming).toBe(INSTANT_TIMING);
    expect(MODE_INFO['subtraction-single'].bonusTiming).toBe(INSTANT_TIMING);
    expect(MODE_INFO['multiplication-table'].bonusTiming).toBe(INSTANT_TIMING);
    expect(MODE_INFO['division-table'].bonusTiming).toBe(INSTANT_TIMING);
    expect(MODE_INFO['addition-written'].bonusTiming).toBe(QUICK_TIMING);
    expect(MODE_INFO['subtraction-written'].bonusTiming).toBe(QUICK_TIMING);
    expect(MODE_INFO['multiplication-written'].bonusTiming).toBe(PATIENT_TIMING);
    expect(MODE_INFO['division-written'].bonusTiming).toBe(PATIENT_TIMING);
    expect(INSTANT_TIMING.fullBonusUntil).toBe(0);
    expect(INSTANT_TIMING.decayIntervalMs).toBe(1000);
    expect(QUICK_TIMING.decayIntervalMs).toBe(1000);
    expect(PATIENT_TIMING.decayIntervalMs).toBe(1000);
  });

  it('helytelen válasz: levonás, nincs alap és bónusz', () => {
    const s = points(false, 1, QUICK_TIMING);
    expect(s).toEqual({ base: 0, bonus: 0, penalty: 1 });
    expect(totalPoints(s)).toBe(-1);
  });

  it('a bónuszarány a bónusz tizede, lépcsőzve', () => {
    expect(bonusFraction(0, QUICK_TIMING)).toBe(1);
    expect(bonusFraction(3.99, QUICK_TIMING)).toBe(1);
    expect(bonusFraction(4, QUICK_TIMING)).toBeCloseTo(0.9);
    expect(bonusFraction(8, QUICK_TIMING)).toBeCloseTo(0.5);
    expect(bonusFraction(13, QUICK_TIMING)).toBe(0);
    expect(bonusFraction(10, PATIENT_TIMING)).toBeCloseTo(0.5);
    expect(bonusFraction(99, PATIENT_TIMING)).toBe(0);
  });
});
