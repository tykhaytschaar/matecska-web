/** Kockánkénti (x, y) eltolás pixelben, 16 px-es kockára vetítve. */
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
  /** Ár pontban; 0 = alapból megvan. */
  price: number;
  /** A sprite-csík fájlja a public/sprites mappában. */
  spriteSheet: string;
  frameCount: number;
  frames: {
    idle: readonly number[];
    happy: readonly number[];
    yuck: readonly number[];
    happyOffsets: readonly FrameOffset[];
    yuckOffsets: readonly FrameOffset[];
  };
}

export const CAT: GameCharacter = {
  id: 'cat',
  name: 'Matecska',
  price: 0,
  spriteSheet: 'cat.png',
  frameCount: 15,
  frames: {
    idle: [0, 1],
    happy: [7, 8, 8, 7],
    yuck: [9, 10, 9, 10],
    happyOffsets: [{ x: 0, y: 0 }, { x: 0, y: -2 }, { x: 0, y: -4 }, { x: 0, y: 0 }],
    yuckOffsets: [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }],
  },
};

/** Minden létező karakter. Új karakter: egy elem ide, plusz a sprite-csíkja a public/sprites mappába. */
export const CATALOG: readonly GameCharacter[] = [CAT];

export function findCharacter(id: string): GameCharacter | undefined {
  return CATALOG.find((character) => character.id === id);
}
