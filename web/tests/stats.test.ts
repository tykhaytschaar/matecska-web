import { describe, expect, it } from 'vitest';
import type { AttemptEvent } from '../src/core/events';
import { aggregateEvents, averageBonus, correctRatio, groupByOperation, localSessionIds, mergeModeStats, periodStart } from '../src/core/stats';

const at = (iso: string, mode: AttemptEvent['mode'], correct: boolean, bonus?: number): AttemptEvent => ({
  kind: 'attempt', id: iso + mode, playerId: 'p1', operation: mode.startsWith('addition') ? 'addition' : 'division', mode, correct, points: correct ? 6 + (bonus ?? 0) : 0, bonus, createdAt: iso,
});

describe('statisztika', () => {
  it('időszak kezdete helyi időben: nap, hónap, minden', () => {
    const now = new Date(2026, 8, 17, 14, 30);
    expect(periodStart('day', now)).toEqual(new Date(2026, 8, 17));
    expect(periodStart('month', now)).toEqual(new Date(2026, 8, 1));
    expect(periodStart('all', now)).toBeNull();
  });

  it('helyi események összesítése módonként, az időszaktól; a bónusz csak helyes és rögzített soroknál', () => {
    const events = [
      at('2026-09-17T10:00:00Z', 'addition-double', true, 4),
      at('2026-09-17T10:01:00Z', 'addition-double', true, 2),
      at('2026-09-17T10:02:00Z', 'addition-double', false, 0),
      at('2026-09-16T10:00:00Z', 'addition-double', true, 6),
      at('2026-09-17T10:03:00Z', 'division-table', true), // régi sor, bónusz nélkül
    ];
    const since = new Date('2026-09-17T00:00:00Z');
    const stats = aggregateEvents(events, since);
    const add = stats.find((s) => s.mode === 'addition-double')!;
    expect(add).toEqual({ mode: 'addition-double', solved: 3, correct: 2, bonusSum: 6, bonusCount: 2 });
    expect(averageBonus(add)).toBe(3);
    expect(correctRatio(add)).toBe(67);
    const div = stats.find((s) => s.mode === 'division-table')!;
    expect(div.bonusCount).toBe(0);
    expect(averageBonus(div)).toBeNull();
    expect(aggregateEvents(events, null).find((s) => s.mode === 'addition-double')!.solved).toBe(4);
  });

  it('helyi munkamenet-azonosítók az időszaktól, egyszer', () => {
    const events = [
      { ...at('2026-09-17T10:00:00Z', 'addition-single', true, 1), sessionId: 'a' },
      { ...at('2026-09-17T10:01:00Z', 'addition-single', true, 1), sessionId: 'a' },
      { ...at('2026-09-17T11:00:00Z', 'addition-single', true, 1), sessionId: 'b' },
      { ...at('2026-09-16T10:00:00Z', 'addition-single', true, 1), sessionId: 'c' },
      at('2026-09-17T12:00:00Z', 'addition-single', true, 1), // régi sor, munkamenet nélkül
    ];
    expect(localSessionIds(events, new Date('2026-09-17T00:00:00Z')).sort()).toEqual(['a', 'b']);
    expect(localSessionIds(events, null)).toHaveLength(3);
  });

  it('szerver és helyi összesítés összeadódik', () => {
    const merged = mergeModeStats(
      [{ mode: 'addition-single', solved: 10, correct: 8, bonusSum: 16, bonusCount: 8 }],
      [{ mode: 'addition-single', solved: 2, correct: 2, bonusSum: 6, bonusCount: 2 }, { mode: 'subtraction-single', solved: 1, correct: 0, bonusSum: 0, bonusCount: 0 }],
    );
    expect(merged.find((s) => s.mode === 'addition-single')).toEqual({ mode: 'addition-single', solved: 12, correct: 10, bonusSum: 22, bonusCount: 10 });
    expect(merged).toHaveLength(2);
  });

  it('műveletenkénti csoportosítás minden móddal, összeggel', () => {
    const groups = groupByOperation([{ mode: 'addition-double', solved: 3, correct: 2, bonusSum: 6, bonusCount: 2 }]);
    expect(groups.map((g) => g.operation)).toEqual(['addition', 'subtraction', 'multiplication', 'division']);
    const add = groups[0];
    expect(add.modes.map((m) => m.mode)).toEqual(['addition-single', 'addition-double', 'addition-written']);
    expect(add.total).toEqual({ solved: 3, correct: 2, bonusSum: 6, bonusCount: 2 });
    expect(groups[1].total.solved).toBe(0);
    expect(correctRatio(groups[1].total)).toBeNull();
  });
});
