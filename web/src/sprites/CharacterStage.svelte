<script lang="ts">
  import type { GameCharacter } from '../core/characters';
  import { advanceWalk, isResting, startWalk, type WalkConfig, type WalkState } from '../core/walk';
  import CharacterSprite, { type Mood } from './CharacterSprite.svelte';

  interface Props {
    character: GameCharacter;
    /** A kocka mérete CSS pixelben. */
    size: number;
    /** `walk`: sétál a két szél közt; a többi hangulatnál megáll, ahol van, és úgy reagál. */
    mood: Mood;
    walk: WalkConfig;
    /** Igaz: a sáv kitölti a rendelkezésre álló helyet (flex), a karakter az alján jár. */
    grow?: boolean;
  }
  let { character, size, mood, walk, grow = false }: Props = $props();

  /** A sáv szélessége CSS pixelben, a konténerből. */
  let width = $state(0);
  let walker = $state<WalkState>(startWalk());

  const pixel = $derived(size / character.frameSize);
  const maxX = $derived(Math.max(0, (width - size) / pixel));

  $effect(() => {
    if (mood !== 'walk') return;
    let last = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      // A rAF időbélyege lehet korábbi az induláskor mértnél; a lépés nem mehet visszafelé.
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      walker = advanceWalk(walker, dt, maxX, walk);
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  });

  // Ha a sáv összemegy (pl. forgatás), a cica maradjon a sávban.
  $effect(() => {
    if (walker.x > maxX) walker = { ...walker, x: maxX };
  });

  const shownMood = $derived<Mood>(mood === 'walk' && isResting(walker) ? 'stand' : mood);
  const flip = $derived(mood === 'walk' && !isResting(walker) && walker.direction === 1);
</script>

<!-- A szív és az ugrás a sáv fölé lóg ki (overflow visible), külön fejteret nem foglalunk. -->
<div class="stage" class:grow bind:clientWidth={width} style:min-height="{size}px" style:height={grow ? undefined : `${size}px`}>
  <div class="cat" style:transform="translateX({walker.x * pixel}px)" style:bottom="0">
    <CharacterSprite {character} mood={shownMood} {flip} effects {size} />
  </div>
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    overflow: visible;
  }
  .stage.grow {
    flex: 1;
  }
  .cat {
    position: absolute;
    left: 0;
    line-height: 0;
    will-change: transform;
  }
</style>
