#!/usr/bin/env node
/**
 * A karakter-katalógus és a sprite-csíkok feltöltése a Supabase Storage `characters` bucketbe.
 *
 * Forrás: a characters/ mappa: catalog.json és a benne hivatkozott PNG-k. Ugyanez a mappa a
 * beépített katalógus forrása is (a web build importálja), így nincs duplikáció.
 * A bucketet nyilvánosként létrehozza, ha még nincs. Meglévő fájlt felülír.
 *
 * Futtatás a repó gyökeréből:
 *   SUPABASE_SERVICE_ROLE_KEY=... node tools/upload_characters.mjs [--dry-run] [--expect-version N]
 *
 * A projekt URL-je a web/.env.local VITE_SUPABASE_URL sorából jön (vagy SUPABASE_URL env).
 * A service role kulcs a Dashboardon: Project Settings → API. Titkos, soha ne kerüljön a repóba.
 */
import { createClient } from '../web/node_modules/@supabase/supabase-js/dist/index.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const BUCKET = 'characters';
const DIR = resolve(ROOT, 'characters');
const CATALOG = resolve(DIR, 'catalog.json');
const dryRun = process.argv.includes('--dry-run');
/** CI: a characters-vN tag számának egyeznie kell a katalógus verziójával. */
const expectIndex = process.argv.indexOf('--expect-version');
const expectVersion = expectIndex >= 0 ? Number(process.argv[expectIndex + 1]) : null;

function envFromFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf-8')
      .split('\n')
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => line.split('=', 2)),
  );
}

function fail(message) {
  console.error(`HIBA: ${message}`);
  process.exit(1);
}

/** A katalógus szerkezeti ellenőrzése, hogy hibás fájl ne kerüljön fel. */
function validate(catalog) {
  if (!Number.isInteger(catalog.version) || catalog.version < 1) fail('a version pozitív egész legyen');
  if (!Array.isArray(catalog.characters) || catalog.characters.length === 0) fail('a characters nem üres lista legyen');
  const ids = new Set();
  for (const c of catalog.characters) {
    const where = `karakter "${c.id ?? '?'}"`;
    if (typeof c.id !== 'string' || !/^[a-z0-9-]+$/.test(c.id)) fail(`${where}: az id kisbetű, szám, kötőjel`);
    if (ids.has(c.id)) fail(`${where}: ismétlődő id`);
    ids.add(c.id);
    if (typeof c.name !== 'string' || !c.name.trim()) fail(`${where}: hiányzó név`);
    if (!Number.isInteger(c.unlockAt) || c.unlockAt < 0) fail(`${where}: unlockAt nemnegatív egész legyen`);
    if (typeof c.spriteSheet !== 'string' || !c.spriteSheet.endsWith('.png')) fail(`${where}: spriteSheet .png fájlnév legyen`);
    if (!Number.isInteger(c.frameSize) || !Number.isInteger(c.frameCount)) fail(`${where}: frameSize és frameCount egész legyen`);
    const f = c.frames ?? {};
    for (const key of ['idle', 'walk', 'happy', 'yuck']) {
      if (!Array.isArray(f[key]) || f[key].length === 0) fail(`${where}: frames.${key} nem üres lista legyen`);
      if (f[key].some((i) => !Number.isInteger(i) || i < 0 || i >= c.frameCount)) fail(`${where}: frames.${key} a csíkon belül legyen`);
    }
    if (!Array.isArray(f.happyOffsets) || f.happyOffsets.length !== f.happy.length) fail(`${where}: happyOffsets hossza a happy hosszával egyezzen`);
    if (!Array.isArray(f.yuckOffsets) || f.yuckOffsets.length !== f.yuck.length) fail(`${where}: yuckOffsets hossza a yuck hosszával egyezzen`);
    if (!Number.isInteger(c.fxFrame) || c.fxFrame < 0 || c.fxFrame >= c.frameCount) fail(`${where}: fxFrame a csíkon belül legyen`);
    if (!c.fx?.heart || !c.fx?.drop || typeof c.fx.drop.fall !== 'number') fail(`${where}: fx.heart, fx.drop és fx.drop.fall kell`);
  }
  if (!ids.has('cat')) fail('a beépített "cat" karakter nem hagyható ki');
}

function spritePath(name) {
  const path = resolve(DIR, name);
  if (!existsSync(path)) fail(`nincs meg a sprite: characters/${name}`);
  return path;
}

async function main() {
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf-8'));
  validate(catalog);
  if (expectVersion !== null && catalog.version !== expectVersion) {
    fail(`a tag verziója (${expectVersion}) nem egyezik a catalog.json version mezőjével (${catalog.version})`);
  }
  const uploads = [
    { name: 'catalog.json', path: CATALOG, contentType: 'application/json', cacheControl: '60' },
    ...catalog.characters.map((c) => ({ name: c.spriteSheet, path: spritePath(c.spriteSheet), contentType: 'image/png', cacheControl: '86400' })),
  ];

  console.log(`Katalógus v${catalog.version}, ${catalog.characters.length} karakter:`);
  for (const u of uploads) console.log(`  ${u.name}  ←  ${u.path.replace(ROOT + '/', '')}`);
  if (dryRun) {
    console.log('Próbafutás, nem töltöttem fel semmit.');
    return;
  }

  const env = { ...envFromFile(resolve(ROOT, 'web/.env.local')), ...process.env };
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) fail('nincs SUPABASE_URL (web/.env.local VITE_SUPABASE_URL vagy env)');
  if (!key) fail('add meg a SUPABASE_SERVICE_ROLE_KEY környezeti változót');

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) fail(`bucketek lekérése: ${listError.message}`);
  if (!buckets.some((b) => b.name === BUCKET)) {
    const { error } = await client.storage.createBucket(BUCKET, { public: true, allowedMimeTypes: ['image/png', 'application/json'] });
    if (error) fail(`bucket létrehozása: ${error.message}`);
    console.log(`Bucket létrehozva: ${BUCKET} (nyilvános)`);
  }

  for (const u of uploads) {
    const { error } = await client.storage.from(BUCKET).upload(u.name, readFileSync(u.path), {
      contentType: u.contentType,
      cacheControl: u.cacheControl,
      upsert: true,
    });
    if (error) fail(`${u.name}: ${error.message}`);
    console.log(`  ✓ ${u.name}`);
  }
  const { data } = client.storage.from(BUCKET).getPublicUrl('catalog.json');
  console.log(`Kész. Katalógus: ${data.publicUrl}`);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
