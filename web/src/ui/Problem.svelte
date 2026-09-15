<script lang="ts">
  import { OPERATION_INFO } from '../core/operation';
  import type { SessionState } from '../core/session';
  import AnswerCells from './AnswerCells.svelte';

  interface Props {
    session: SessionState;
    onSelect: (index: number) => void;
    onSelectScratch?: (row: number, col: number) => void;
  }
  let { session, onSelect, onSelectScratch = () => {} }: Props = $props();

  const info = $derived(OPERATION_INFO[session.operation]);
  const exercise = $derived(session.exercise);
  const [first, second] = $derived(exercise.operands);
  const count = $derived(session.cells.length);

  /**
   * Oszlopok az egymás alatti elrendezésben: a leghosszabb sor, ahol a második sor
   * az előjel oszlopát is tartalmazza. Az üres hely sora a rubrikák számával számít.
   * Szorzásnál a `352 · 6` sor jegyei és a jel egy-egy oszlop; a szorzat rubrikái a szorzandó
   * alá kerülnek (egyesek az egyesek alatt), a `· 6` jobbra kilóg mellettük, mint a füzetben.
   */
  const productTrail = $derived(1 + String(second).length);
  const columns = $derived(
    info.layout === 'productRow'
      ? Math.max(count, String(first).length) + productTrail
      : Math.max(
          exercise.blank === 'first' ? count : String(first).length,
          (exercise.blank === 'second' ? count : String(second).length) + 1,
          exercise.blank === 'result' ? count : String(exercise.result).length,
        ),
  );

  /** Szorzás sora: szorzandó jegyei, műveleti jel, szorzó jegyei, jobbra zárva `columns` oszlopban. */
  const productGlyphs = $derived.by((): Glyph[] => {
    const body: Glyph[] = [
      ...String(first).split('').map((d) => ({ text: d, sign: false })),
      { text: info.symbol, sign: true },
      ...String(second).split('').map((d) => ({ text: d, sign: false })),
    ];
    const padding = Array.from({ length: columns - body.length }, () => ({ text: '', sign: false }));
    return [...padding, ...body];
  });

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
  <AnswerCells
    cells={session.cells}
    selectedIndex={session.selectedIndex}
    outcome={session.outcome}
    active={session.scratchSelection === null}
    {onSelect}
    {size}
    {gap}
  />
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
  <div class="stacked" style:--columns={columns}>
    <div class="row">
      {#each productGlyphs as glyph}
        <span class="glyph digit" class:sign={glyph.sign}>{glyph.text}</span>
      {/each}
    </div>
    <div class="rule"></div>
    <div class="row">
      {@render cells()}
      {#each { length: productTrail } as _}
        <span class="glyph" aria-hidden="true"></span>
      {/each}
    </div>
  </div>
{:else}
  <!-- Osztás: `456 : 8 = [ ][ ][ ]` rubrikaszélességű oszlopokban, alatta a nem kötelező
       maradék-rács az osztandó jegyei alatt, mint a füzetben. -->
  <div class="division">
    <div class="row compact">
      {#each String(first).split('') as d}
        <span class="glyph digit">{d}</span>
      {/each}
      <span class="glyph narrow digit sign">{info.symbol}</span>
      {#each String(second).split('') as d}
        <span class="glyph digit">{d}</span>
      {/each}
      <span class="glyph narrow digit sign">=</span>
      {@render cells('var(--cell-compact)', 'var(--gap-compact)')}
    </div>
    {#each session.scratch as scratchRow, row}
      <div class="row compact scratch">
        <AnswerCells
          cells={scratchRow}
          selectedIndex={session.scratchSelection?.row === row ? session.scratchSelection.col : -1}
          outcome={session.outcome}
          active={session.scratchSelection?.row === row}
          muted
          label="maradék-rubrika"
          onSelect={(col) => onSelectScratch(row, col)}
          size="var(--cell-compact)"
          gap="var(--gap-compact)"
        />
      </div>
    {/each}
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
  .division {
    --cell-compact: clamp(32px, min(9.2vw, 5.6svh), 46px);
    --gap-compact: 4px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--gap-compact);
  }
  .compact {
    gap: var(--gap-compact);
  }
  .compact .glyph {
    width: var(--cell-compact);
    height: var(--cell-compact);
    font-size: clamp(1.4rem, 6vw, 2rem);
  }
  .compact .glyph.narrow {
    width: calc(var(--cell-compact) * 0.6);
  }
</style>
