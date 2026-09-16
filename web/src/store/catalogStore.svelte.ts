import { parseCatalog, type Catalog } from '../core/catalog';
import { CATALOG, CATALOG_VERSION } from '../core/characters';
import { isNewer, missingSprites, pruneSprites, withSprites, type StoredCatalog } from '../core/catalogSync';
import type { KeyValueStorage } from './storage';

const KEY = 'matecska.catalog';

/**
 * A karakter-katalógus: a beépítettel indul, a helyben mentett újabbra vált, majd a szerverről
 * (Supabase Storage) lekéri a legfrissebbet. Csak nagyobb verzió vált, és csak akkor, ha minden
 * csík letöltődött; a csíkok data: URL-ként a helyi tárolóba kerülnek, így net nélkül is megvannak.
 */
export class CatalogStore {
  version = $state(CATALOG_VERSION);
  characters = $state<readonly Catalog['characters'][number][]>(CATALOG);
  /** Honnan jött a mostani katalógus. */
  source = $state<'bundled' | 'cached' | 'remote'>('bundled');

  constructor(
    private readonly storage: KeyValueStorage,
    /** A bucket nyilvános alap-URL-je (a végén perjel); `null`, ha nincs szerver. */
    private readonly baseUrl: string | null,
  ) {
    void this.start();
  }

  private async start(): Promise<void> {
    const stored = await this.loadStored();
    if (stored && isNewer(stored, this.version)) {
      const catalog = withSprites(stored);
      if (catalog) this.apply(catalog, 'cached');
    }
    await this.refresh(stored?.sprites ?? {});
  }

  private async loadStored(): Promise<StoredCatalog | null> {
    try {
      const json = await this.storage.get(KEY);
      if (!json) return null;
      const raw = JSON.parse(json) as { sprites?: unknown };
      const catalog = parseCatalog(raw);
      if (!catalog || typeof raw.sprites !== 'object' || raw.sprites === null) return null;
      const sprites = Object.fromEntries(
        Object.entries(raw.sprites as Record<string, unknown>).filter(([, v]) => typeof v === 'string' && v.startsWith('data:image/')),
      ) as Record<string, string>;
      return { ...catalog, sprites };
    } catch {
      return null;
    }
  }

  /** Lekéri a szerver katalógusát; újabb verziónál letölti a hiányzó csíkokat, ment és átvált. */
  async refresh(known: Record<string, string> = {}): Promise<void> {
    if (!this.baseUrl) return;
    try {
      const response = await fetch(`${this.baseUrl}catalog.json`, { cache: 'no-cache' });
      if (!response.ok) return;
      const fetched = parseCatalog(await response.json());
      if (!fetched || !isNewer(fetched, this.version)) return;
      const sprites = { ...known };
      for (const name of missingSprites(fetched, sprites)) {
        const image = await fetch(`${this.baseUrl}${name}`, { cache: 'no-cache' });
        if (!image.ok) return;
        sprites[name] = await toDataUrl(await image.blob());
      }
      const stored: StoredCatalog = { ...fetched, sprites: pruneSprites(fetched, sprites) };
      const catalog = withSprites(stored);
      if (!catalog) return;
      await this.storage.set(KEY, JSON.stringify(stored));
      this.apply(catalog, 'remote');
      console.info(`[matecska] karakter-katalógus frissítve: v${catalog.version}`);
    } catch {
      // nincs net vagy hibás katalógus: marad a mostani
    }
  }

  private apply(catalog: Catalog, source: 'cached' | 'remote'): void {
    this.version = catalog.version;
    this.characters = catalog.characters;
    this.source = source;
  }
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
