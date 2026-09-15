<script lang="ts">
  import { OPERATION_INFO } from '../core/operation';
  import type { SessionState } from '../core/session';
  import AnswerCells from './AnswerCells.svelte';

  interface Props {
    session: SessionState;
    onSelect: (index: number) => void;
  }
  let { session, onSelect }: Props = $props();

  const info = $derived(OPERATION_INFO[session.operation]);
  const exercise = $derived(session.exercise);
  const [first, second] = $derived(exercise.operands);
  const count = $derived(session.cells.length);

  /**
   * Oszlopok az egymás alatti elrendezésben: a leghosszabb sor, ahol a második sor
   * az előjel oszlopát is tartalmazza. Az üres hely sora a rubrikák számával számít.
   */
  const columns = $derived(
    Math.max(
      exercise.blank === 'first' ? count : String(first).length,
      (exercise.blank === 'second' ? count : String(second).length) + 1,
      exercise.blank === 'result' ? count : String(exercise.result).length,
    ),
  );

  interface Glyph {
    text: string;
    sign: boolean;
  }

  /** Egy szám jobbra igazítva `columns` oszlopban; az előjel közvetlenül a szám elé kerül. */
  function digitGlyphs(value: number, prefix: string | null): Glyph[] {
    const digits = String(value).split('');
    const padding = columns - digits.length;
    return Array.from({ length: columns }, (_, index) => {
      const digitIndex = index - padding;
      if (digitIndex >= 0) return { text: digits[digitIndex], sign: false };
      if (index === padding - 1 && prefix) return { text: prefix, sign: true };
      return { text: '', sign: false };
    });
  }
</script>

{#snippet cells(size: string = 'var(--cell)', gap: string = 'var(--cell-gap)')}
  <AnswerCells cells={session.cells} selectedIndex={session.selectedIndex} outcome={session.outcome} {onSelect} {size} {gap} />
{/snippet}

{#snippet digitRow(value: number, prefix: string | null)}
  <div class="row">
    {#each digitGlyphs(value, prefix) as glyph}
      <span class="glyph digit" class:sign={glyph.sign}>{glyph.text}</span>
    {/each}
  </div>
{/snippet}

{#if info.layout === 'stacked'}
  <div class="stacked" style:--columns={columns}>
    {#if exercise.blank === 'first'}
      {@render cells()}
    {:else}
      {@render digitRow(first, null)}
    {/if}

    {#if exercise.blank === 'second'}
      <div class="row">
        <span class="glyph digit sign">{info.symbol}</span>
        {@render cells()}
      </div>
    {:else}
      {@render digitRow(second, info.symbol)}
    {/if}

    <div class="rule"></div>

    {#if exercise.blank === 'result'}
      {@render cells()}
    {:else}
      {@render digitRow(exercise.result, null)}
    {/if}
  </div>
{:else if info.layout === 'productRow'}
  <div class="stacked" style:--columns={count}>
    <div class="inline digit">
      <span>{first}</span><span class="sign">{info.symbol}</span><span>{second}</span>
    </div>
    <div class="rule"></div>
    {@render cells()}
  </div>
{:else}
  <div class="equation digit">
    <span>{first}</span><span class="sign">{info.symbol}</span><span>{second}</span><span class="sign">=</span>
    {@render cells('var(--cell-compact)', '6px')}
  </div>
{/if}

<style>
  .stacked {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--cell-gap);
  }
  .row {
    display: flex;
    gap: var(--cell-gap);
    align-items: center;
  }
  .glyph {
    width: var(--cell);
    height: var(--cell);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sign {
    color: var(--flame);
  }
  .rule {
    height: 3px;
    background: var(--ink);
    width: calc(var(--columns) * var(--cell) + (var(--columns) - 1) * var(--cell-gap));
  }
  .inline {
    display: flex;
    gap: 14px;
    align-items: center;
    height: var(--cell);
  }
  .equation {
    --cell-compact: clamp(40px, 11vw, 50px);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: clamp(1.6rem, 7vw, 2.25rem);
    white-space: nowrap;
  }
</style>
