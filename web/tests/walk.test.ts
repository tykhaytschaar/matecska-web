import { describe, expect, it } from 'vitest';
import { advanceWalk, isResting, startWalk, type WalkConfig } from '../src/core/walk';

const cfg: WalkConfig = { speed: 10, pause: 1 };

function run(dtTotal: number, step = 0.05, maxX = 20) {
  let s = startWalk();
  const trace: number[] = [];
  for (let t = 0; t < dtTotal; t += step) {
    s = advanceWalk(s, step, maxX, cfg);
    trace.push(s.x);
  }
  return { s, trace };
}

describe('séta a két szél közt', () => {
  it('jobbra indul, egyenletesen halad', () => {
    let s = startWalk();
    s = advanceWalk(s, 0.5, 20, cfg);
    expect(s.x).toBeCloseTo(5);
    expect(s.direction).toBe(1);
    expect(isResting(s)).toBe(false);
  });

  it('a szélén megáll, kivárja a szünetet, aztán visszafordul', () => {
    let s = startWalk(19);
    s = advanceWalk(s, 0.2, 20, cfg);
    expect(s.x).toBe(20);
    expect(isResting(s)).toBe(true);
    s = advanceWalk(s, 0.5, 20, cfg);
    expect(isResting(s)).toBe(true);
    expect(s.direction).toBe(1);
    s = advanceWalk(s, 0.6, 20, cfg);
    expect(isResting(s)).toBe(false);
    expect(s.direction).toBe(-1);
    s = advanceWalk(s, 0.5, 20, cfg);
    expect(s.x).toBeCloseTo(15);
  });

  it('a bal szélen is megáll és visszafordul; hosszabb futásban a sávban marad', () => {
    const { trace } = run(12);
    expect(Math.min(...trace)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...trace)).toBeLessThanOrEqual(20);
    expect(trace.some((x) => x === 0)).toBe(true);
    expect(trace.some((x) => x === 20)).toBe(true);
  });

  it('induláskor a bal szél nem állítja meg, nulla vagy negatív lépésnél sem', () => {
    let s = advanceWalk(startWalk(), 0, 20, cfg);
    expect(isResting(s)).toBe(false);
    s = advanceWalk(s, -0.01, 20, cfg);
    expect(isResting(s)).toBe(false);
    expect(s.x).toBe(0);
    s = advanceWalk(s, 0.1, 20, cfg);
    expect(s.x).toBeCloseTo(1);
  });

  it('a kockánál keskenyebb sávban áll', () => {
    const s = advanceWalk(startWalk(3), 1, 0, cfg);
    expect(s.x).toBe(0);
  });
});
