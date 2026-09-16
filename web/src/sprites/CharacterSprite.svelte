<script lang="ts">
  import { spriteSource, type GameCharacter } from '../core/characters';

  /** `stand`: mozdulatlan (a séta közti megállás); `idle`: helyben pislog. */
  export type Mood = 'idle' | 'stand' | 'walk' | 'happy' | 'yuck';

  interface Props {
    character: GameCharacter;
    mood?: Mood;
    /** Vízszintes tükrözés (jobbra haladó séta). */
    flip?: boolean;
    /** Örülésnél lebegő szív, fanyalgásnál lecsorgó könnycsepp a cica mellett, mint az eredetiben. */
    effects?: boolean;
    /** A kocka mérete CSS pixelben. */
    size?: number;
    /** Kockaváltások másodpercenként. */
    fps?: number;
  }

  let { character, mood = 'idle', flip = false, effects = false, size = 64, fps = 6 }: Props = $props();

  let step = $state(0);

  $effect(() => {
    const id = setInterval(() => {
      step += 1;
    }, 1000 / fps);
    return () => clearInterval(id);
  });

  // Hangulatváltásnál elölről indul az animáció (a szív és a csepp útja is).
  $effect(() => {
    void mood;
    step = 0;
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
      case 'walk':
        return { frame: f.walk[step % f.walk.length], offset: { x: 0, y: 0 } };
      case 'stand':
        return { frame: f.idle[0], offset: { x: 0, y: 0 } };
      default:
        return { frame: f.idle[step % f.idle.length], offset: { x: 0, y: 0 } };
    }
  });

  /** Egy rács-pixel CSS pixelben. */
  const pixel = $derived(size / character.frameSize);
  const url = $derived(spriteSource(character, import.meta.env.BASE_URL));
  const sheet = $derived(`${character.frameCount * size}px ${size}px`);

  /** Szív a fej fölött, az ugrással együtt emelkedik; csepp a fej mellett, lépésenként lejjebb (8 lépés ciklus). */
  const fx = $derived.by(() => {
    if (!effects) return null;
    const f = character.fx;
    if (mood === 'happy') return { half: 0, x: f.heart.x, y: f.heart.y + current.offset.y * 2 };
    if (mood === 'yuck') return { half: 1, x: f.drop.x, y: f.drop.y + (step % 8) * f.drop.fall };
    return null;
  });
</script>

<div class="wrap" style:width="{size}px" style:height="{size}px">
  <div
    class="sprite"
    role="img"
    aria-label={character.name}
    style:width="{size}px"
    style:height="{size}px"
    style:background-image="url('{url}')"
    style:background-size={sheet}
    style:background-position="{-current.frame * size}px 0"
    style:transform="translate({current.offset.x * pixel}px, {current.offset.y * pixel}px){flip ? ' scaleX(-1)' : ''}"
  ></div>
  {#if fx}
    <div
      class="sprite fx"
      aria-hidden="true"
      style:width="{size / 2}px"
      style:height="{size}px"
      style:background-image="url('{url}')"
      style:background-size={sheet}
      style:background-position="{-(character.fxFrame * size + fx.half * (size / 2))}px 0"
      style:transform="translate({fx.x * pixel}px, {fx.y * pixel}px)"
    ></div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    display: inline-block;
    flex: none;
  }
  .sprite {
    position: absolute;
    left: 0;
    top: 0;
    background-repeat: no-repeat;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
</style>
