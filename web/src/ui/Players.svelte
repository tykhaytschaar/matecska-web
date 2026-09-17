<script lang="ts">
  import { buildProfile, freshState } from '../core/player';
  import { selectedCharacter } from '../core/profile';
  import type { PlayerStore } from '../store/playerStore.svelte';
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';
  import MenuButton from './MenuButton.svelte';
  import PointsBadge from './PointsBadge.svelte';

  interface Props {
    store: PlayerStore;
    /** Egy játékos kiválasztása után; `onBack` csak akkor, ha van aktív játékos, akihez visszatérhetünk. */
    onPick: () => void;
    onBack: (() => void) | null;
    /** A menü; aktív játékos nélkül a fejlécből érhető el, hogy az Infó, Adatvédelem, Segítség ne vesszen el. */
    onMenu: () => void;
    /** Játékos szerkesztése (név, törlés). */
    onEdit: (id: string) => void;
  }
  let { store, onPick, onBack, onMenu, onEdit }: Props = $props();

  let adding = $state(false);
  let name = $state('');
  let busy = $state<string | null>(null);
  let error = $state<string | null>(null);

  const nameValid = $derived(name.trim().length > 0 && name.trim().length <= 40);
  /** Az első játékos átveszi a fiók előtti helyi profilt, ha az nem üres. */
  const importing = $derived(store.players.length === 0 && store.legacy && store.legacy.totalPoints > 0 ? store.legacy : null);

  const entries = $derived(
    store.players.map((listing) => {
      const catalog = store.catalog.characters;
      const profile = buildProfile(freshState(listing.player, listing.summary), catalog);
      return { id: listing.player.id, name: listing.player.name, profile, character: selectedCharacter(profile, catalog) };
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
    <h2 class="title">Játékosok</h2>
    {#if onBack}
      <span class="placeholder"></span>
    {:else}
      <MenuButton onclick={onMenu} />
    {/if}
  </header>

  <div class="spacer"></div>

  <h1>Ki játszik?</h1>

  <div class="list">
    {#each entries as entry (entry.id)}
      <!-- Külön kiválasztó és szerkesztő gomb egy kártyában: gombot gombba nem ágyazunk. -->
      <div class="card item" class:active={store.active?.player.id === entry.id}>
        <button type="button" class="select" disabled={busy !== null} onclick={() => pick(entry.id)}>
          <Avatar character={entry.character} size={48} radius="14px" />
          <span class="text">
            <span class="name">{entry.name}</span>
            <span class="status">{store.active?.player.id === entry.id ? 'Most játszik' : 'Koppints a váltáshoz'}</span>
          </span>
          <PointsBadge points={entry.profile.totalPoints} compact />
        </button>
        <button type="button" class="edit" aria-label="{entry.name} szerkesztése" disabled={busy !== null} onclick={() => onEdit(entry.id)}>
          <Icon name="pencil" />
        </button>
      </div>
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
          <p class="hint">A készüléken mentett {importing.totalPoints} pont és a statisztika ehhez a játékoshoz kerül.</p>
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
        + Új játékos
      </button>
    {/if}
  </div>

  {#if store.offline && entries.length === 0}
    <p class="hint center">Nincs kapcsolat, a játékoslista most nem tölthető be.</p>
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
  .title {
    flex: 1;
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    text-align: center;
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
    gap: 8px;
    padding-right: 8px;
    color: var(--ink);
    min-height: 72px;
  }
  .select {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 0 12px 16px;
    text-align: left;
    color: var(--ink);
    min-width: 0;
    transition: opacity 0.1s ease;
  }
  .select:active:not(:disabled) {
    opacity: 0.6;
  }
  .edit {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-soft);
    flex: none;
  }
  .edit:active {
    background: var(--flame-soft);
    color: var(--flame);
  }
  @media (hover: hover) {
    .edit:hover {
      background: var(--flame-soft);
      color: var(--flame);
    }
  }
  .item.active {
    border-color: var(--flame);
    box-shadow: inset 0 0 0 1px var(--flame), var(--shadow);
  }
  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .name {
    font-weight: 600;
    font-size: 1.125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .status {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-soft);
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
