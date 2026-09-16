<script lang="ts">
  import { MODE_INFO, modesOf, OPERATION_INFO, type MathOperation, type PracticeMode } from '../core/operation';
  import type { PlayerStore } from '../store/playerStore.svelte';
  import PointsBadge from './PointsBadge.svelte';

  interface Props {
    store: PlayerStore;
    operation: MathOperation;
    onPick: (mode: PracticeMode) => void;
    onBack: () => void;
  }
  let { store, operation, onPick, onBack }: Props = $props();

  const info = $derived(OPERATION_INFO[operation]);
  const modes = $derived(modesOf(operation));

  /** Példafeladat az alkategória kártyáján, hogy egy pillantásra látszódjon a különbség. */
  function sample(mode: PracticeMode): string {
    switch (mode) {
      case 'addition-single': return '7 + 5 = ▢';
      case 'addition-written': return '352 + 636';
      case 'subtraction-single': return '12 − 5 = ▢';
      case 'subtraction-written': return '805 − 347';
      case 'multiplication-table': return '6 · 7 = ▢';
      case 'multiplication-written': return '352 · 6';
      case 'division-table': return '42 : 6 = ▢';
      case 'division-written': return '456 : 8 = ▢';
    }
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

<div class="screen">
  <header class="top">
    <button type="button" class="back" onclick={onBack} aria-label="Vissza a főképernyőre">‹</button>
    <div class="spacer"></div>
    <PointsBadge points={store.profile.totalPoints} compact />
  </header>

  <div class="spacer"></div>

  <div class="hero">
    <span class="symbol" role="img" aria-label={info.title}>{info.symbol}</span>
  </div>

  <h2>Melyiket gyakoroljuk?</h2>

  <div class="list">
    {#each modes as mode}
      <button type="button" class="card item" onclick={() => onPick(mode)}>
        <span class="sample">{sample(mode)}</span>
        <span class="text">
          <span class="name">{MODE_INFO[mode].title}</span>
          <span class="meta">{MODE_INFO[mode].description}</span>
        </span>
      </button>
    {/each}
  </div>

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
  .spacer {
    flex: 1;
  }
  .hero {
    display: flex;
    justify-content: center;
  }
  .symbol {
    font-size: 5rem;
    font-weight: 700;
    line-height: 1;
    color: var(--flame);
  }
  h2 {
    margin: 0;
    text-align: center;
    font-size: 1.5rem;
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
    padding: 14px 16px;
    color: var(--ink);
    text-align: left;
    transition: transform 0.1s ease;
  }
  .item:active {
    transform: scale(0.98);
  }
  .sample {
    flex: none;
    min-width: 7ch;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--flame);
    white-space: nowrap;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .name {
    font-weight: 700;
  }
  .meta {
    font-size: 0.85rem;
    color: var(--ink-soft);
  }
</style>
