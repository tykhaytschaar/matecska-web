<script lang="ts">
  import { OPERATION_INFO, OPERATIONS, type MathOperation } from '../core/operation';
  import { selectedCharacter } from '../core/profile';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';
  import type { PlayerStore } from '../store/playerStore.svelte';
  import PointsBadge from './PointsBadge.svelte';

  interface Props {
    store: PlayerStore;
    onPractice: (operation: MathOperation) => void;
    onCollection: () => void;
    onAbout: () => void;
    onPlayers: () => void;
  }
  let { store, onPractice, onCollection, onAbout, onPlayers }: Props = $props();
</script>

<div class="screen">
  <header class="hud">
    <button type="button" class="logo" onclick={onAbout} aria-label="Infó az alkalmazásról">MATECSKA</button>
    <PointsBadge points={store.profile.totalPoints} />
  </header>

  <div class="spacer"></div>

  <div class="hero">
    <CharacterSprite character={selectedCharacter(store.profile)} size={144} />
    <button type="button" class="who" onclick={onPlayers} aria-label="Gyerek váltása">{store.profile.name}</button>
  </div>

  <h1>Mit gyakoroljunk?</h1>

  <div class="grid">
    {#each OPERATIONS as operation}
      <button type="button" class="card op" onclick={() => onPractice(operation)}>
        <span class="symbol">{OPERATION_INFO[operation].symbol}</span>
        <span class="label">{OPERATION_INFO[operation].title}</span>
      </button>
    {/each}
  </div>

  <div class="spacer"></div>

  <button type="button" class="chunky bar" onclick={onCollection}>▦ Karakterek</button>
</div>

<style>
  .hud {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
  }
  /* A logó kattintható: az Infó képernyőt nyitja. */
  .logo {
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
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  /* A gyerek neve kattintható: a gyerekválasztót nyitja. */
  .who {
    padding: 6px 16px;
    border-radius: 999px;
    border: 2px solid var(--line);
    background: var(--card);
    box-shadow: var(--shadow);
    font-weight: 600;
    color: var(--ink);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .who:active {
    opacity: 0.6;
  }
  h1 {
    margin: 0;
    text-align: center;
    font-size: 1.75rem;
    font-weight: 700;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .op {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px;
    color: var(--ink);
    transition: transform 0.1s ease;
  }
  .op:active {
    transform: scale(0.97);
  }
  .symbol {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    color: var(--flame);
  }
  .label {
    font-weight: 600;
  }
</style>
