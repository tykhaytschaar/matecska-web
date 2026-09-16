# Matecska

Írásbeli alapműveleteket gyakoroltató app gyerekeknek. Egy TypeScript kódbázis (`web/`,
Svelte 5 + Vite PWA), amit Capacitor csomagol natív iOS és később Android appá.
Az eredeti SwiftUI iOS változat a `2842602` commitig a git-történetben megtalálható.

## Funkciók

- Négy fő kategória, alattuk alkategóriák:
  - Összeadás: egyjegyűek (2…9 + 2…9, fejben), kétjegyűek (10…99 + 10…99) és háromjegyűek,
    a két utóbbi füzetszerűen.
  - Kivonás: egyjegyűek (a kivonandó és a különbség 2…9, a kisebbítendő 4…18), kétjegyűek és
    háromjegyűek (nemnegatív különbség), füzetszerűen.
  - Szorzás: szorzótábla (2…9 · 2…9, az 1-es sor kimarad) és háromjegyű · egyjegyű.
  - Osztás: szorzótábla visszafelé (2…9 közti számok szorzatából az egyik tényező) és
    háromjegyű : egyjegyű, maradék nélkül, nem kötelező maradék-ráccsal.
- A füzetszerű feladatok egymás alatt, rubrikákba beírt számjegyekkel, jobbról balra haladva
  (az osztás balról jobbra); az egyjegyű feladatok egy sorban, `7 + 5 = ▢` alakban, balról jobbra
  kitöltve. Az egyjegyű feladatokban egyik operandus és az eredmény sem 1.
- Hiányzó szám: játékosonkénti kapcsoló az alkategória-választón. „Csak az eredmény" (alap) vagy
  „Bármelyik szám": ekkor az összeadás, kivonás és a szorzótáblás típusoknál 50% az eredmény,
  25-25% valamelyik operandus hiányzik, és a bónusz 50%-kal lassabban fogy. Háromjegyű szorzásnál
  és osztásnál mindig az eredmény.
- Pontozás: helyes válasz alappont + ugyanannyi maximumú gyorsasági bónusz. Az alappont
  egyjegyűeknél 3, kétjegyűeknél és a szorzótáblás típusoknál 6, háromjegyűeknél 10. A bónusz az
  egyjegyű és szorzótáblás feladatoknál azonnal, a kétjegyű és háromjegyű összeadásnál/kivonásnál
  3 s, háromjegyű szorzásnál/osztásnál 5 s után kezd fogyni, periódusonként (alapból
  másodpercenként) eggyel. Helytelen válasz −1; az összpont nem megy nulla alá.
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
- Karakterek képernyő: a karakterek pontküszöbre oldódnak fel, a pont nem fogy, a lista küszöb szerint
  rendezett. A katalógus és a sprite-csíkok a `characters/` mappában
  (`catalog.json` + PNG-k), lásd lent.
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

### Kiadás

Három workflow a `.github/workflows` mappában:

- `ci.yml`: minden pushra és pull requestre teszt, típusellenőrzés, build és a karakter-katalógus
  ellenőrzése. Nem deployol.
- `release.yml`: az app kiadása GitHub Pages-re, **csak `v*` tagre** (pl. `v0.1.1`). A tag számának
  egyeznie kell a `web/package.json` verziójával, különben a build leáll. A Supabase-adatok a repó
  Actions-változóiból jönnek (`SUPABASE_URL`, `SUPABASE_KEY`). Az iOS build kézzel megy Xcode-ból,
  a verziót a `package.json`-ból veszi.
- `characters.yml`: a karakterek kiadása a Supabase Storage `characters` bucketbe, **csak
  `characters-v*` tagre** (pl. `characters-v2`). A tag számának egyeznie kell a `catalog.json`
  `version` mezőjével. Titok: `SUPABASE_SERVICE_ROLE_KEY`.

Kiadás lépései: verzió emelése a `web/package.json`-ban, commit, majd
`git tag v0.1.1 && git push origin v0.1.1`. Karaktereknél: `version` emelése a `catalog.json`-ban,
commit, `git tag characters-v2 && git push origin characters-v2`.

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

### Karakterek (`characters/`)

Egyetlen forrás: `characters/catalog.json` (verzió, karakterek: azonosító, név, küszöb, sprite-fájl,
rácsméret, kockaindexek, eltolások, szív/csepp helye) és mellette a PNG-csíkok. A web build innen
importálja a beépített katalógust és másolja a csíkokat a `public/sprites` alá (nincs a gitben).
A `tools/upload_characters.mjs` ugyanezt ellenőrzi és tölti a Storage bucketbe (kézzel:
`SUPABASE_SERVICE_ROLE_KEY=… node tools/upload_characters.mjs`, próba: `--dry-run`).

Az app a beépített katalógussal indul, majd lekéri a bucket `catalog.json`-jét (URL a Supabase
projektből, felülírható a `VITE_CATALOG_URL` változóval). Ha a szerveré nagyobb verziójú, letölti a
hiányzó csíkokat, `data:` URL-ként a helyi tárolóba menti (natívan Preferences, weben localStorage), és
csak akkor vált át, ha minden csík megvan; így net nélkül is a legutóbb letöltött katalógus él. Az Infó
képernyő „Karakterek" sora mutatja a verziót és a forrást (beépített, mentett, szerver). Régi kiadás
soha nem ír felül újabbat, hibás JSON-nál marad a mostani.

A karakter azonosítója (`id`) állandó, ez van a játékos `selected_character_id` mezőjében; a név és a
fájlnév szabadon változhat. Kép cseréjénél új fájlnevet adj (pl. `blackcat-2.png`), mert a CDN egy
napig tartja a régit. A formátum csak bővülhet, mert régi app-verziók is kapnak új katalógust.

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
nagyítja kétszeresre a `characters/cat.png` fájlba. A hatás-kocka (szív, könnycsepp) minden karakter csíkjában szerepel, a `fxFrame`
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
