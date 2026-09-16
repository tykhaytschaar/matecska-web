import catalogJson from '../../../characters/catalog.json';
import { parseCatalog } from './catalog';

/** Kockánkénti (x, y) eltolás a karakter saját rács-pixelében (lásd `frameSize`). */
export interface FrameOffset {
  x: number;
  y: number;
}

/**
 * Gyűjthető karakter. Egy karakter egy sprite-csíkhoz tartozik; a képkocka-indexek
 * a GameBoy-os matecska projekt sprite-tábláját követik.
 */
export interface GameCharacter {
  id: string;
  name: string;
  /** Ennyi összpont felett oldódik fel; 0 = alapból megvan. A pont nem fogy el. */
  unlockAt: number;
  /** A sprite-csík fájlneve (characters/ mappa; a build a public/sprites alá másolja). */
  spriteSheet: string;
  /** Egy kocka oldala a csíkban, pixelben (a rács, amiben az eltolások és a hatások helye értendő). */
  frameSize: number;
  frameCount: number;
  frames: {
    idle: readonly number[];
    /** Balra haladó séta; jobbra menetben tükrözve. */
    walk: readonly number[];
    happy: readonly number[];
    yuck: readonly number[];
    happyOffsets: readonly FrameOffset[];
    yuckOffsets: readonly FrameOffset[];
  };
  /** A hatás-kocka: bal fele a szív (örül), jobb fele a könnycsepp (fanyalog). */
  fxFrame: number;
  /** A szív és a csepp helye a kocka bal felső sarkához képest, rács-pixelben; `fall`: a csepp lépésenkénti süllyedése. */
  fx: { heart: FrameOffset; drop: FrameOffset & { fall: number } };
}

/**
 * A beépített katalógus a repó characters/catalog.json fájljából; ugyanezt tölti fel a
 * tools/upload_characters.mjs a szerverre. A build idején ellenőrizve (CI: dry-run).
 */
const bundled = parseCatalog(catalogJson);
if (!bundled) throw new Error('Hibás characters/catalog.json');

/** Minden létező karakter, a feloldási küszöb sorrendjében. Új karakter: elem a catalog.json-ba, PNG a characters/ mappába. */
export const CATALOG: readonly GameCharacter[] = bundled.characters;
export const CATALOG_VERSION: number = bundled.version;

/** Az alap karakter: mindig megvan, erre esik vissza az app, ha a kiválasztott nem érvényes. */
export const CAT: GameCharacter = CATALOG.find((c) => c.id === 'cat')!;

export function findCharacter(id: string): GameCharacter | undefined {
  return CATALOG.find((character) => character.id === id);
}

/** Az adott összpontnál feloldott karakterek azonosítói. */
export function unlockedCharacterIDs(totalPoints: number): string[] {
  return CATALOG.filter((c) => c.unlockAt <= totalPoints).map((c) => c.id);
}
