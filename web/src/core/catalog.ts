import type { FrameOffset, GameCharacter } from './characters';

/**
 * A karakter-katalógus JSON-formátuma (characters/catalog.json). Ugyanezt tölti majd az app a
 * szerverről is, ezért az olvasás óvatos: hibás elemnél `null`, ismeretlen mezőt átugor.
 * A formátum csak bővülhet, mert régi app-verziók is kapnak új katalógust.
 */
export interface Catalog {
  version: number;
  characters: GameCharacter[];
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isIndexList = (v: unknown, count: number): v is number[] =>
  Array.isArray(v) && v.length > 0 && v.every((i) => isInt(i) && i >= 0 && i < count);
const isOffset = (v: unknown): v is FrameOffset =>
  typeof v === 'object' && v !== null && isInt((v as FrameOffset).x) && isInt((v as FrameOffset).y);
const isOffsetList = (v: unknown, length: number): v is FrameOffset[] =>
  Array.isArray(v) && v.length === length && v.every(isOffset);

export function parseCharacter(raw: unknown): GameCharacter | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !/^[a-z0-9-]+$/.test(r.id) || typeof r.name !== 'string' || !r.name.trim()) return null;
  if (!isInt(r.unlockAt) || r.unlockAt < 0 || typeof r.spriteSheet !== 'string' || !r.spriteSheet) return null;
  if (!isInt(r.frameSize) || r.frameSize <= 0 || !isInt(r.frameCount) || r.frameCount <= 0) return null;
  const f = r.frames as Record<string, unknown> | undefined;
  if (!f || !isIndexList(f.idle, r.frameCount) || !isIndexList(f.walk, r.frameCount)) return null;
  if (!isIndexList(f.happy, r.frameCount) || !isIndexList(f.yuck, r.frameCount)) return null;
  if (!isOffsetList(f.happyOffsets, f.happy.length) || !isOffsetList(f.yuckOffsets, f.yuck.length)) return null;
  if (!isInt(r.fxFrame) || r.fxFrame < 0 || r.fxFrame >= r.frameCount) return null;
  const fx = r.fx as Record<string, unknown> | undefined;
  const drop = fx?.drop as Record<string, unknown> | undefined;
  if (!fx || !isOffset(fx.heart) || !isOffset(drop) || !isInt(drop.fall)) return null;
  return {
    id: r.id,
    name: r.name,
    unlockAt: r.unlockAt,
    spriteSheet: r.spriteSheet,
    frameSize: r.frameSize,
    frameCount: r.frameCount,
    frames: { idle: f.idle, walk: f.walk, happy: f.happy, yuck: f.yuck, happyOffsets: f.happyOffsets, yuckOffsets: f.yuckOffsets },
    fxFrame: r.fxFrame,
    fx: { heart: fx.heart, drop: { x: drop.x, y: drop.y, fall: drop.fall } },
  };
}

/** Teljes katalógus; `null`, ha a szerkezet hibás, nincs `cat`, vagy ismétlődik egy azonosító. */
export function parseCatalog(raw: unknown): Catalog | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!isInt(r.version) || r.version < 1 || !Array.isArray(r.characters)) return null;
  const characters: GameCharacter[] = [];
  for (const item of r.characters) {
    const c = parseCharacter(item);
    if (!c || characters.some((x) => x.id === c.id)) return null;
    characters.push(c);
  }
  if (!characters.some((c) => c.id === 'cat' && c.unlockAt === 0)) return null;
  return { version: r.version, characters };
}
