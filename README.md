# Matecska

Írásbeli alapműveleteket gyakoroltató app gyerekeknek. Két változat él a repóban:

- **`web/`** – a fő kódbázis: Svelte 5 + Vite PWA, ez lesz Capacitorral az iOS és az Android
  app is. Minden új funkció ide kerül.
- **`Matecska/`** – az eredeti SwiftUI iOS app, befagyasztva; addig marad, amíg a webes
  változat el nem éri ugyanazt a tudást.

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
állapot, karakterek, profil), `src/store` (profil tárolása; most localStorage, később
Capacitor Preferences vagy backend), `src/sprites` (animált sprite), `src/ui` (képernyők),
`tests/` (Vitest). A profil JSON-sémája azonos az iOS app `profile.json` fájljával.

Ikonok: `../matecska/.venv/bin/python tools/make_icons.py` a `web/public/icons` mappába.

## iOS változat (SwiftUI, `Matecska/`)

Írásbeli alapműveleteket gyakoroltató SwiftUI app gyerekeknek. Két háromjegyű szám
(vagy háromjegyű és egyjegyű) műveletét kell rubrikákba beírt számjegyekkel megoldani,
a helyes válasz pontot ér, a gyorsaság bónuszt. A pontokból később karaktereket lehet
majd „vásárolni”; az első karakter a GameBoy-os [matecska](../matecska) projekt macskája.

## Funkciók

- Összeadás, kivonás, szorzás egyjegyűvel, osztás egyjegyűvel (maradék nélkül).
- Pontozás: helyes válasz 10 alap + max 10 gyorsasági bónusz (3 s-ig teljes, 10 s-ig
  lineárisan nullára csökken); helytelen válasz −5. Az összpont nem megy nulla alá.
- Helyben mentett profil (`Application Support/Matecska/profile.json`): pontszám,
  műveletenkénti statisztika, birtokolt és kiválasztott karakter.
- Gyűjtemény-képernyő a karakterekkel; a katalógus egy elem hozzáadásával bővíthető.

## Felépítés

| Mappa | Tartalom |
|---|---|
| `Matecska/Models` | `MathOperation`, `Exercise` (generátorok), `Scoring`, `PracticeSession`, `GameCharacter`, `PlayerProfile`, `ProfileStore` |
| `Matecska/Sprites` | `SpriteSheet` (16×16-os kockákra vágás), `CharacterSpriteView` (animáció) |
| `Matecska/Views` | `HomeView`, `PracticeView`, `ProblemView`, `AnswerCellsRow`, `DigitKeypad`, `BonusBar`, `CollectionView`, `PointsBadge` |
| `Matecska/Theme.swift` | A GameBoy-változat színes palettája és a közös stílusok |
| `MatecskaTests` | Swift Testing tesztek a modellrétegre |
| `tools/recolor_sprites.py` | A GameBoy sprite-csík átszínezése a színes palettára |

A `Matecska.xcodeproj` szinkronizált mappákat használ: a `Matecska/` és `MatecskaTests/`
alá tett új fájlok automatikusan a megfelelő targetbe kerülnek.

## Build és futtatás

Xcode-ból: nyisd meg a `Matecska.xcodeproj` fájlt, válassz szimulátort vagy eszközt, Cmd+R.
Tesztek: Cmd+U.

Terminálból:

```bash
xcodebuild -project Matecska.xcodeproj -scheme Matecska \
  -destination 'platform=iOS Simulator,name=iPhone 17' CODE_SIGNING_ALLOWED=NO test
```

## Sprite frissítése

A macska képkockái a `../matecska` repóban élnek (`tools/sprites.py`, generált PNG:
`assets/matecska_sprites_1x.png`). Ha ott változik a rajz:

```bash
../matecska/.venv/bin/python tools/recolor_sprites.py
```

Ez a `Matecska/Assets.xcassets/CatSprites.imageset/CatSprites.png` fájlt írja újra a
színes (CGB) palettával.
