import { describe, expect, it } from 'vitest';
import { CAT, type GameCharacter } from '../src/core/characters';
import { attemptEvent, purchaseEvent } from '../src/core/events';
import { buildProfile, freshState, importFrom, parseImported, type PlayerRecord } from '../src/core/player';
import { dummyProfile } from '../src/core/profile';

const player: PlayerRecord = { id: 'p1', name: 'Anna', selectedCharacterID: 'cat', imported: null, createdAt: '' };
const fox: GameCharacter = { ...CAT, id: 'fox', name: 'Róka', price: 30 };

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
      purchasedCharacterIDs: [],
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

  it('vásárlás: a függő esemény levonja az árat és birtokba adja a karaktert', () => {
    const state = freshState(player, { pointsDelta: 50, stats: {}, purchasedCharacterIDs: [] });
    const purchase = purchaseEvent(buildProfile(state), fox);
    const p = buildProfile({ ...state, pending: [purchase], player: { ...player, selectedCharacterID: 'fox' } });
    expect(p.totalPoints).toBe(20);
    expect(p.ownedCharacterIDs).toContain('fox');
    // A kiválasztott karakter csak akkor érvényes, ha a katalógusban is szerepel.
    expect(p.selectedCharacterID).toBe('cat');
  });

  it('nem birtokolt kiválasztott karakternél a macska a fallback', () => {
    const p = buildProfile(freshState({ ...player, selectedCharacterID: 'fox' }));
    expect(p.selectedCharacterID).toBe('cat');
  });

  it('az átvett (fiók előtti) profil beleszámít', () => {
    const imported = { totalPoints: 100, stats: { addition: { solved: 2, correct: 2 } }, ownedCharacterIDs: ['cat', 'fox'] };
    const p = buildProfile(
      freshState({ ...player, imported }, { pointsDelta: 5, stats: { addition: { solved: 1, correct: 0 } }, purchasedCharacterIDs: [] }),
    );
    expect(p.totalPoints).toBe(105);
    expect(p.stats.addition).toEqual({ solved: 3, correct: 2 });
    expect(p.ownedCharacterIDs).toEqual(['cat', 'fox']);
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
