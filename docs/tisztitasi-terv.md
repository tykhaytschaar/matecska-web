# Repó-átvizsgálás és tisztítási terv

Készült: 2026. szeptember 22., a `270f3d8` commit állapotán.

**Állapot (2026. szeptember 25.): az 1. fázis elkészült** — H1, H2, H3, H5, H6, H7 javítva, az RLS-policy a
`schema.sql`-ben átírva `(select auth.uid())`-ra (a távoli adatbázisra alkalmazása külön lépés). Új teszt:
`web/tests/catalogStore.test.ts` (H5). A H4, H8, H9 többi pontja és a 2–4. fázis még nyitott.

Módszer: a teljes `web/src`, `supabase/`, `tools/`, a workflow-k és a README kézi átolvasása; a Svelte-effektekre
vonatkozó két gyanút a projekt saját Svelte 5.57-ével fordított kísérleti modul igazolta; a Supabase-projekt
biztonsági és teljesítmény-tanácsadója lekérdezve (csak olvasva). A `npm test` (144 teszt), `npm run check`
és `npm run build` mind hiba- és figyelmeztetésmentesen fut, a working tree érintetlen maradt.

Pontozás a lista végén: Hatás (1–5) + Kockázat (1–5), szorozva (6 − Ráfordítás), ahol a ráfordítás 1 = percek,
5 = napok. Az „E" jelzés a tétel sorszáma; a fázisterv ezekre hivatkozik.

---

## 1. Hibák (javítandó)

### H1. Az App.svelte effektje azonnal `dispose()`-olja a frissen létrehozott PlayerStore-t — **magas**

`web/src/App.svelte:57-70`. Az effekt olvassa a `store` állapotot (`store?.userId === userId`), majd ugyanabban
a futásban írja is (`store = next`). Svelte 5-ben az effekt ilyenkor önmagát érvényteleníti: újrafut, előtte
lefut az előző futás takarítója, azaz `next.dispose()`; a második futás a `userId` egyezésén korán kilép, és
nem regisztrál új takarítót. Kísérlettel igazolva (a naplózás: `run 1 → teardown → dispose(u1) → run 2 → early return`).

Következmény: a `PlayerStore.dispose()` (`playerStore.svelte.ts:265-269`) leveszi az `online` és a
`visibilitychange` figyelőt. Így (a) hálózat visszatértekor nincs automatikus újraszinkron, (b) az „5 perc
háttérben → új munkamenet" logika (`onVisibility`) soha nem fut; csak a tétlenség-alapú `touch` működik.
A statisztika munkamenet-száma ezért a valóságnál kevesebb.

Javítás: ne olvassa az effekt a `store`-t. Az `AccountStore.apply()` már megtartja ugyanazt a `user`
objektumot token-frissítésnél, tehát az „ugyanaz a fiók" őr felesleges; biztonságból az írások `untrack`-be:

```ts
import { untrack } from 'svelte';
$effect(() => {
  const userId = account?.user?.id ?? null;
  if (!userId || !backend) { untrack(() => (store = null)); return; }
  const next = new PlayerStore(storage, backend, catalog, userId);
  untrack(() => { store = next; screen = { kind: 'home' }; menuOpen = false; });
  return () => next.dispose();
});
```

### H2. Fióktörlés után a helyi gyorstár nem törlődik — **közepes (adatvédelem)**

`web/src/App.svelte:85-91`. `await account.deleteAccount(code)` végén az `apply(null)` kijelentkezett állapotba
vált; a Svelte effekt-flush mikrotaszkja a `store = null` értékadással előbb fut, mint az `await` folytatása,
így a `store?.clearLocal()` már `null`-on hívódik, és nem fut le. Kísérlettel igazolva.
A törölt fiók játékosnevei és fel nem töltött válaszai a localStorage-ban / Preferences-ben maradnak.

