import { describe, expect, it } from 'vitest';
import type { Catalog } from '../src/core/catalog';
import { isNewer, missingSprites, pruneSprites, withSprites } from '../src/core/catalogSync';
import { CAT, CATALOG } from '../src/core/characters';

const catalog: Catalog = { version: 2, characters: [...CATALOG] };
const names = [...new Set(CATALOG.map((c) => c.spriteSheet))];
const all = Object.fromEntries(names.map((n) => [n, `data:image/png;base64,${n}`]));

describe('katalógus-frissítés', () => {
  it('csak nagyobb verzió számít újnak', () => {
    expect(isNewer(catalog, 1)).toBe(true);
    expect(isNewer(catalog, 2)).toBe(false);
    expect(isNewer(catalog, 3)).toBe(false);
  });

  it('a hiányzó csíkokat listázza, fájlnevenként egyszer', () => {
    expect(missingSprites(catalog, {})).toEqual(names);
    expect(missingSprites(catalog, { [CAT.spriteSheet]: 'data:image/png;base64,x' })).toEqual(names.filter((n) => n !== CAT.spriteSheet));
    expect(missingSprites(catalog, all)).toEqual([]);
  });

  it('a csíkok data: URL-je a karakterre kerül; hiányzó csíknál nincs katalógus', () => {
    const ready = withSprites({ ...catalog, sprites: all });
    expect(ready?.characters.every((c) => c.spriteUrl === all[c.spriteSheet])).toBe(true);
    expect(withSprites({ ...catalog, sprites: {} })).toBeNull();
  });

  it('a lecserélt csíkok kikerülnek a tárból', () => {
    const pruned = pruneSprites(catalog, { ...all, 'old-cat.png': 'data:image/png;base64,old' });
    expect(Object.keys(pruned).sort()).toEqual([...names].sort());
  });
});
