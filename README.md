# Matecska

Írásbeli alapműveleteket gyakoroltató app gyerekeknek. Egy TypeScript kódbázis (`web/`,
Svelte 5 + Vite PWA), amit Capacitor csomagol natív iOS és később Android appá.
Az eredeti SwiftUI iOS változat a `2842602` commitig a git-történetben megtalálható.

## Funkciók

- Négy fő kategória, alattuk alkategóriák:
  - Összeadás: egyjegyűek (2…9 + 2…9, fejben) és írásbeli (két háromjegyű).
  - Kivonás: egyjegyűek (a kivonandó és a különbség 2…9, a kisebbítendő 4…18) és írásbeli
    (két háromjegyű, nemnegatív különbség).
  - Szorzás: szorzótábla (2…9 · 2…9, az 1-es sor kimarad) és írásbeli (háromjegyű · egyjegyű).
  - Osztás: szorzótábla visszafelé (2…9 közti számok szorzatából az egyik tényező) és írásbeli
    (háromjegyű : egyjegyű, maradék nélkül, nem kötelező maradék-ráccsal).
- Az írásbeli feladatok füzetszerű elrendezésben, rubrikákba beírt számjegyekkel, jobbról
  balra haladva (az osztás balról jobbra); az egyjegyű feladatok egy sorban, `7 + 5 = ▢`
  alakban, balról jobbra kitöltve. Az egyjegyű feladatokban egyik operandus és az eredmény sem 1.
- Az üres hely az egyjegyű feladatoknál és az írásbeli összeadásnál/kivonásnál véletlen:
  50% az eredmény, 25-25% az első vagy a második operandus; írásbeli szorzásnál és osztásnál
  mindig az eredmény.
- Pontozás: helyes válasz 10 alap + max 10 gyorsasági bónusz. A bónusz az egyjegyű
  feladatoknál azonnal, az írásbeli összeadásnál/kivonásnál 3 s, szorzásnál/osztásnál 5 s
  után kezd fogyni, periódusonként (alapból másodpercenként) eggyel. Helytelen válasz −1;
  az összpont nem megy nulla alá.
- Fiók és játékosprofilok: a szülő (vagy a felnőtt játékos) e-mail címére kapott kóddal lép be (jelszó nincs,
  regisztráció és belépés ugyanaz a lépés), alatta tetszőleges számú játékos becenévvel.
  Játékosonként külön pont, műveletenkénti statisztika, birtokolt és kiválasztott karakter.
  A játékosváltó a főképernyőn a játékos nevére koppintva nyílik. A cica a két szél közt sétál,
  a szélén megáll; gyakorlás közben is sétál, beküldésre megáll és szívvel vagy könnycseppel reagál.
- Offline-first: a válaszok helyben mentődnek és rövid késleltetéssel a szerverre kerülnek;
  net nélkül a függő események megmaradnak a következő alkalomig. Az Infó képernyő mutatja
  a szinkron állapotát.
- Infó képernyő: verzió, az aktív játékos statisztikája, kijelentkezés és fióktörlés. Rejtett
  fejlesztői mód (7 koppintás a verziósorra): játékosonként a pont tetszőleges értékre állítása
  (a válaszok maradnak, egy pontkorrekció kerül a játékosra) és a statisztika, pont nullázása.
- Karakterek képernyő: a karakterek pontküszöbre oldódnak fel, a pont nem fogy (Matecska alapból,
  Fekete cica 500, Fehér cica 1000 ponttól). Új karakter: egy elem a `characters.ts` katalógusába
  küszöbbel, plusz a sprite-csíkja a `public/sprites` mappába.
- Infó képernyő a főképernyő MATECSKA feliratára koppintva: verzió (a `web/package.json`-ból), a build ideje és a
  fejlesztő neve; a verziót és az időbélyeget a Vite fordításkor injektálja. Ugyanitt a
  műveletenkénti statisztika (megoldott, helyes, arány) és a nullázása, ami a pontokat nem érinti.
  A verzió forrása a `web/package.json`; az `ios:sync` átírja az Xcode-projekt MARKETING_VERSION-jét.
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
és GitHub Pages-re teszi a `web/` mappát (`BASE_PATH` = a repó neve). A Supabase-adatok a repó
Actions-változóiból jönnek (`SUPABASE_URL`, `SUPABASE_KEY`).

### Backend (Supabase)

A fiók, a játékosok és az eseménynapló egy Supabase-projektben él; a kliens közvetlenül
hívja, saját szerver nincs. Beállítás egyszer:

1. Projekt a [supabase.com](https://supabase.com) oldalon (ingyenes szint, EU régió).
2. SQL Editor: a `supabase/schema.sql` tartalmát futtasd le (táblák, RLS, `player_summaries`
   nézet, `reset_player` és `delete_account` függvények). Újrafuttatható.
3. Authentication → Sign In / Providers → Email: bekapcsolva, „Confirm email" ki.
   Authentication → Emails → Magic Link sablon: a link helyett a `{{ .Token }}` kód legyen a levélben.
4. Project Settings → API: a Project URL és a publishable (anon) kulcs a `web/.env.local`-ba
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, minta: `web/.env.example`), és a GitHub repó
   Actions-változói közé (`SUPABASE_URL`, `SUPABASE_KEY`).
5. Élesben saját SMTP kell (Authentication → SMTP Settings), mert a beépített küldő óránként csak
   néhány levelet enged.

Adatmodell: `players` (szülő, becenév, kiválasztott karakter, a fiók előtti helyi profil egyszeri
átvétele), `attempts` (egy beküldött válasz: művelet, alkategória, helyes-e, könyvelt pont). A pont
és a stat ebből számolódik, a karakterek a pontból; az esemény-azonosítót a kliens adja, így az
újraküldés idempotens.

Szerver nélküli fejlesztéshez `VITE_FAKE_BACKEND=1` a `.env.local`-ban: memóriabeli utánzat,
bármilyen hatjegyű kód belép, az adatok a böngésző localStorage-ában maradnak.

Szerkezet: `src/core` (tiszta TypeScript modell: műveletek és alkategóriák, feladatok,
pontozás, gyakorlás-állapot, karakterek, profil, események és a játékos állapotának levezetése),
`src/store` (bejelentkezés, játékosok és szinkron; helyi gyorstár böngészőben localStorage-ban,
natívan Capacitor Preferences-ben; Supabase-kliens), `src/platform` (platformválasztás, Supabase
vagy fejlesztői utánzat), `src/sprites` (animált sprite), `src/ui` (képernyők), `tests/` (Vitest).

Sprite-ok: 32×32-es kockák egy vízszintes csíkban, tetszőleges palettával. A karakter `frameSize`
mezője adja a rácsot, az animációs eltolások és a szív/csepp helye (`fx`) ebben a rácsban értendők.
A macska csíkját a `tools/recolor_sprites.py` színezi át a GameBoy-projekt 16×16-os forrásából és
nagyítja kétszeresre. A hatás-kocka (szív, könnycsepp) minden karakter csíkjában szerepel, a `fxFrame`
mutat rá.

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
