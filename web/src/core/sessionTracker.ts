import { newId } from './events';

/** Ennyi szünet (rejtett app vagy tétlenség) után új munkamenet kezdődik. */
export const SESSION_GAP_MS = 5 * 60 * 1000;

/**
 * A munkamenet-azonosító állapota. A munkamenet a kliensen dől el: új azonosító indításnál,
 * játékosváltásnál, és ha az app több mint `SESSION_GAP_MS` ideig rejtve volt, vagy ennyi ideig
 * nem érkezett válasz. Az idők ezredmásodpercben (Date.now()).
 */
export interface SessionTracker {
  id: string;
  /** Az utolsó rögzített válasz ideje; `null`, ha a munkamenetben még nem volt. */
  lastActivity: number | null;
  /** Mióta rejtett az app; `null`, ha látható. */
  hiddenSince: number | null;
}

export function startTracker(now: number, id: string = newId()): SessionTracker {
  return { id, lastActivity: null, hiddenSince: null };
}

export function markHidden(t: SessionTracker, now: number): SessionTracker {
  return t.hiddenSince === null ? { ...t, hiddenSince: now } : t;
}

/** Visszatérés a háttérből: hosszú távollét után új munkamenet. */
export function markVisible(t: SessionTracker, now: number, gapMs: number = SESSION_GAP_MS): SessionTracker {
  if (t.hiddenSince === null) return t;
  const away = now - t.hiddenSince;
  return away >= gapMs ? { id: newId(), lastActivity: null, hiddenSince: null } : { ...t, hiddenSince: null };
}

/** Egy válasz rögzítése: tétlenség után új munkamenet; visszaadja a frissített állapotot. */
export function touch(t: SessionTracker, now: number, gapMs: number = SESSION_GAP_MS): SessionTracker {
  const stale = t.lastActivity !== null && now - t.lastActivity >= gapMs;
  return { id: stale ? newId() : t.id, lastActivity: now, hiddenSince: t.hiddenSince };
}
