<script lang="ts">
  import { OPERATION_INFO, OPERATIONS, type MathOperation } from '../core/operation';
  import { selectedCharacter } from '../core/profile';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';
  import type { ProfileStore } from '../store/profileStore.svelte';
  import PointsBadge from './PointsBadge.svelte';

  interface Props {
    store: ProfileStore;
    onPractice: (operation: MathOperation) => void;
    onCollection: () => void;
  }
  let { store, onPractice, onCollection }: Props = $props();
</script>

<div class="screen">
  <header class="hud">
    <span class="logo">MATECSKA</span>
    <PointsBadge points={store.profile.totalPoints} />
  </header>

  <div class="spacer"></div>

  <div class="hero">
    <CharacterSprite character={selectedCharacter(store.profile)} size={144} />
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

  <button type="button" class="chunky bar" onclick={onCollection}>▦ Gyűjtemény</button>
</div>

<style>
  .hud {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
  }
  .logo {
    font-weight: 900;
    letter-spacing: 0.2em;
    font-size: 1.05rem;
  }
  .spacer {
    flex: 1;
  }
  .hero {
    display: flex;
    justify-content: center;
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
