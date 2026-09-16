import { describe, expect, it } from 'vitest';
import { MODE_INFO } from '../src/core/operation';
import { bonus, bonusFraction, INSTANT_TIMING, MIXED_SLOWDOWN, PATIENT_TIMING, points, QUICK_TIMING, scaledTiming, totalPoints, type BonusTiming } from '../src/core/scoring';

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
    [0, 20], [0.5, 20], [1, 20], [1.9, 20], [2, 19], [3.9, 18], [6, 15], [10.99, 11], [11, 10], [20, 10],
  ])('egyjegyű feladatok: %s mp után %s pont, 1 mp türelmi idő', (elapsed, expected) => {
    expect(totalPoints(points(true, elapsed, INSTANT_TIMING))).toBe(expected);
  });

  it('az alappont a típus számjegyszáma szerint 3, 6, 10, és a bónusz ugyanonnan indul', () => {
    expect(MODE_INFO['addition-single'].basePoints).toBe(3);
    expect(MODE_INFO['subtraction-single'].basePoints).toBe(3);
    expect(MODE_INFO['addition-double'].basePoints).toBe(6);
    expect(MODE_INFO['subtraction-double'].basePoints).toBe(6);
    expect(MODE_INFO['multiplication-table'].basePoints).toBe(6);
    expect(MODE_INFO['division-table'].basePoints).toBe(6);
    expect(MODE_INFO['addition-written'].basePoints).toBe(10);
    expect(MODE_INFO['division-written'].basePoints).toBe(10);
    expect(points(true, 0, INSTANT_TIMING, 3)).toEqual({ base: 3, bonus: 3, penalty: 0 });
    expect(totalPoints(points(true, 1.9, INSTANT_TIMING, 3))).toBe(6);
    expect(totalPoints(points(true, 3, INSTANT_TIMING, 3))).toBe(4);
    expect(totalPoints(points(true, 4, INSTANT_TIMING, 3))).toBe(3);
    expect(bonusFraction(2.5, INSTANT_TIMING, 6)).toBeCloseTo(5 / 6);
  });

  it('a lassított időzítésnél a periódus 1,5-szeres, a türelmi idő nem változik', () => {
    const slow = scaledTiming(QUICK_TIMING, MIXED_SLOWDOWN);
    expect(slow.fullBonusUntil).toBe(3);
    expect(slow.decayIntervalMs).toBe(1500);
    expect(bonus(4.4, slow, 6)).toBe(6);
    expect(bonus(4.5, slow, 6)).toBe(5);
    expect(bonus(4.5, QUICK_TIMING, 6)).toBe(5);
    expect(bonus(6, QUICK_TIMING, 6)).toBe(3);
    expect(bonus(6, slow, 6)).toBe(4);
  });

  it('a gyakorlástípusok a megfelelő időzítést kapják, 1000 ms-os alapperiódussal', () => {
    expect(MODE_INFO['addition-single'].bonusTiming).toBe(INSTANT_TIMING);
    expect(MODE_INFO['subtraction-single'].bonusTiming).toBe(INSTANT_TIMING);
    expect(MODE_INFO['multiplication-table'].bonusTiming).toBe(INSTANT_TIMING);
    expect(MODE_INFO['division-table'].bonusTiming).toBe(INSTANT_TIMING);
    expect(MODE_INFO['addition-double'].bonusTiming).toBe(QUICK_TIMING);
    expect(MODE_INFO['subtraction-double'].bonusTiming).toBe(QUICK_TIMING);
    expect(MODE_INFO['addition-written'].bonusTiming).toBe(QUICK_TIMING);
    expect(MODE_INFO['subtraction-written'].bonusTiming).toBe(QUICK_TIMING);
    expect(MODE_INFO['multiplication-written'].bonusTiming).toBe(PATIENT_TIMING);
    expect(MODE_INFO['division-written'].bonusTiming).toBe(PATIENT_TIMING);
    expect(INSTANT_TIMING.fullBonusUntil).toBe(1);
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
