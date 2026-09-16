import { describe, expect, it } from 'vitest';
import { CAT, type GameCharacter } from '../src/core/characters';
import {
  dummyProfile, ownsCharacter, parseProfile, recordScore, resetStats, selectCharacter, selectedCharacter, serializeProfile, unlockCharacter,
} from '../src/core/profile';
import { loadProfile, saveProfile } from '../src/store/persistence';
import { memoryStorage } from '../src/store/storage';

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

  it('mentés és visszatöltés körút', async () => {
    const storage = memoryStorage();
    const p = recordScore(dummyProfile(), { base: 10, bonus: 3, penalty: 0 }, true, 'division');
    await saveProfile(storage, p);
    expect(await storage.load()).not.toBeNull();
    const reloaded = await loadProfile(storage);
    expect(reloaded).toEqual(p);
    expect(reloaded.totalPoints).toBe(13);
    expect(reloaded.stats.division?.correct).toBe(1);
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

  it('hibás adatnál dummy profilt ad', async () => {
    expect(parseProfile('nem json')).toBeNull();
    expect(parseProfile('{"id": 3}')).toBeNull();
    expect((await loadProfile(memoryStorage('{}'))).name).toBe('Játékos');
  });

  it('karakter feloldása pontért és kiválasztása', () => {
    const premium: GameCharacter = { ...CAT, id: 'test', name: 'Teszt', price: 30 };
    let p = dummyProfile();
    expect(unlockCharacter(p, premium)).toBeNull();
    p = recordScore(p, { base: 10, bonus: 10, penalty: 0 }, true, 'addition');
    p = recordScore(p, { base: 10, bonus: 10, penalty: 0 }, true, 'addition');
    const unlocked = unlockCharacter(p, premium);
    expect(unlocked?.totalPoints).toBe(10);
    expect(unlocked && ownsCharacter(unlocked, 'test')).toBe(true);
    expect(selectCharacter(unlocked!, premium).selectedCharacterID).toBe('test');
    expect(selectCharacter(p, premium).selectedCharacterID).toBe('cat');
  });
});
