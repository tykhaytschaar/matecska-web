/**
 * A cica sétája a képernyő két széle közt, az eredeti GameBoy-os címképernyő mintájára:
 * egyenletes tempóban megy, a szélén megáll egy rövid időre, aztán visszafordul.
 * Az idő másodpercben, a távolság a karakter rács-pixelében (lásd `frameSize`).
 */
export interface WalkState {
  /** A kocka bal széle a sáv bal szélétől, rács-pixelben. */
  x: number;
  /** +1 jobbra, −1 balra. A séta-kockák balra néznek, jobbra menetben tükrözzük. */
  direction: 1 | -1;
  /** Ennyi másodperc van még a szélén állásból; 0, ha megy. */
  pauseLeft: number;
}

export interface WalkConfig {
  /** Rács-pixel per másodperc. */
  speed: number;
  /** Megállás a szélén, másodpercben. */
  pause: number;
}

export const HOME_WALK: WalkConfig = { speed: 28, pause: 1.4 };
export const PRACTICE_WALK: WalkConfig = { speed: 24, pause: 1 };

export function startWalk(x = 0, direction: 1 | -1 = 1): WalkState {
  return { x, direction, pauseLeft: 0 };
}

/**
 * Egy lépés előre `dt` másodperccel egy `maxX` széles sávban (a kocka bal széle 0 és
 * `maxX` közt mozoghat). Ha a sáv keskenyebb a kockánál, a cica áll.
 */
export function advanceWalk(state: WalkState, dt: number, maxX: number, config: WalkConfig): WalkState {
  if (maxX <= 0) return { ...state, x: 0 };
  if (state.pauseLeft > 0) {
    const pauseLeft = Math.max(0, state.pauseLeft - dt);
    return pauseLeft > 0 ? { ...state, pauseLeft } : { ...state, pauseLeft: 0, direction: state.direction === 1 ? -1 : 1 };
  }
  // Csak a haladás irányában lévő szél állít meg: induláskor 0-nál nem ütközünk a bal szélbe.
  const x = state.x + state.direction * config.speed * Math.max(0, dt);
  if (state.direction === 1 && x >= maxX) return { x: maxX, direction: 1, pauseLeft: config.pause };
  if (state.direction === -1 && x <= 0) return { x: 0, direction: -1, pauseLeft: config.pause };
  return { ...state, x };
}

/** Áll-e a cica (a szélén pihen). */
export function isResting(state: WalkState): boolean {
  return state.pauseLeft > 0;
}
