import { describe, expect, it } from 'vitest';
import { BLACK_CAT, CAT, CATALOG, unlockedCharacterIDs, WHITE_CAT } from '../src/core/characters';
import {
  dummyProfile, ownsCharacter, parseProfile, recordScore, resetStats, selectCharacter, selectedCharacter, serializeProfile,
} from '../src/core/profile';
import { loadLegacyProfile } from '../src/store/localCache';
import { LEGACY_PROFILE_KEY, memoryStorage } from '../src/store/storage';

describe('karakter-katalógus', () => {
  it('minden karakter kockái a saját csíkján belül vannak, az árak nem negatívak', () => {
    for (const c of CATALOG) {
      const all = [...c.frames.idle, ...c.frames.walk, ...c.frames.happy, ...c.frames.yuck, c.fxFrame];
      expect(all.every((f) => f >= 0 && f < c.frameCount)).toBe(true);
      expect(c.frames.happyOffsets).toHaveLength(c.frames.happy.length);
      expect(c.frames.yuckOffsets).toHaveLength(c.frames.yuck.length);
      expect(c.unlockAt).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(CATALOG.map((c) => c.id)).size).toBe(CATALOG.length);
    expect(CATALOG[0]).toBe(CAT);
    expect(CAT.unlockAt).toBe(0);
  });

  it('a karakterek pontküszöbre oldódnak fel', () => {
    expect(unlockedCharacterIDs(0)).toEqual([CAT.id]);
    expect(unlockedCharacterIDs(BLACK_CAT.unlockAt - 1)).toEqual([CAT.id]);
    expect(unlockedCharacterIDs(BLACK_CAT.unlockAt)).toEqual([CAT.id, BLACK_CAT.id]);
    expect(unlockedCharacterIDs(WHITE_CAT.unlockAt)).toEqual([CAT.id, BLACK_CAT.id, WHITE_CAT.id]);
  });
});

describe('profil', () => {
  it('alapból dummy profil: 0 pont, macska birtokban és kiválasztva', () => {
    const p = dummyProfile();
    expect(p.name).toBe('Játékos');
    expect(p.totalPoints).toBe(0);
    expect(ownsCharacter(p, CAT.id)).toBe(true);
    expect(selectedCharacter(p)).toBe(CAT);
  });

  it('pont könyvelése és statisztika, az összpont nem megy nulla alá', () => {
    let p = dummyProfile();
    p = recordScore(p, { base: 0, bonus: 0, penalty: 5 }, false, 'addition');
    expect(p.totalPoints).toBe(0);
    p = recordScore(p, { base: 10, bonus: 7, penalty: 0 }, true, 'addition');
    expect(p.totalPoints).toBe(17);
    p = recordScore(p, { base: 0, bonus: 0, penalty: 5 }, false, 'addition');
    expect(p.totalPoints).toBe(12);
    expect(p.stats.addition).toEqual({ solved: 3, correct: 1 });
  });

  it('statisztika nullázása: a pontok és a karakterek maradnak', () => {
    let p = recordScore(dummyProfile(), { base: 10, bonus: 7, penalty: 0 }, true, 'division');
    p = resetStats(p);
    expect(p.stats).toEqual({});
    expect(p.totalPoints).toBe(17);
    expect(ownsCharacter(p, CAT.id)).toBe(true);
  });

  it('a fiók előtti helyi profil beolvasható a régi kulcsról', async () => {
    const p = recordScore(dummyProfile(), { base: 10, bonus: 3, penalty: 0 }, true, 'division');
    const storage = memoryStorage({ [LEGACY_PROFILE_KEY]: serializeProfile(p) });
    const reloaded = await loadLegacyProfile(storage);
    expect(reloaded).toEqual(p);
    expect(reloaded?.totalPoints).toBe(13);
    expect(await loadLegacyProfile(memoryStorage())).toBeNull();
  });

  it('az iOS app profile.json formátumát beolvassa', () => {
    const ios = `{
      "id" : "11111111-2222-3333-4444-555555555555",
      "name" : "Játékos",
      "ownedCharacterIDs" : [ "cat" ],
      "selectedCharacterID" : "cat",
      "stats" : { "addition" : { "correct" : 5, "solved" : 6 } },
      "totalPoints" : 137
    }`;
    const p = parseProfile(ios);
    expect(p?.totalPoints).toBe(137);
    expect(p?.stats.addition).toEqual({ solved: 6, correct: 5 });
    expect(JSON.parse(serializeProfile(p!))).toMatchObject({ totalPoints: 137, selectedCharacterID: 'cat' });
  });

  it('hibás adatnál null', async () => {
    expect(parseProfile('nem json')).toBeNull();
    expect(parseProfile('{"id": 3}')).toBeNull();
    expect(await loadLegacyProfile(memoryStorage({ [LEGACY_PROFILE_KEY]: '{}' }))).toBeNull();
  });

  it('a pont elérésével a karakter feloldódik, kiválasztható, és a pont nem fogy', () => {
    let p = dummyProfile();
    expect(selectCharacter(p, BLACK_CAT).selectedCharacterID).toBe('cat');
    for (let i = 0; i < BLACK_CAT.unlockAt / 20; i++) p = recordScore(p, { base: 10, bonus: 10, penalty: 0 }, true, 'addition');
    expect(p.totalPoints).toBe(BLACK_CAT.unlockAt);
    expect(ownsCharacter(p, BLACK_CAT.id)).toBe(true);
    expect(ownsCharacter(p, WHITE_CAT.id)).toBe(false);
    const selected = selectCharacter(p, BLACK_CAT);
    expect(selected.selectedCharacterID).toBe(BLACK_CAT.id);
    expect(selected.totalPoints).toBe(BLACK_CAT.unlockAt);
  });

});
