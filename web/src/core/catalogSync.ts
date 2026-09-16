import type { Catalog } from './catalog';

/** A helyben tárolt katalógus: a JSON plusz a csíkok data: URL-jei fájlnév szerint. */
export interface StoredCatalog extends Catalog {
  sprites: Record<string, string>;
}

/** Csak nagyobb verzió vált; egyenlő vagy kisebb nem, hogy egy régi feltöltés ne írjon felül újat. */
export function isNewer(fetched: Catalog, currentVersion: number): boolean {
  return fetched.version > currentVersion;
}

/** Azok a csíkok, amiket még le kell tölteni: a katalógusban hivatkozott, de a tárban hiányzó fájlnevek. */
export function missingSprites(catalog: Catalog, sprites: Record<string, string>): string[] {
  return [...new Set(catalog.characters.map((c) => c.spriteSheet))].filter((name) => !sprites[name]);
}

/**
 * A tárolt katalógus karakterei a csík data: URL-jével; `null`, ha bármelyik csík hiányzik,
 * mert félig letöltött katalógust nem használunk.
 */
export function withSprites(stored: StoredCatalog): Catalog | null {
  if (missingSprites(stored, stored.sprites).length > 0) return null;
  return {
    version: stored.version,
    characters: stored.characters.map((c) => ({ ...c, spriteUrl: stored.sprites[c.spriteSheet] })),
  };
}

/** Csak a még hivatkozott csíkok maradnak a tárban; a lecserélt fájlnevek kikerülnek. */
export function pruneSprites(catalog: Catalog, sprites: Record<string, string>): Record<string, string> {
  const used = new Set(catalog.characters.map((c) => c.spriteSheet));
  return Object.fromEntries(Object.entries(sprites).filter(([name]) => used.has(name)));
}
