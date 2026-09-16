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
  /** A sprite-csík fájlja a public/sprites mappában. */
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

export const CAT: GameCharacter = {
  id: 'cat',
  name: 'Matecska',
  unlockAt: 0,
  spriteSheet: 'cat.png',
  // A GameBoy-os 16×16-os rajz kétszeresre skálázva (tools/recolor_sprites.py); az értékek a 32-es rácsban.
  frameSize: 32,
  frameCount: 15,
  frames: {
    idle: [0, 1],
    walk: [2, 3],
    happy: [7, 8, 8, 7],
    yuck: [9, 10, 9, 10],
    happyOffsets: [{ x: 0, y: 0 }, { x: 0, y: -4 }, { x: 0, y: -8 }, { x: 0, y: 0 }],
    yuckOffsets: [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 }],
  },
  fxFrame: 14,
  fx: { heart: { x: 8, y: -20 }, drop: { x: 24, y: -16, fall: 2 } },
};

/** A PixelLab-es cicák közös animációs adatai; a csík a macskáéval azonos elrendezésű: 0-1 áll, 2-3 séta, 7-8 örül, 9-10 fanyalog, 14 hatás. */
const PIXELLAB_CAT = {
  frameSize: 32,
  frameCount: 15,
  frames: {
    idle: [0, 0, 0, 1],
    walk: [2, 3],
    happy: [7, 8, 8, 7],
    yuck: [9, 10, 9, 10],
    happyOffsets: [{ x: 0, y: 0 }, { x: 0, y: -4 }, { x: 0, y: -8 }, { x: 0, y: 0 }],
    yuckOffsets: [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 }],
  },
  fxFrame: 14,
  fx: { heart: { x: 8, y: -20 }, drop: { x: 24, y: -16, fall: 2 } },
} satisfies Omit<GameCharacter, 'id' | 'name' | 'unlockAt' | 'spriteSheet'>;

export const BLACK_CAT: GameCharacter = {
  ...PIXELLAB_CAT,
  id: 'blackcat',
  name: 'Ferike',
  unlockAt: 500,
  spriteSheet: 'blackcat.png',
};

export const WHITE_CAT: GameCharacter = {
  ...PIXELLAB_CAT,
  id: 'whitecat',
  name: 'Marika',
  unlockAt: 1000,
  spriteSheet: 'whitecat.png',
};

/** Minden létező karakter, a feloldási küszöb sorrendjében. Új karakter: egy elem ide, plusz a sprite-csíkja a public/sprites mappába. */
export const CATALOG: readonly GameCharacter[] = [CAT, BLACK_CAT, WHITE_CAT];

/** Az adott összpontnál feloldott karakterek azonosítói. */
export function unlockedCharacterIDs(totalPoints: number): string[] {
  return CATALOG.filter((c) => c.unlockAt <= totalPoints).map((c) => c.id);
}

export function findCharacter(id: string): GameCharacter | undefined {
  return CATALOG.find((character) => character.id === id);
}
