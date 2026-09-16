<script lang="ts">
  import { Capacitor } from '@capacitor/core';
  import type { PlayerStore } from '../store/playerStore.svelte';
  import Avatar from './Avatar.svelte';
  import Icon, { type IconName } from './Icon.svelte';

  interface Props {
    store: PlayerStore;
    onClose: () => void;
    onPlayers: () => void;
    onCollection: () => void;
    onAbout: () => void;
    onPrivacy: () => void;
    onSupport: () => void;
    onDonate: () => void;
    onSignOut: () => void;
  }
  let { store, onClose, onPlayers, onCollection, onAbout, onPrivacy, onSupport, onDonate, onSignOut }: Props = $props();

  /** Az adomány App Store-vásárlás, weben nem érhető el. */
  const native = Capacitor.isNativePlatform();

  const items = $derived<{ label: string; icon: IconName; go: () => void }[]>([
    { label: 'Karakterek', icon: 'chars', go: onCollection },
    { label: 'Az alkalmazásról', icon: 'info', go: onAbout },
    { label: 'Adatvédelem', icon: 'shield', go: onPrivacy },
    { label: 'Segítség', icon: 'help', go: onSupport },
    ...(native ? [{ label: 'Támogasd a fejlesztőt', icon: 'heart' as IconName, go: onDonate }] : []),
  ]);

  let sheet = $state<HTMLElement | null>(null);
  let first = $state<HTMLButtonElement | null>(null);

  /** Nyitáskor a fókusz a játékos-kártyára; a fókusz a lapon belül marad. */
  $effect(() => {
    first?.focus();
  });

  function pick(go: () => void) {
    onClose();
    go();
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !sheet) return;
    const focusable = [...sheet.querySelectorAll<HTMLElement>('button:not([disabled])')];
    if (focusable.length === 0) return;
    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === firstEl) {
      event.preventDefault();
      lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
      event.preventDefault();
      firstEl.focus();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="scrim" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Menü" bind:this={sheet}>
    <div class="handle" aria-hidden="true"></div>

    <button type="button" class="card player" bind:this={first} onclick={() => pick(onPlayers)}>
      <Avatar name={store.profile.name} size={44} fontSize="1.1rem" />
      <span class="player-text">
        <span class="player-name">{store.profile.name}</span>
        <span class="player-meta">{store.profile.totalPoints} pont · Játékos váltása</span>
      </span>
      <span class="chevron"><Icon name="chevron-right" size={18} /></span>
    </button>

    <div class="card list">
      {#each items as item (item.label)}
        <button type="button" class="row" onclick={() => pick(item.go)}>
          <span class="icon"><Icon name={item.icon} /></span>
          <span class="label">{item.label}</span>
          <span class="chevron"><Icon name="chevron-right" size={16} /></span>
        </button>
      {/each}
    </div>

    <div class="bottom">
      <button type="button" class="pill" onclick={() => pick(onSignOut)}>Kijelentkezés</button>
    </div>
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    background: var(--scrim);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 10;
    animation: fade 120ms ease-out;
  }
  .sheet {
    width: 100%;
    max-width: 430px;
    background: var(--paper);
    border-radius: 28px 28px 0 0;
    padding: 10px 16px calc(env(safe-area-inset-bottom, 0px) + 20px);
    box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: rise 180ms ease-out;
  }
  @keyframes rise {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .scrim,
    .sheet {
      animation: none;
    }
  }
  .handle {
    width: 40px;
    height: 5px;
    border-radius: 999px;
    background: var(--line);
    align-self: center;
  }
  .player {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    text-align: left;
    color: var(--ink);
  }
  .player-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .player-name {
    font-weight: 700;
    font-size: 1.05rem;
    overflow-wrap: anywhere;
  }
  .player-meta {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-soft);
  }
  .chevron {
    display: inline-flex;
    color: var(--ink-soft);
    flex: none;
  }
  .list {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 0 16px;
    font-weight: 600;
    font-size: 1rem;
    text-align: left;
    color: var(--ink);
  }
  .row + .row {
    border-top: 1px solid var(--ink-faint);
  }
  .icon {
    display: inline-flex;
    width: 24px;
    justify-content: center;
    color: var(--flame);
    flex: none;
  }
  .label {
    flex: 1;
  }
  .row:active,
  .player:active {
    opacity: 0.6;
  }
  @media (hover: hover) {
    .row:hover {
      background: var(--flame-soft);
    }
    .player:hover {
      border-color: var(--ink-soft);
    }
  }
  .bottom {
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
  }
  .pill {
    padding: 8px 14px;
    border-radius: 999px;
    border: 2px solid var(--line);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--ink);
  }
</style>
