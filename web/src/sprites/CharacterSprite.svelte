<script lang="ts">
  import type { GameCharacter } from '../core/characters';

  export type Mood = 'idle' | 'happy' | 'yuck';

  interface Props {
    character: GameCharacter;
    mood?: Mood;
    /** A kocka mérete CSS pixelben. */
    size?: number;
    /** Kockaváltások másodpercenként. */
    fps?: number;
  }

  let { character, mood = 'idle', size = 64, fps = 6 }: Props = $props();

  let step = $state(0);

  $effect(() => {
    const id = setInterval(() => {
      step += 1;
    }, 1000 / fps);
    return () => clearInterval(id);
  });

  const current = $derived.by(() => {
    const f = character.frames;
    switch (mood) {
      case 'happy': {
        const i = step % f.happy.length;
        return { frame: f.happy[i], offset: f.happyOffsets[i] };
      }
      case 'yuck': {
        const i = step % f.yuck.length;
        return { frame: f.yuck[i], offset: f.yuckOffsets[i] };
      }
      default:
        return { frame: f.idle[step % f.idle.length], offset: { x: 0, y: 0 } };
    }
  });

  const pixel = $derived(size / 16);
  const url = $derived(`${import.meta.env.BASE_URL}sprites/${character.spriteSheet}`);
</script>

<div
  class="sprite"
  role="img"
  aria-label={character.name}
  style:width="{size}px"
  style:height="{size}px"
  style:background-image="url('{url}')"
  style:background-size="{character.frameCount * size}px {size}px"
  style:background-position="{-current.frame * size}px 0"
  style:transform="translate({current.offset.x * pixel}px, {current.offset.y * pixel}px)"
></div>

<style>
  .sprite {
    display: inline-block;
    background-repeat: no-repeat;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    flex: none;
  }
</style>
