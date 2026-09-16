import { describe, expect, it } from 'vitest';
import { BLACK_CAT, CAT } from '../src/core/characters';
import { attemptEvent } from '../src/core/events';
import { buildProfile, freshState, importFrom, parseImported, type PlayerRecord } from '../src/core/player';
import { dummyProfile } from '../src/core/profile';

const player: PlayerRecord = { id: 'p1', name: 'Anna', selectedCharacterID: 'cat', imported: null, pointAdjustment: 0, createdAt: '' };

describe('gyerek állapota és a profil levezetése', () => {
  it('üres állapot: 0 pont, macska, üres stat', () => {
    const p = buildProfile(freshState(player));
    expect(p).toMatchObject({ id: 'p1', name: 'Anna', totalPoints: 0, selectedCharacterID: 'cat', stats: {} });
    expect(p.ownedCharacterIDs).toEqual(['cat']);
  });

  it('a szerver összesítése és a függő események összeadódnak', () => {
    const state = freshState(player, {
      pointsDelta: 40,
      stats: { addition: { solved: 4, correct: 3 } },
    });
    const profile = buildProfile(state);
    const attempt = attemptEvent(profile, { base: 10, bonus: 5, penalty: 0 }, true, 'addition-single');
    const miss = attemptEvent(profile, { base: 0, bonus: 0, penalty: 1 }, false, 'division-written');
    const next = buildProfile({ ...state, pending: [attempt, miss] });
    expect(attempt).toMatchObject({ kind: 'attempt', playerId: 'p1', operation: 'addition', mode: 'addition-single', points: 15 });
    expect(next.totalPoints).toBe(54);
    expect(next.stats.addition).toEqual({ solved: 5, correct: 4 });
    expect(next.stats.division).toEqual({ solved: 1, correct: 0 });
  });

  it('nulla pontnál a levonás 0 pontos eseményt ad, így az összeg nem megy negatívba', () => {
    const profile = buildProfile(freshState(player));
    const miss = attemptEvent(profile, { base: 0, bonus: 0, penalty: 1 }, false, 'subtraction-written');
    expect(miss.points).toBe(0);
    expect(buildProfile({ ...freshState(player), pending: [miss] }).totalPoints).toBe(0);
  });

  it('a küszöb elérésével a karakter feloldódik és kiválasztva maradhat', () => {
    const below = buildProfile(freshState({ ...player, selectedCharacterID: BLACK_CAT.id }, { pointsDelta: BLACK_CAT.unlockAt - 1, stats: {} }));
    expect(below.ownedCharacterIDs).toEqual([CAT.id]);
    expect(below.selectedCharacterID).toBe(CAT.id);
    const at = buildProfile(freshState({ ...player, selectedCharacterID: BLACK_CAT.id }, { pointsDelta: BLACK_CAT.unlockAt, stats: {} }));
    expect(at.ownedCharacterIDs).toEqual([CAT.id, BLACK_CAT.id]);
    expect(at.selectedCharacterID).toBe(BLACK_CAT.id);
    expect(at.totalPoints).toBe(BLACK_CAT.unlockAt);
  });

  it('ismeretlen kiválasztott karakternél a macska a fallback', () => {
    const p = buildProfile(freshState({ ...player, selectedCharacterID: 'fox' }));
    expect(p.selectedCharacterID).toBe('cat');
  });

  it('az átvett (fiók előtti) profil beleszámít', () => {
    const imported = { totalPoints: 100, stats: { addition: { solved: 2, correct: 2 } }, ownedCharacterIDs: ['cat', 'fox'] };
    const p = buildProfile(
      freshState({ ...player, imported }, { pointsDelta: 5, stats: { addition: { solved: 1, correct: 0 } } }),
    );
    expect(p.totalPoints).toBe(105);
    expect(p.stats.addition).toEqual({ solved: 3, correct: 2 });
    expect(p.ownedCharacterIDs).toEqual(['cat']);
  });

  it('a fejlesztői pontkorrekció hozzáadódik, de a pont nem megy nulla alá', () => {
    const plus = buildProfile(freshState({ ...player, pointAdjustment: 500 }, { pointsDelta: 20, stats: {} }));
    expect(plus.totalPoints).toBe(520);
    expect(plus.ownedCharacterIDs).toContain(BLACK_CAT.id);
    const minus = buildProfile(freshState({ ...player, pointAdjustment: -100 }, { pointsDelta: 20, stats: {} }));
    expect(minus.totalPoints).toBe(0);
  });

  it('importFrom: üres profilból nincs átvétel, egyébként pont+stat+karakterek', () => {
    expect(importFrom(dummyProfile())).toBeNull();
    const rich = { ...dummyProfile(), totalPoints: 12 };
    expect(importFrom(rich)).toEqual({ totalPoints: 12, stats: {}, ownedCharacterIDs: ['cat'] });
  });

  it('parseImported óvatos', () => {
    expect(parseImported(null)).toBeNull();
    expect(parseImported({ totalPoints: 'x' })).toBeNull();
    expect(parseImported({ totalPoints: 7.9, stats: { addition: { solved: 1, correct: 1 }, bogus: 1 }, ownedCharacterIDs: ['cat', 3] })).toEqual({
      totalPoints: 7,
      stats: { addition: { solved: 1, correct: 1 } },
      ownedCharacterIDs: ['cat'],
    });
  });
});
