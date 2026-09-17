<script lang="ts">
  import { APP_INFO, formatBuildTime } from '../core/appInfo';
  import { CAT } from '../core/characters';
  import { buildProfile, freshState } from '../core/player';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';
  import type { AccountStore } from '../store/account.svelte';
  import { DEV_MODE_TAPS, type DevMode } from '../store/devMode.svelte';
  import type { PlayerStore } from '../store/playerStore.svelte';

  interface Props {
    store: PlayerStore;
    account: AccountStore;
    devMode: DevMode;
    onBack: () => void;
    onSignOut: () => Promise<void>;
    onDeleteAccount: () => Promise<void>;
  }
  let { store, account, devMode, onBack, onSignOut, onDeleteAccount }: Props = $props();

  /** Melyik veszélyes művelet vár megerősítésre: fióktörlés vagy egy játékos nullázása. */
  let confirming = $state<{ kind: 'delete' } | { kind: 'reset'; playerId: string } | null>(null);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let taps = 0;
  /** Fejlesztői mód: játékosonként a beírt új pontszám. */
  let pointInputs = $state<Record<string, string>>({});

  /** A játékos mostani összpontja: az aktívnál a friss profilból, a többinél a szerver összesítéséből. */
  function pointsOf(listing: (typeof store.players)[number]): number {
    return store.active?.player.id === listing.player.id
      ? store.profile.totalPoints
      : buildProfile(freshState(listing.player, listing.summary), store.catalog.characters).totalPoints;
  }

  async function applyPoints(playerId: string) {
    const value = Number(pointInputs[playerId]);
    if (!Number.isFinite(value)) return;
    await run(() => store.setPoints(playerId, value), 'A pont beállítása nem sikerült. Van internetkapcsolat?');
    pointInputs = { ...pointInputs, [playerId]: '' };
  }


  const syncLabel = $derived(
    store.syncStatus === 'synced' ? 'Szinkronizálva' : store.syncStatus === 'pending' ? 'Feltöltés folyamatban' : 'Nincs kapcsolat',
  );
  /** Pl. „v3 · naprakész” (a szerveré nem újabb), „v3 · szerver” (most töltve), „v3 · mentett”, „v3 · beépített · szerver nem elérhető”. */
  const catalogLabel = $derived.by(() => {
    const c = store.catalog;
    const source = c.source === 'remote' ? 'szerver' : c.source === 'cached' ? 'mentett' : 'beépített';
    if (c.check === 'current') return `v${c.version} · ${c.source === 'remote' ? source : 'naprakész'}`;
    if (c.check === 'unreachable') return `v${c.version} · ${source} · szerver nem elérhető`;
    return `v${c.version} · ${source} · ellenőrzés…`;
  });
  const rows = $derived([
    { label: 'Verzió', value: APP_INFO.version },
    { label: 'Karakterek', value: catalogLabel },
    { label: 'Build ideje', value: formatBuildTime(APP_INFO.builtAt) },
    { label: 'Fejlesztő', value: APP_INFO.developer },
    ...(store.active ? [{ label: 'Szinkron', value: syncLabel, ok: store.syncStatus === 'synced' }] : []),
  ]);


  /** Rejtett kapcsoló: néhány koppintás a verziósorra. */
  function tapVersion() {
    taps += 1;
    if (taps >= DEV_MODE_TAPS) {
      taps = 0;
      devMode.toggle();
    }
  }

  async function run(action: () => Promise<void>, failure: string) {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await action();
      confirming = null;
    } catch {
      error = failure;
    } finally {
      busy = false;
    }
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (confirming) confirming = null;
      else onBack();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

