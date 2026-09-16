import { describe, expect, it } from 'vitest';
import { CAT, CATALOG, unlockedCharacterIDs } from '../src/core/characters';
import { parseCatalog, parseCharacter } from '../src/core/catalog';

/** A tesztek nem függnek a katalógus konkrét tartalmától: a küszöb szerint rendezett lista első zárt tagját használják. */
const BY_THRESHOLD = [...CATALOG].sort((a, b) => a.unlockAt - b.unlockAt);
const FIRST_LOCKED = BY_THRESHOLD.find((c) => c.unlockAt > 0)!;
const ABOVE = BY_THRESHOLD.filter((c) => c.unlockAt > FIRST_LOCKED.unlockAt);
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

  it('a katalógus-olvasó: érvényes elem átmegy, ismeretlen mező nem zavar, hibás elem null', () => {
    const raw = JSON.parse(JSON.stringify(FIRST_LOCKED));
    expect(parseCharacter({ ...raw, extra: 'later' })).toEqual(FIRST_LOCKED);
    expect(parseCharacter({ ...raw, frames: { ...raw.frames, walk: [99] } })).toBeNull();
    expect(parseCharacter({ ...raw, id: 'Nagy Betű' })).toBeNull();
    expect(parseCharacter({ ...raw, fx: { heart: raw.fx.heart } })).toBeNull();
    expect(parseCatalog({ version: 1, characters: [raw] })).toBeNull(); // nincs cat
    expect(parseCatalog({ version: 0, characters: [CAT] })).toBeNull();
    expect(parseCatalog({ version: 2, characters: [CAT, raw, raw] })).toBeNull(); // ismétlődő id
    expect(parseCatalog({ version: 2, characters: [CAT, raw] })?.characters.map((c) => c.id)).toEqual(['cat', FIRST_LOCKED.id]);
    // küszöb szerinti sorrend, a bemenet sorrendjétől függetlenül
    const shuffled = [...CATALOG].reverse().map((c) => JSON.parse(JSON.stringify(c)));
    const sorted = parseCatalog({ version: 2, characters: shuffled })!.characters.map((c) => c.unlockAt);
    expect(sorted).toEqual([...sorted].sort((x, y) => x - y));
  });

  it('a karakterek pontküszöbre oldódnak fel', () => {
    expect(unlockedCharacterIDs(0)).toEqual(CATALOG.filter((c) => c.unlockAt === 0).map((c) => c.id));
    expect(unlockedCharacterIDs(FIRST_LOCKED.unlockAt - 1)).not.toContain(FIRST_LOCKED.id);
    expect(unlockedCharacterIDs(FIRST_LOCKED.unlockAt)).toContain(FIRST_LOCKED.id);
    for (const c of CATALOG) {
      const ids = unlockedCharacterIDs(c.unlockAt);
      expect(ids).toEqual(CATALOG.filter((x) => x.unlockAt <= c.unlockAt).map((x) => x.id));
    }
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
    expect(selectCharacter(p, FIRST_LOCKED).selectedCharacterID).toBe('cat');
    for (let i = 0; i < Math.ceil(FIRST_LOCKED.unlockAt / 20); i++) p = recordScore(p, { base: 10, bonus: 10, penalty: 0 }, true, 'addition');
    expect(p.totalPoints).toBeGreaterThanOrEqual(FIRST_LOCKED.unlockAt);
    expect(ownsCharacter(p, FIRST_LOCKED.id)).toBe(true);
    for (const c of ABOVE) expect(ownsCharacter(p, c.id)).toBe(false);
    const selected = selectCharacter(p, FIRST_LOCKED);
    expect(selected.selectedCharacterID).toBe(FIRST_LOCKED.id);
    expect(selected.totalPoints).toBe(p.totalPoints);
  });

});
