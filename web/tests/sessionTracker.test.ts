import { describe, expect, it } from 'vitest';
import { markHidden, markVisible, SESSION_GAP_MS, startTracker, touch } from '../src/core/sessionTracker';

const MIN = 60_000;

describe('munkamenet-követő', () => {
  it('rövid háttérbe kerülés nem szakítja meg, 5 perc igen', () => {
    const t0 = startTracker(0, 's1');
    const short = markVisible(markHidden(t0, 1000), 1000 + 2 * MIN);
    expect(short.id).toBe('s1');
    expect(short.hiddenSince).toBeNull();
    const long = markVisible(markHidden(t0, 1000), 1000 + SESSION_GAP_MS);
    expect(long.id).not.toBe('s1');
    expect(long.lastActivity).toBeNull();
  });

  it('tétlenség: 5 percen belüli válaszok egy munkamenet, utána új', () => {
    let t = touch(startTracker(0, 's1'), 10_000);
    t = touch(t, 10_000 + 4 * MIN);
    expect(t.id).toBe('s1');
    t = touch(t, 10_000 + 4 * MIN + SESSION_GAP_MS);
    expect(t.id).not.toBe('s1');
    expect(t.lastActivity).toBe(10_000 + 4 * MIN + SESSION_GAP_MS);
  });

  it('ismételt elrejtés nem írja felül az első elrejtés idejét', () => {
    const t = markHidden(markHidden(startTracker(0, 's1'), 500), 900);
    expect(t.hiddenSince).toBe(500);
    expect(markVisible(startTracker(0, 's1'), 5).id).toBe('s1');
  });
});
