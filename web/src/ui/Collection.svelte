<script lang="ts">
  import { CATALOG } from '../core/characters';
  import { ownsCharacter } from '../core/profile';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';
  import type { ProfileStore } from '../store/profileStore.svelte';
  import PointsBadge from './PointsBadge.svelte';

  interface Props {
    store: ProfileStore;
    onBack: () => void;
  }
  let { store, onBack }: Props = $props();
</script>

<div class="screen">
  <header class="top">
    <button type="button" class="back" onclick={onBack} aria-label="Vissza a főképernyőre">‹</button>
    <h1>Karakterek</h1>
    <PointsBadge points={store.profile.totalPoints} compact />
  </header>

  <div class="grid">
    {#each CATALOG as character}
      {@const owned = ownsCharacter(store.profile, character.id)}
      {@const selected = store.profile.selectedCharacterID === character.id}
      <button
        type="button"
        class="card item"
        class:selected
        class:locked={!owned}
        disabled={!owned}
        onclick={() => store.select(character)}
      >
        <div class="sprite-box">
          <CharacterSprite {character} mood={selected ? 'happy' : 'idle'} size={96} />
        </div>
        <span class="name">{character.name}</span>
        {#if !owned}
          <span class="meta">🔒 {character.price} pont</span>
        {/if}
      </button>
    {/each}
    <div class="item soon">
      <span class="sparkle">✦</span>
      <span class="name">Hamarosan</span>
      <span class="meta">Új karakterek pontért</span>
    </div>
  </div>
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
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 16px;
    color: var(--ink);
    min-height: 200px;
    justify-content: center;
  }
  /* A kiválasztott karakter vastag, színes keretet kap; a többi a sima kártyakeretet. */
  .item.selected {
    box-shadow: inset 0 0 0 2px var(--flame);
    border-color: var(--flame);
  }
  /* Fejtér az örülő animáció ugrásának (max 4 px × 6 = 24 px), hogy ne lógjon ki a kártyából. */
  .sprite-box {
    padding-top: 24px;
    line-height: 0;
  }
  .locked {
    filter: saturate(0);
    opacity: 0.6;
  }
  .name {
    font-weight: 600;
  }
  .meta {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink-soft);
  }
  .soon {
    border: 2px dashed var(--ink-soft);
    border-radius: var(--radius);
    color: var(--ink-soft);
  }
  .sparkle {
    font-size: 2.5rem;
    color: var(--gold);
    height: 96px;
    display: flex;
    align-items: center;
  }
</style>