Javítás: a `store` referenciáját az `await` előtt kell megfogni (`const s = store;`), és utána
`s?.clearLocal()`. Mivel a törlés után a `flush()` a szerveren már hibázik, a `clearLocal()`-nak legyen egy
„feltöltés nélkül" ága (vagy a `LocalCache.clear` hívása közvetlenül).

### H3. Kijelentkezés: sorrend és kezeletlen hiba — **közepes**

`web/src/App.svelte:78-83`: a `clearLocal()` (helyi adatok törlése, `active = null`) megelőzi az
`account.signOut()` hívást. Ha a `signOut` hibát dob, a felhasználó belépve marad, üres játékoslistával, és a
menüből indított útvonalon (`Menu.svelte:94`, `onSignOut={() => void signOut()}`) a hiba kezeletlen promise-
elutasítás. Javítás: először `signOut()`, siker után `clearLocal()`; a menü útvonalán is legyen hibaüzenet.

### H4. Escape a menüvel a Játékosok képernyőn duplán hat — **alacsony**

`Menu.svelte:47,67` és `Players.svelte:67,75` egyszerre figyeli a `window` keydown-t; egy Escape bezárja a
menüt **és** a főképernyőre navigál. Javítás: a menü kezelője a lapon (`.sheet`) legyen `stopPropagation`-nel,
vagy a képernyők ne reagáljanak Escape-re, amíg a menü nyitva van.

### H5. A katalógus-ellenőrzés „ellenőrzés…" állapotban ragadhat — **alacsony**

`web/src/store/catalogStore.svelte.ts:79,84`: ha egy csík letöltése nem `ok`, vagy a `withSprites` `null`-t
ad, a `refresh()` visszatér a `check` állítása nélkül; az Alkalmazásról képernyő „Karakterek" sora örökre
„ellenőrzés…"-t mutat. Javítás: ezekben az ágakban `check = 'unreachable'`.

### H6. Ikonszkript elromlott az asset-változás óta — **alacsony**

`tools/make_icons.py:16,24`: `FRAME = 16` és `crop((0,0,16,16))`, de a `characters/*.png` csíkok a `40938c7`
óta 480×32-esek, 32 px-es kockákkal (ellenőrizve). Újrafuttatva a macska bal felső negyede lenne az ikon.
Javítás: `FRAME = 32` vagy a `frameSize` olvasása a `catalog.json`-ból; a futtatás repó-helyi `.venv`-ből.

### H7. Az Xcode-projekt verziója elmaradt — **alacsony**

`web/ios/App/App.xcodeproj/project.pbxproj:311,334` `MARKETING_VERSION = 0.2.4`, a `web/package.json` 0.2.5.
Az `ios:sync` nem futott (vagy nem lett commitolva) a verzióemelés után. Javítás: `npm run ios:sync`, commit;
opcionálisan CI-ellenőrzés az egyezésre.

### H8. Kisebb UI-hibák — **alacsony**

- `EditPlayer.svelte:85` `maxlength="24"`, míg a létrehozás (`Players.svelte:120`) és a store (`rename`, 40-re
  vág) 40-et enged: 25–40 karakteres név szerkesztésnél csonkul. Egy közös `MAX_PLAYER_NAME` konstans.
- `DeleteCodeStep.svelte:85`: „Új kód" kérése közben a megerősítő gomb „Törlés…"-t ír (`busy && sent`).
- `EditPlayer.svelte:54-57`: sikeres törlés alatt felvillan az „Ez a játékos már nincs meg." szöveg, mert a
  listából előbb tűnik el a játékos, mint ahogy az `onDone()` navigál.
- `SignIn.svelte` (≥ 6 jegy, `maxlength=8`, szóköz engedett) és `DeleteCodeStep.svelte` (pontosan 6 jegy)
  másképp validálja ugyanazt a hatjegyű kódot.
- `CharacterSprite.svelte:109-110`: `image-rendering: pixelated; image-rendering: crisp-edges;` — a második
  felülírja az elsőt, épp a szándék ellen; a `pixelated` egyedül elég.
