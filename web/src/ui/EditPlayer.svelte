<script lang="ts">
  import { buildProfile, freshState } from '../core/player';
  import { selectedCharacter } from '../core/profile';
  import type { PlayerStore } from '../store/playerStore.svelte';
  import Avatar from './Avatar.svelte';
  import DeleteCodeStep from './DeleteCodeStep.svelte';

  interface Props {
    store: PlayerStore;
    playerId: string;
    /** Mentés, törlés és vissza is a játékoslistára visz. */
    onDone: () => void;
  }
  let { store, playerId, onDone }: Props = $props();

  const listing = $derived(store.players.find((l) => l.player.id === playerId) ?? null);
  const profile = $derived(
    store.active?.player.id === playerId
      ? store.profile
      : listing
        ? buildProfile(freshState(listing.player, listing.summary), store.catalog.characters)
        : null,
  );
  const character = $derived(profile ? selectedCharacter(profile, store.catalog.characters) : null);

  // svelte-ignore state_referenced_locally
  let name = $state(listing?.player.name ?? '');
  /** Törlés: rákérdezés (Nem kiemelve), és csak Igen után megy a megerősítő e-mail. */
  let step = $state<'idle' | 'ask' | 'code'>('idle');
  let busy = $state(false);
  let error = $state<string | null>(null);

  const nameValid = $derived(name.trim().length > 0 && name.trim() !== (listing?.player.name ?? ''));

  async function run(action: () => Promise<void>, failure: string) {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await action();
      onDone();
    } catch {
      error = failure;
    } finally {
      busy = false;
    }
  }

  function save() {
    if (!nameValid) return;
    void run(() => store.rename(playerId, name), 'A mentés nem sikerült. Van internetkapcsolat?');
  }

  async function removeWithCode(code: string) {
    await store.remove(playerId, code);
    onDone();
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (step !== 'idle') step = 'idle';
      else onDone();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

<div class="screen">
  <header class="top">
    <button type="button" class="back" onclick={onDone} aria-label="Vissza a játékosokhoz">‹</button>
    <h1>Játékos szerkesztése</h1>
    <span class="placeholder"></span>
  </header>

  {#if listing && profile && character}
    <div class="hero">
      <Avatar {character} size={64} radius="18px" />
      <span class="points">{profile.totalPoints} pont</span>
    </div>

    <form class="card block" onsubmit={(e) => { e.preventDefault(); save(); }}>
      <label for="player-name">Név</label>
      <input id="player-name" type="text" bind:value={name} maxlength="24" autocomplete="off" autocapitalize="words" disabled={busy} />
      <button type="submit" class="chunky" disabled={!nameValid || busy}>{busy ? 'Mentés…' : 'Név mentése'}</button>
    </form>

    {#if error}<p class="error" role="alert">{error}</p>{/if}

    <div class="spacer"></div>

    <section class="card block" aria-labelledby="delete-title">
      <h2 id="delete-title">Játékos törlése</h2>
      {#if step === 'ask'}
        <div class="confirm">
          <p class="warn">Biztos vagy benne?</p>
          <p>A törlés azonnali és végleges!</p>
          <p class="soft">A pontok, a statisztika és a feloldott karakterek is elvesznek. Ha igen, e-mailben küldünk egy megerősítő kódot.</p>
          <div class="actions">
            <button type="button" class="pill dark" onclick={() => (step = 'code')}>Igen</button>
            <button type="button" class="pill safe" onclick={() => (step = 'idle')}>Nem</button>
          </div>
        </div>
      {:else if step === 'code'}
        <div class="confirm">
          <p class="warn">Vigyázat!</p>
          <p>A törlés azonnali és végleges!</p>
          <DeleteCodeStep
            request={() => store.requestDeletionCode('player', playerId)}
            confirm={removeWithCode}
            onCancel={() => (step = 'idle')}
          />
        </div>
      {:else}
        <button type="button" class="pill outline-danger" onclick={() => (step = 'ask')} disabled={busy}>Törlés…</button>
      {/if}
    </section>
  {:else}
    <p class="missing">Ez a játékos már nincs meg.</p>
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
  .spacer {
    flex: 1;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .points {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-soft);
    white-space: nowrap;
  }
  .block {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink-soft);
  }
  input {
    font: inherit;
    font-size: 1.125rem;
    font-weight: 600;
    padding: 12px 14px;
    border-radius: 12px;
    border: 2px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    width: 100%;
  }
  input:focus {
    outline: none;
    border-color: var(--flame);
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }
  .pill {
    align-self: flex-start;
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
  .outline-danger {
    border-color: var(--red);
    color: var(--red);
  }
  /* Igen: visszafogott sötét; Nem: kiemelt, zöld – ez az alapértelmezett, biztonságos választás. */
  .dark {
    background: var(--bar);
    border-color: transparent;
    color: #fff;
  }
  .safe {
    background: var(--green);
    border-color: transparent;
    color: #fff;
    font-weight: 700;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .actions .pill {
    align-self: auto;
  }
  .confirm {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 59, 48, 0.08);
    border: 2px solid var(--red);
    font-size: 0.95rem;
    line-height: 1.5;
    font-weight: 600;
  }
  .confirm p {
    margin: 0;
  }
  .warn {
    color: var(--red);
    font-size: 1.05rem;
  }
  .soft {
    color: var(--ink-soft);
  }
  .error {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--red);
  }
  .missing {
    text-align: center;
    color: var(--ink-soft);
    font-weight: 600;
  }
</style>