<div class="screen">
  <header class="top">
    <button type="button" class="back" onclick={onBack} aria-label="Vissza">‹</button>
    <h1>Az alkalmazásról</h1>
    <span class="placeholder"></span>
  </header>

  <div class="hero">
    <CharacterSprite character={CAT} size={96} />
    <span class="name">{APP_INFO.name}</span>
    <span class="tagline">Alapműveletek gyakorlása pontokért és karakterekért</span>
  </div>

  <dl class="card info">
    {#each rows as row, i}
      {#if i === 0}
        <button type="button" class="row tappable" onclick={tapVersion}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </button>
      {:else}
        <div class="row">
          <dt>{row.label}</dt>
          <dd class:ok={'ok' in row && row.ok}>{row.value}</dd>
        </div>
      {/if}
    {/each}
  </dl>


  <section class="card block" aria-labelledby="account-title">
    <h2 id="account-title">Fiók</h2>
    <span class="email">{account.user?.email}</span>
    {#if confirming?.kind === 'delete'}
      <div class="confirm">
        <span>Biztosan törlöd a fiókot? Minden játékos, pont és statisztika végleg elvész.</span>
        <div class="actions">
          <button type="button" class="pill" onclick={() => (confirming = null)} disabled={busy}>Mégse</button>
          <button type="button" class="pill danger" disabled={busy} onclick={() => run(onDeleteAccount, 'A törlés nem sikerült. Van internetkapcsolat?')}>
            {busy ? 'Törlés…' : 'Végleges törlés'}
          </button>
        </div>
      </div>
    {:else}
      <div class="actions">
        <button type="button" class="pill" disabled={busy} onclick={() => run(onSignOut, 'A kijelentkezés nem sikerült.')}>
          {busy ? 'Kijelentkezés…' : 'Kijelentkezés'}
        </button>
        <button type="button" class="pill danger" disabled={busy} onclick={() => (confirming = { kind: 'delete' })}>Fiók törlése</button>
      </div>
    {/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </section>

  {#if devMode.on}
    <section class="card block dev" aria-labelledby="dev-title">
      <h2 id="dev-title">Fejlesztői mód</h2>
      {#each store.players as listing (listing.player.id)}
        <div class="dev-row">
          <span class="dev-name">{listing.player.name} <span class="meta">{pointsOf(listing)} pont</span></span>
          <form class="points" onsubmit={(e) => { e.preventDefault(); void applyPoints(listing.player.id); }}>
            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              placeholder="új pont"
              aria-label="{listing.player.name} új pontszáma"
              bind:value={pointInputs[listing.player.id]}
              disabled={busy}
            />
            <button type="submit" class="pill" disabled={busy || !/^\d+$/.test(pointInputs[listing.player.id] ?? '')}>Beállít</button>
          </form>
          {#if confirming?.kind === 'reset' && confirming.playerId === listing.player.id}
            <div class="actions">
              <button type="button" class="pill" onclick={() => (confirming = null)} disabled={busy}>Mégse</button>
              <button
                type="button"
                class="pill danger"
                disabled={busy}
                onclick={() => run(() => store.resetPlayer(listing.player.id), 'A nullázás nem sikerült. Van internetkapcsolat?')}
              >
                {busy ? 'Nullázás…' : 'Biztosan'}
              </button>
            </div>
          {:else}
            <button type="button" class="pill" disabled={busy} onclick={() => (confirming = { kind: 'reset', playerId: listing.player.id })}>
              Stat nullázása
            </button>
          {/if}
        </div>
      {/each}
      <span class="meta">A pont beállítása korrekcióként kerül a játékosra, a válaszok maradnak. A nullázás a pontot és a statisztikát is törli.</span>
      <button type="button" class="pill self-end" onclick={() => devMode.toggle()}>Fejlesztői mód ki</button>
    </section>
  {/if}
</div>

<style>
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .back {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    font-size: 2rem;
    line-height: 1;
    color: var(--flame);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  h1 {
    flex: 1;
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    text-align: center;
  }
  .placeholder {
    width: 40px;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }
  .name {
    font-weight: 900;
    letter-spacing: 0.2em;
    font-size: 1.25rem;
    text-transform: uppercase;
  }
  .tagline {
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .info {
    margin: 0;
    padding: 4px 16px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    padding: 12px 0;
    width: 100%;
  }
  .row + .row {
    border-top: 1px solid var(--ink-faint);
  }
  .tappable {
    text-align: left;
    cursor: default;
  }
  dt {
    font-weight: 600;
    color: var(--ink-soft);
  }
  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
  .block {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }
  dd.ok {
    color: var(--green);
  }
  .meta {
    font-size: 0.8rem;
    color: var(--ink-soft);
  }
  .email {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .pill {
    padding: 8px 14px;
    border-radius: 999px;
    border: 2px solid var(--line);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--ink);
  }
  .pill:disabled {
    opacity: 0.5;
  }
  .pill.danger {
    background: var(--red);
    border-color: transparent;
    color: #fff;
  }
  .self-end {
    align-self: flex-end;
  }
  .confirm {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 0.9rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }
  .error {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--red);
  }
  .dev-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .points {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .points input {
    font: inherit;
    width: 6em;
    padding: 6px 10px;
    border-radius: 999px;
    border: 2px solid var(--line);
    background: var(--paper);
    color: var(--ink);
  }
  .points input:focus {
    outline: none;
    border-color: var(--flame);
  }
  .dev-name {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
</style>