- `CharacterSprite.svelte:24-29`: a 6 fps-es `setInterval` `stand` hangulatnál is fut (minden avatárnál),
  bár egy kockát mutat.

### H9. Adatbázis-tanácsadó (Supabase advisor) — **alacsony most, közepes növekedésnél**

- `auth_rls_initplan` (WARN): a `players` és `attempts` RLS-policy `auth.uid()`-ot soronként értékel ki
  (`supabase/schema.sql:70,71,76,77`). Javítás: `(select auth.uid())`.
- `authenticated_security_definer_function_executable` (WARN) a `delete_account`, `delete_player` függvényekre:
  szándékos (a kódos törlés miatt), de érdemes egy megjegyzésben rögzíteni a sémában, hogy tudatos.
- `attempts_player_time_idx` még használatlan (kis tábla, seq scan); megtartható, a `mode_stats`/`session_ids`
  időszűrőjét szolgálja majd.
- „Leaked password protection" figyelmeztetés: jelszó nincs, figyelmen kívül hagyható.

---

## 2. Holt kód és felesleges export

Ellenőrzött, sehol nem hivatkozott elemek:

- `web/src/core/exercise.ts:6` `BLANK_SLOTS` (csak a `WEIGHTED_BLANK_SLOTS` él).
- `web/src/core/session.ts:45` `cellCount()`.
- `web/src/store/playerStore.svelte.ts:140` `deactivate()`.
- `web/src/store/account.svelte.ts:49` `AccountStore.dispose()` — sosem hívott (egy példány, app-élettartam; vagy
  hívja az App, vagy törlendő).
- `web/src/store/backend.ts:58` `DeletionCodeError.reason` — 12 helyen beállítva, sehol nem olvasva (a UI csak a
  `message`-et használja). Vagy a UI ágazzon rá, vagy törlendő.
