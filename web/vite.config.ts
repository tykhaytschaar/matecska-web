import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages alatt a repó neve az alap útvonal; fejlesztéskor gyökér.
const base = process.env.BASE_PATH ?? '/';

// Az Infó képernyő adatai fordításkor kerülnek a kódba (lásd src/core/appInfo.ts).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

/**
 * A karakter-csíkok egy helyen élnek (../characters, a katalógussal együtt); ez a plugin
 * dev szervernél és buildnél is a public/sprites alá másolja őket, hogy ne kelljen duplikálni.
 */
function characterSprites() {
  const src = fileURLToPath(new URL('../characters/', import.meta.url));
  const dst = fileURLToPath(new URL('./public/sprites/', import.meta.url));
  return {
    name: 'matecska-character-sprites',
    buildStart() {
      mkdirSync(dst, { recursive: true });
      for (const file of readdirSync(src).filter((f) => f.endsWith('.png'))) copyFileSync(src + file, dst + file);
    },
  };
}

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    characterSprites(),
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'sprites/*.png'],
      manifest: {
        name: 'Matecska',
        short_name: 'Matecska',
        description: 'Írásbeli alapműveletek gyakorlása pontokért és karakterekért.',
        lang: 'hu',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        background_color: '#FDF6E3',
        theme_color: '#FDF6E3',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        // A statikus tájékoztató oldalt ne helyettesítse az app kezdőlapja, ha nincs a gyorsítótárban.
        navigateFallbackDenylist: [/\/adatvedelem(\/|$)/],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
