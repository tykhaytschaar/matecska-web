# Matecska

Írásbeli alapműveleteket gyakoroltató app gyerekeknek. Egy TypeScript kódbázis (`web/`,
Svelte 5 + Vite PWA), amit Capacitor csomagol natív iOS és később Android appá.
Az eredeti SwiftUI iOS változat a `2842602` commitig a git-történetben megtalálható.

## Funkciók

- Összeadás, kivonás, szorzás egyjegyűvel, osztás egyjegyűvel (maradék nélkül), írásbeli
  elrendezésben, rubrikákba beírt számjegyekkel.
- Összeadásnál és kivonásnál véletlen az üres hely: 50% az eredmény, 25-25% az első vagy a
  második operandus; szorzásnál és osztásnál mindig az eredmény.
- Pontozás: helyes válasz 10 alap + max 10 gyorsasági bónusz (összeadás/kivonás 3 s-ig,
  szorzás/osztás 5 s-ig teljes, utána periódusonként, alapból másodpercenként eggyel
  kevesebb); helytelen válasz −1. Az összpont nem megy nulla alá.
- Helyben mentett profil: pontszám, műveletenkénti statisztika, birtokolt és kiválasztott
  karakter. Karakterek képernyő; a katalógus egy elem hozzáadásával bővíthető.
- A macska sprite és az animációk a GameBoy-os [matecska](../matecska) projektből.

## Webes változat (`web/`)

```bash
cd web
npm ci            # függőségek (csak a web/node_modules-ba)
npm run dev       # fejlesztői szerver
npm test          # Vitest
npm run check     # svelte-check
npm run build     # dist/ (PWA, service worker, manifest)
npm run preview   # a build kipróbálása
```

Deploy: a `.github/workflows/web-pages.yml` minden `main`-re push után teszteli, buildeli
és GitHub Pages-re teszi a `web/` mappát (`BASE_PATH` = a repó neve).

Szerkezet: `src/core` (tiszta TypeScript modell: műveletek, feladatok, pontozás, gyakorlás-
állapot, karakterek, profil), `src/store` és `src/platform` (profil tárolása: böngészőben
localStorage, natívan Capacitor Preferences, később backend), `src/sprites` (animált sprite), `src/ui` (képernyők),
`tests/` (Vitest). A profil JSON-sémája azonos az iOS app `profile.json` fájljával.

Ikonok: `../matecska/.venv/bin/python tools/make_icons.py` a `web/public/icons` mappába
(és az iOS-projekt AppIcon + Splash képeibe, ha a `web/ios` létezik).

## iOS változat Capacitorral (`web/ios/`)

A webes build natív iOS appként, Capacitor 8-cal, Swift Package Managerrel (nem CocoaPods).
Bundle ID `com.matecska.Matecska`, a tárolás natívan Capacitor Preferences, haptika beküldésnél.

```bash
cd web
npm run ios:sync   # web build + a dist/ bemásolása az iOS-projektbe + pluginok frissítése
npm run ios:open   # megnyitja az App.xcodeproj-t Xcode-ban; ott Cmd+R szimulátorra vagy telefonra
```

Terminálból, csatlakoztatott iPhone-ra:

```bash
cd web/ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -destination 'id=<UDID>' -allowProvisioningUpdates build
```

A `web/ios/App/App/public` és a generált `capacitor.config.json` nincs verziókezelve,
minden `ios:sync` újragenerálja. Webes kódváltozás után mindig `npm run ios:sync` kell,
mielőtt Xcode-ból buildelsz.