- `web/src/core/sessionTracker.ts:19` `startTracker(now, id)` — a `now` paraméter nem használt.
- `web/src/ui/Practice.svelte:34-41` `initial?: SessionState` prop („tesztelhetőség"): senki nem adja át, komponens-
  teszt nincs; vele együtt a `svelte-ignore state_referenced_locally` is elhagyható.
- `web/src/ui/Keypad.svelte:12` `class:disabled` a `.keypad`-on: nincs hozzá stílus.
- `web/src/theme.css:145-152` `.sr-only` — nem használt (vagy használandó az akadálymentességi pontoknál).
- `web/src/App.svelte:131` a `screen.kind === 'signin'` ág `Home`-ot renderel belépett állapotban: gyakorlatilag
  elérhetetlen (a store létrejöttekor az effekt `home`-ra állít), védő ág; törlendő vagy megjegyzéssel indokolandó.
- Örökölt egyprofilos API a `web/src/core/profile.ts`-ben: `recordScore`, `resetStats`, `selectCharacter`,
  `serializeProfile` — az app nem hívja (a `PlayerStore`/`buildProfile` váltotta le), csak a `tests/profile.test.ts`
  tartja életben. Döntés: törlés a tesztekkel együtt, vagy megtartás a jövőbeli offline/fiók nélküli módhoz.
- Csak a definiáló fájlban használt, mégis exportált ~25 szimbólum (pl. `appInfo.ts` `AppInfo`, `KOFI_USER`;
  `exercise.ts` `WEIGHTED_BLANK_SLOTS`, `Rng`, `randomInt`; `operation.ts` `OperationInfo`, `ProblemLayout`,
  `EntryDirection`, `ModeInfo`; `scoring.ts` `DEFAULT_DECAY_INTERVAL_MS`, `BASE_POINTS`, `MAX_BONUS`,
  `WRONG_ANSWER_PENALTY`; `fakeBackend.ts` `FAKE_DELETION_CODE`; `supabase.ts` `SUPABASE_URL`, `SUPABASE_KEY`).
  Az `export` elhagyása; a `PlayerStore.refreshPlayers`, `sync` és a `CatalogStore.refresh` lehet `private`.
- Csak tesztből használt exportok, amik src-ben élnek: `storage.ts` `memoryStorage` (tesztsegéd — költözhet
  `tests/helpers`-be), `seededRng`, `makeExercise`, `parseCharacter`, `sessionTiming`, `isValidEntry`, `SESSION_GAP_MS`.
  Ezek rendben vannak, csak tudatosítandó.

---

## 3. Duplikáció

**Core / store**

- UUID-generátor kétszer, szó szerint: `core/events.ts:54` `newId()` és `core/profile.ts:23` `uuid()`. A
  `profile.ts` importálja a `newId`-t (nincs kör: az `events.ts` csak típust importál a `profile.ts`-ből).
- Stat-JSON olvasás: `profile.ts` `parseProfile` belső ciklusa ugyanaz, mint `player.ts` `parseStats`.
- `{ solved: prev.solved + 1, correct: prev.correct + (correct ? 1 : 0) }` minta háromszor: `player.ts`
  (`buildProfile`), `profile.ts` (`recordScore`), `platform/fakeBackend.ts` (`summaryOf`).
- `core/stats.ts:97` `PRACTICE_MODES.filter(m => MODE_INFO[m].operation === operation)` = a meglévő `modesOf()`.
- „objektum-e" őr + `raw as Record<string, unknown>` 11 helyen; egy `asRecord(raw)` segéd kiváltja.
- `Capacitor.isNativePlatform()` négy helyen külön (`haptics.ts`, `platform/storage.ts`, `Menu.svelte`,
  `About.svelte`): egy `platform/native.ts` konstans.
- Katalógus-ellenőrzés kétszer, két nyelven: `tools/upload_characters.mjs:45-69` `validate()` és
  `core/catalog.ts` `parseCatalog()`; és **eltérnek**: az app megköveteli a `cat` `unlockAt === 0`-ját és a
  `frameSize > 0`-t, a feltöltő nem. Így a `characters.yml` feltölthet egy katalógust, amit minden kliens
  csendben elutasít. Javítás: a tool importálja a `parseCatalog`-ot (Node 24 natívan futtatja a
  típus-annotációs `.ts`-t: `import { parseCatalog } from '../web/src/core/catalog.ts'`; a fájl csak típust
  importál, alkalmas rá), vagy legalább a `characters.yml` futtassa az `npm run build`-et is.

**UI (a részletes fájl:sor lista a jelentésben; itt a lényeg)**

- Képernyő-fejléc (`.top`, `.back`, `h1`, placeholder, ~30 sor CSS) + Escape-kezelés 10 komponensben
  (About, Collection, Donate, EditPlayer, Privacy, Stats, Support, Players, ModePicker, Practice). Egy
  `ScreenHeader.svelte` (`title`, `onBack`, `backLabel`, jobb oldali snippet, beépített Escape) megszünteti,
  és mellékesen javítja, hogy a Collection az egyetlen alképernyő Escape nélkül, és a Practice fejléce 40 px a
  többiek 44 px-e helyett.
- `.pill` család (`.pill`, `:disabled`, `.danger`, `.dark`, `.safe`, `.primary`) hat komponensben újra
  deklarálva → `theme.css`, a `.chunky` mellé.
- Szöveges `input`/`input:focus`, `.error`, `.spacer { flex: 1 }` 5–6 komponensben → `theme.css` (`.field`,
  `.error`, `.spacer`).
- Hatjegyű kód beviteli mező + „Új kód" + hibaleképezés `describe()`: `SignIn.svelte:94-115` és
  `DeleteCodeStep.svelte:60-87` → közös `CodeEntry.svelte` (ez oldja a H8 validációs eltérését is).
- Igen/Nem megerősítés + kód lépés kétszer, más külsővel: `About.svelte:161-185` és `EditPlayer.svelte:95-117`
  → `ConfirmDelete.svelte`.
- `run(action, failure)` busy/error segéd azonos az About-ban és az EditPlayer-ben; Players/SignIn/DeleteCodeStep
  kézzel ugyanazt írja → kis `useBusy()` a `.svelte.ts`-ben.
- Kiválasztott kártya (`border-color: var(--flame); box-shadow: inset …`) és szaggatott helyőrző kártya a
  Collection-ben és a Players-ben → `.card.selected`, `.card-dashed`.
- Szegmens-kapcsoló CSS a ModePicker-ben és a Stats-ban.
- `mailto` verzió-tárggyal az About-ban és a Support-ban → `supportMailto()` az `appInfo.ts`-ben.

---

## 4. Nem megfelelő vagy törékeny megvalósítás

- **Indulás hálózatra vár**: `playerStore.svelte.ts:84-85` a `refreshPlayers()` (hálózat) után állítja
  `ready = true`-ra; az App addig üres képernyőt mutat. Hibánál gyors, de lassú/fogságban tartott hálózaton
  (captive portal) hosszan üres. Javaslat: `ready` a gyorstár betöltése után, a szerverfrissítés háttérben;
  vagy időkorlát a listázásra.
- **Felesleges kérések szinkronnál**: `sync.ts:30` `fetchSummary`, majd `playerStore.svelte.ts:319`
  `refreshPlayers()` (players + player_summaries) — a `fetchSummary` eredményét rögtön felülírja a lista.
  Egy sikeres szinkron így 4–5 kérés. A `fetchSummary` elhagyható, ha a lista frissítése követi.
- **Munkamenet-szám kliensoldalon**: `supabaseBackend.ts:148` `session_ids` az összes UUID-t letölti, a kliens
  `Set`-tel számol. „Összesen" időszaknál ez a játékos minden valaha volt munkamenete. Javaslat: a szerver adjon
  `count(distinct session_id)`-t, és a kliens csak a helyi, fel nem töltött azonosítókat adja hozzá (átfedés
  elhanyagolható). Kapcsolódik az adatbázis-archiválási tervhez.
- **`player_summaries` nézet** minden `listPlayers`-nél a teljes `attempts`-et összegzi játékosonként —
  ugyanaz a skálázási kérdés, mint fent; az archiválási tervben kezelendő (napi összesítő tábla).
- **Séma mint migráció**: a `supabase/schema.sql` „újrafuttatható" fájl, de már migrációs történetet hordoz
  (`alter table … drop column if exists operand_a …`, `drop table if exists purchases`, `drop function if
  exists delete_account()`). A távoli projektben 7 migráció van (`drop_purchases_threshold_unlock` …
  `deletion_codes_and_confirmed_delete`), a repóban egy sem. Javaslat: `supabase/migrations/` a távoli
  migrációk tükrével (a CLI-vel lehúzható), a `schema.sql` pedig vagy megszűnik, vagy tiszta „aktuális állapot"
  marad a régi `alter/drop` sorok nélkül.
- **`deletion_codes` sosem takarított**: lejárt és felhasznált sorok maradnak. Kis tábla, de egy
  `delete … where expires_at < now() - interval '1 day'` a `consume_deletion_code`-ban vagy egy `pg_cron` job
  rendet tart.
- **Válaszcím három helyen kódolva**: `request-deletion/index.ts:16` `REPLY_TO`, `core/appInfo.ts:11`
  `SUPPORT_EMAIL`, README és a tájékoztató oldal. Az Edge Functionben `RESEND_REPLY_TO` env vár; a kód és a
  README két helyen „ideiglenesnek" nevezi a gmail-címet, a tájékoztató hivatalos kapcsolatként — döntés kell.
- **`request-deletion` `sixDigits()`**: `Uint32 % 1_000_000` enyhén torzított (2³² nem osztható 10⁶-nal);
  gyakorlatilag lényegtelen, de `crypto.getRandomValues` több bájtjából vagy elutasító mintavétellel egzakt.
- **`tools/upload_characters.mjs:15`** mély importútvonal (`../web/node_modules/@supabase/supabase-js/dist/index.mjs`):
  a csomag belső elrendezésére épít. Javaslat: `npm --prefix web exec node tools/…` és névre importálás, vagy a
  szkript költözzön `web/scripts/` alá.
- **`vite.config.ts:14-27`** a `characterSprites` plugin a `characters/` minden PNG-jét másolja, a katalógustól
  függetlenül: egy lecserélt csík régi fájlja bekerül a `dist/`-be és a Workbox előgyorsítótárba. Szűrés a
  `catalog.characters[].spriteSheet` szerint.
- **`web/scripts/sync-version.mjs`**: nem emeli a `CURRENT_PROJECT_VERSION`-t (marad 1), így ugyanannak a
  verziónak második feltöltése az App Store-ba ütközik; nem idézőjelezi a nem numerikus verziót (`0.3.0-beta`).
- **Tesztlefedettség**: nincs teszt a `supabaseBackend.ts` sorleképezőire (`toRecord`, `toSummary`,
  `toDeletionError`), a négy `*.svelte.ts` store-ra, a `browserStorage`-ra és a `localCache` privát
  parsereire (`parseState`, `isEvent`). A H1/H2 hibát egy store-szintű teszt (a fenti kísérlet mintájára,
  `$effect.root` + `flushSync`) fogta volna.

---

## 5. Dokumentáció (README és megjegyzések)

README eltérések a kódtól:

- 83. sor „Három workflow" — négy van (ci, release, pages-redirect, characters).
- 36., 140. sor „Infó képernyő" — a képernyő neve „Az alkalmazásról"; ugyanez a kódmegjegyzésekben:
  `vite.config.ts:10`, `core/appInfo.ts:1`, `scripts/sync-version.mjs:2`, `ui/Players.svelte:15`.
- 51. és 63–66. sor: két külön „Az alkalmazásról képernyő" pont; a „főképernyő fejléce" mondat a másodikba
  keveredett. Összevonandó.
- 5. sor: a SwiftUI változat a `2842602` helyett az `e54fbb6` commitig van meg (a `42c8fba` törölte).
- 67. sor: `[matecska](../matecska)` a repón kívülre mutató relatív link — GitHubon 404.
- 163. sor és `tools/*.py` docstringek: `../matecska/.venv/bin/python` — más projekt venv-je (ütközik a globális
  szabállyal: repó-helyi `.venv`).
- 157–162. sor: csak a `recolor_sprites.py` szerepel; a Ferike/Marika/Petike csíkok Piskel-forrásai
  (`piskel/`) nincsenek említve. A `piskel/` fájlnevek szóközösek, időbélyegesek — érdemes `blackcat.piskel`
  stb.-re nevezni.
- 95–97. sor: a `characters.yml` a `SUPABASE_URL` Actions-változót is igényli, nem csak a titkot.
- 109–110. sor: a séma listája nem említi a `deletion_codes` táblát és a `consume_deletion_code` függvényt.
- 121–122. sor: a `players` leírásából hiányzik a `point_adjustment` és az `ask_operands`.
- 148–149. sor és `web/.env.example`: a `VITE_FAKE_BACKEND` csak `npm run dev` alatt hat
  (`services.ts:17` `import.meta.env.DEV`); a `VITE_CATALOG_URL` nincs az `.env.example`-ben.
- 169. sor: „haptika beküldésnél" — számjegy- és törlésgombnál is (`Practice.svelte:134,138`).

Elavult kódmegjegyzések és beállítások:

- `web/vite.config.ts:7-8`: „GitHub Pages alatt a repó neve az alap útvonal" + `process.env.BASE_PATH` — a
  Netlify-költözés óta semmi nem állítja; törlendő (`base: '/'`).
- `.github/workflows/ci.yml:4`: „Kiadás (Pages, karakterek)" → Netlify.
- `ui/Privacy.svelte:26` TODO („a szövegek a hivatalos tájékoztatóval helyettesítendők") elavult, a hivatalos
  oldal létezik és linkelve van. Ugyanakkor a rövid összefoglaló **ellentmond** neki: 34. sor „Harmadik félnek
  nem adjuk át" vs. a tájékoztató §4 adatfeldolgozó-listája (Supabase, Resend, Netlify, Apple, Ko-fi); a
  törlésnél nem említi az e-mailes kódot; 37. sor „az Az alkalmazásról" kettős névelő.
- `public/adatvedelem/index.html:50` `<!-- TODO: székhely/levelezési cím -->` a publikált jogi oldalon;
  79. sor a Resendet „belépőkód" küldőjeként írja, a kódban a Resend a törlés-megerősítő kódot küldi, a
  belépőkódot a Supabase Auth SMTP-je — ha az SMTP nem Resend, a mondat téves; ellenőrizendő.
- `public/adatvedelem/index.html:94` „Játékos törlése" gomb — a UI-ban „Törlés…" (l. H8 elnevezés).

---

## 6. Repó-higiénia és workflow-k

- `supabase/.temp/` untracked (CLI-cache): `.gitignore`-ba.
- `web/.gitignore:3-6`: a `public/sprites/` bejegyzés kétszer.
- `web/ios/.gitignore`: `App/Pods`, `capacitor-cordova-ios-plugins` — CocoaPods/Cordova maradvány, SPM-nél
  felesleges (a `config.xml`, `capacitor.config.json`, `App/App/public` maradjon).
- `.agents/skills/**` (40 fájl) + `skills-lock.json`: harmadik féltől vendorolt Supabase-skill-dokumentáció,
  semmi nem hivatkozik rá. Tudatos döntés kell: megtartás egy README-sorral, vagy `.gitignore` + eltávolítás
  az indexből.
- `.github/workflows/pages-redirect.yml`: egyszeri, 2026-09-17-én sikeresen lefutott; a Pages-átirányítás
  nélküle is él. Törölhető (a `web/redirect/` mappával együtt, vagy az maradjon dokumentumként), a README
  „Három workflow" ezzel igazzá válik.
- `ci.yml:5-8`: `push: branches: ["**"]` **és** `pull_request` — PR-ágakon minden push kétszer futtatja a CI-t.
  Egyszemélyes repónál a `pull_request` elhagyható, vagy a `push` csak `main`-re.
- `release.yml:60,62`: `npx --yes netlify-cli@latest` rögzítetlen; egy törő kiadás megakaszthatja az éles
  deployt. Főverzióra rögzíteni.
- `characters.yml`: nem futtat `npm run build`-et, így a beépített katalógus `throw`-ja
  (`core/characters.ts:46`) feltöltés előtt nem fut le (l. a duplikált validátor pontját).

---

## 7. Fontossági sorrend

| # | Tétel | Hatás | Kock. | Ráford. | Pont |
|---|---|---|---|---|---|
| 1 | H1 PlayerStore azonnali dispose (`untrack`) | 4 | 4 | 1 | 40 |
| 2 | H2 fióktörlés után helyi gyorstár marad | 3 | 4 | 1 | 35 |
| 3 | H3 kijelentkezés sorrend + kezeletlen hiba | 3 | 3 | 1 | 30 |
| 4 | Katalógus-validátor egyesítése (tool ↔ `parseCatalog`) vagy build a `characters.yml`-ben | 3 | 3 | 2 | 24 |
| 5 | H6 `make_icons.py` FRAME 32 + repó-helyi venv | 2 | 3 | 1 | 25 |
| 6 | H7 pbxproj 0.2.5 (`ios:sync`) | 2 | 3 | 1 | 25 |
| 7 | H5 katalógus `check` beragad | 2 | 2 | 1 | 20 |
| 8 | Privacy.svelte ↔ tájékoztató összhang, TODO-k | 3 | 3 | 2 | 24 |
| 9 | README-javítások (5. fejezet) + elavult megjegyzések | 2 | 2 | 1 | 20 |
| 10 | Holt kód törlése (2. fejezet, a profile.ts API döntésével) | 2 | 1 | 1 | 15 |
| 11 | RLS `(select auth.uid())` | 1 | 3 | 1 | 20 |
| 12 | `supabase/migrations/` tükör, `schema.sql` tisztítása | 2 | 3 | 3 | 15 |
| 13 | Core duplikációk (`newId`, `parseStats`, `modesOf`, `asRecord`) | 2 | 1 | 1 | 15 |
| 14 | UI duplikációk: `ScreenHeader`, `.pill`/`.field` a theme-be, `CodeEntry`, `ConfirmDelete` | 4 | 2 | 4 | 12 |
| 15 | Indulás ne várjon hálózatra; szinkron felesleges kérései; `session_ids` szerveroldali count | 3 | 2 | 3 | 15 |
| 16 | Workflow-higiénia (netlify-cli rögzítés, CI dupla futás, pages-redirect törlése) | 1 | 2 | 1 | 15 |
| 17 | H4, H8 kisebb UI-hibák; akadálymentesség (aria-pressed, fókusz vissza, címsor-sorrend) | 2 | 1 | 2 | 12 |
| 18 | Repó-higiénia (`.gitignore`-ok, `.agents/` döntés, `piskel/` átnevezés) | 1 | 1 | 1 | 10 |
| 19 | Tesztek a store-okra és a `supabaseBackend` leképezőire | 3 | 2 | 3 | 15 |

## 8. Fázisterv (a fejlesztés mellett végezhető)

**1. fázis — egy ülés, hibajavítás (1–3, 5–7, 11).** Négy-öt kicsi, egymástól független javítás az
`App.svelte`-ben, a `catalogStore`-ban, a `make_icons.py`-ban, a sémában; `ios:sync` és commit. Mindegyik
mellé egy teszt, ahol van értelme (H1/H2 store-teszt `$effect.root`-tal). Ezután lehet egy 0.2.6 kiadás.

**2. fázis — egy ülés, dokumentum és higiénia (4, 8, 9, 10, 13, 16, 18).** README és megjegyzések, Privacy-
szöveg, holt kód, core duplikációk, katalógus-validátor, workflow-k, `.gitignore`. Nincs viselkedésváltozás,
alacsony kockázat, egy commitban mehet.

**3. fázis — a következő UI-munkával együtt (14, 17).** A `ScreenHeader` és a theme-utility-k bevezetése akkor
éri meg, amikor amúgy is képernyőt nyúlunk (pl. Android előtt); komponensenként fokozatosan, mindig sötét és
világos módban ellenőrizve.

**4. fázis — a backend-skálázással együtt (12, 15, 19).** Migrációs mappa, szerveroldali munkamenet-szám,
indulási sorrend és a szinkron kéréseinek ritkítása az archiválási tervvel (napi összesítő tábla) egy menetben;
előtte store-tesztek, hogy a szinkron viselkedése rögzítve legyen.

## 9. Nem talált / rendben lévő dolgok

Minden `package.json`-függőség használt (a `@capacitor/splash-screen` és `status-bar` csak natív oldalon, a
`Package.swift`-ben). Nincs `any`, `@ts-ignore`, `eslint-disable`; a három `svelte-ignore` indokolt. Nincs
`console.log`/`debugger` (egy szándékos `console.info` a katalógus-frissítésnél). A README számszerű állításai
(pontok, bónuszidők, tartományok, 5 perces munkamenet, 1,5 s szinkron, 7 koppintás) egyeznek a kóddal. Az
átirányító oldalak és a tájékoztató URL-jei, címei naprakészek. A Supabase Edge Function 3. verziója aktív.
