import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATALOG_VERSION } from '../src/core/characters';
import { CatalogStore } from '../src/store/catalogStore.svelte';
import { memoryStorage } from '../src/store/storage';
import catalogJson from '../../characters/catalog.json';

/** A beépített katalógus eggyel nagyobb verzióval, mintha a szerveren újabb lenne. */
const newerCatalog = { ...catalogJson, version: CATALOG_VERSION + 1 };

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body, blob: async () => new Blob() } as unknown as Response;
}

async function settle(): Promise<void> {
  // A konstruktor async láncának (tárolt katalógus, fetch, csíkok) lefutása.
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

afterEach(() => vi.unstubAllGlobals());

describe('CatalogStore.check', () => {
  it('unreachable, ha a szerver katalógusa nem érhető el', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(null, false)));
    const store = new CatalogStore(memoryStorage(), 'https://example.test/');
    await settle();
    expect(store.check).toBe('unreachable');
    expect(store.version).toBe(CATALOG_VERSION);
  });

  it('current, ha a szerveré nem újabb', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(catalogJson)));
    const store = new CatalogStore(memoryStorage(), 'https://example.test/');
    await settle();
    expect(store.check).toBe('current');
  });

  it('unreachable és marad a régi, ha újabb katalógusnál egy csík nem tölthető le', async () => {
    const fetch = vi.fn(async (url: string) => (url.includes('catalog.json') ? jsonResponse(newerCatalog) : jsonResponse(null, false)));
    vi.stubGlobal('fetch', fetch);
    const store = new CatalogStore(memoryStorage(), 'https://example.test/');
    await settle();
    expect(store.check).toBe('unreachable');
    expect(store.version).toBe(CATALOG_VERSION);
    expect(store.source).toBe('bundled');
  });

  it('unreachable, ha nincs szerver', async () => {
    const store = new CatalogStore(memoryStorage(), null);
    await settle();
    expect(store.check).toBe('unreachable');
  });
});
