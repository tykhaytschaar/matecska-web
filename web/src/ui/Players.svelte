<script lang="ts">
  import { buildProfile, freshState } from '../core/player';
  import { selectedCharacter } from '../core/profile';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';
  import type { PlayerStore } from '../store/playerStore.svelte';
  import PointsBadge from './PointsBadge.svelte';

  interface Props {
    store: PlayerStore;
    /** Egy gyerek kiválasztása után; `onBack` csak akkor, ha van aktív gyerek, akihez visszatérhetünk. */
    onPick: () => void;
    onBack: (() => void) | null;
    onAbout: () => void;
  }
  let { store, onPick, onBack, onAbout }: Props = $props();

  let adding = $state(false);
  let name = $state('');
  let busy = $state<string | null>(null);
  let error = $state<string | null>(null);

  const nameValid = $derived(name.trim().length > 0 && name.trim().length <= 40);
  /** Az első gyerek átveszi a fiók előtti helyi profilt, ha az nem üres. */
  const importing = $derived(store.players.length === 0 && store.legacy && store.legacy.totalPoints > 0 ? store.legacy : null);

  const entries = $derived(
    store.players.map((listing) => {
      const profile = buildProfile(freshState(listing.player, listing.summary));
      return { id: listing.player.id, name: listing.player.name, profile, character: selectedCharacter(profile) };
    }),
  );

  async function pick(id: string) {
    if (busy) return;
    busy = id;
    try {
      await store.activate(id);
      onPick();
    } finally {
      busy = null;
    }
  }

  async function create() {
    if (!nameValid || busy) return;
    busy = 'new';
    error = null;
    try {
      await store.createPlayer(name.trim());
      adding = false;
      name = '';
      onPick();
    } catch {
      error = 'Nem sikerült létrehozni. Van internetkapcsolat?';
    } finally {
      busy = null;
    }
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (adding) adding = false;
      else onBack?.();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

<div class="screen">
  <header class="top">
    {#if onBack}
      <button type="button" class="back" onclick={onBack} aria-label="Vissza a főképernyőre">‹</button>
    {:else}
      <span class="placeholder"></span>
    {/if}
    <button type="button" class="logo" onclick={onAbout} aria-label="Infó és fiók">MATECSKA</button>
    <span class="placeholder"></span>
  </header>

  <div class="spacer"></div>

  <h1>Ki játszik?</h1>

  <div class="list">
    {#each entries as entry (entry.id)}
      <button
        type="button"
        class="card item"
        class:active={store.active?.player.id === entry.id}
        disabled={busy !== null}
        onclick={() => pick(entry.id)}
      >
        <CharacterSprite character={entry.character} size={48} />
        <span class="name">{entry.name}</span>
        <PointsBadge points={entry.profile.totalPoints} compact />
      </button>
    {/each}

    {#if adding}
      <form class="card form" onsubmit={(e) => { e.preventDefault(); void create(); }}>
        <input
          type="text"
          bind:value={name}
          placeholder="Becenév"
          maxlength="40"
          autocomplete="off"
          autocapitalize="words"
          disabled={busy !== null}
        />
        {#if importing}
          <p class="hint">A készüléken mentett {importing.totalPoints} pont és a statisztika ehhez a gyerekhez kerül.</p>
        {/if}
        {#if error}<p class="error" role="alert">{error}</p>{/if}
        <div class="actions">
          <button type="button" class="pill" onclick={() => (adding = false)} disabled={busy !== null}>Mégse</button>
          <button type="submit" class="pill primary" disabled={!nameValid || busy !== null}>
            {busy === 'new' ? 'Mentés…' : 'Létrehozás'}
          </button>
        </div>
      </form>
    {:else}
      <button type="button" class="item add" onclick={() => (adding = true)} disabled={busy !== null}>
        + Új gyerek
      </button>
    {/if}
  </div>

  {#if store.offline && entries.length === 0}
    <p class="hint center">Nincs kapcsolat, a gyereklista most nem tölthető be.</p>
  {/if}

  <div class="spacer"></div>
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
  .placeholder {
    width: 40px;
  }
  .logo {
    flex: 1;
    font-weight: 900;
    letter-spacing: 0.2em;
    font-size: 1.05rem;
    padding: 8px 0;
    color: var(--ink);
    transition: opacity 0.1s ease;
  }
  .logo:active {
    opacity: 0.6;
  }
  .spacer {
    flex: 1;
  }
  h1 {
    margin: 0;
    text-align: center;
    font-size: 1.75rem;
    font-weight: 700;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    color: var(--ink);
    min-height: 72px;
    text-align: left;
    transition: transform 0.1s ease;
  }
  .item:active:not(:disabled) {
    transform: scale(0.98);
  }
  .item.active {
    border-color: var(--flame);
    box-shadow: inset 0 0 0 1px var(--flame), var(--shadow);
  }
  .name {
    flex: 1;
    font-weight: 600;
    font-size: 1.125rem;
    overflow-wrap: anywhere;
  }
  .add {
    justify-content: center;
    border: 2px dashed var(--ink-soft);
    border-radius: var(--radius);
    color: var(--ink-soft);
    font-weight: 600;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
  }
  input {
    font: inherit;
    font-size: 1.125rem;
    padding: 12px 14px;
    border-radius: var(--radius-cell);
    border: 2px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    width: 100%;
  }
  input:focus {
    outline: none;
    border-color: var(--flame);
  }
  .hint {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .center {
    text-align: center;
  }
  .error {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--red);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .pill {
    padding: 8px 14px;
    border-radius: 999px;
    border: 2px solid var(--line);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--ink);
  }
  .pill.primary {
    background: var(--flame);
    border-color: transparent;
    color: #fff;
  }
  .pill:disabled {
    opacity: 0.5;
  }
</style>
