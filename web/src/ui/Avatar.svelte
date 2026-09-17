<script lang="ts">
  import type { GameCharacter } from '../core/characters';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';

  /** A játékos aktuális karaktere álló pózban, lágy narancs háttéren; kör vagy lekerekített négyzet. */
  interface Props {
    character: GameCharacter;
    size?: number;
    radius?: string;
  }
  let { character, size = 32, radius = '50%' }: Props = $props();
  /** A sprite kicsit kisebb a doboznál, hogy a kontúr ne érjen a szélére. */
  const sprite = $derived(Math.round(size * 0.8));
</script>

<span class="avatar" aria-hidden="true" style:width="{size}px" style:height="{size}px" style:border-radius={radius}>
  <CharacterSprite {character} mood="stand" size={sprite} />
</span>

<style>
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--avatar);
    overflow: hidden;
    flex: none;
    line-height: 0;
  }
</style>
