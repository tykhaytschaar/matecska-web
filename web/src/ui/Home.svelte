<script lang="ts">
  import { OPERATION_INFO, OPERATIONS, type MathOperation } from '../core/operation';
  import { HOME_WALK } from '../core/walk';
  import CharacterStage from '../sprites/CharacterStage.svelte';
  import type { PlayerStore } from '../store/playerStore.svelte';
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';
  import MenuButton from './MenuButton.svelte';
  import PointsBadge from './PointsBadge.svelte';

  interface Props {
    store: PlayerStore;
    onPractice: (operation: MathOperation) => void;
    onCollection: () => void;
    onMenu: () => void;
    onPlayers: () => void;
  }
  let { store, onPractice, onCollection, onMenu, onPlayers }: Props = $props();
</script>

<div class="screen">
  <header class="hud">
    <span class="logo">MATECSKA</span>
    <div class="right">
      <PointsBadge points={store.profile.totalPoints} />
      <MenuButton onclick={onMenu} />
    </div>
  </header>

  <div class="spacer"></div>

  <div class="hero">
    <CharacterStage character={store.character} size={112} mood="walk" walk={HOME_WALK} />
    <button type="button" class="who" onclick={onPlayers} aria-label="Játékos váltása">
      <Avatar name={store.profile.name} />
      <span class="who-name">{store.profile.name}</span>
      <span class="who-switch">Váltás <Icon name="chevron-down" size={14} /></span>
    </button>
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
  .logo {
    font-weight: 900;
    letter-spacing: 0.2em;
    font-size: 1.05rem;
    padding: 8px 0;
    color: var(--ink);
  }
  .right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .spacer {
    flex: 1;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  /* Játékos-chip: avatár, név, „Váltás”; a játékosválasztót nyitja. */
  .who {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px 6px 6px;
    border-radius: 999px;
    border: 2px solid var(--line);
    background: var(--card);
    box-shadow: var(--shadow);
    color: var(--ink);
    max-width: 100%;
    transition: opacity 0.1s ease;
  }
  .who:active {
    opacity: 0.6;
  }
  .who-name {
    font-weight: 700;
    font-size: 1.05rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .who-switch {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--ink-soft);
    font-size: 0.85rem;
    font-weight: 600;
    flex: none;
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
