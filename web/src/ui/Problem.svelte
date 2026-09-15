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
  const [first, second] = $derived(session.exercise.operands);
  const count = $derived(session.cells.length);

  /** Oszlopok az egymás alatti elrendezésben: legalább egy oszlop az előjelnek a leghosszabb szám előtt. */
  const columns = $derived(Math.max(count, Math.max(String(first).length, String(second).length) + 1));

  function digitCells(value: number, prefix: string | null): (string | null)[] {
    const digits = String(value).split('');
    const padding = columns - digits.length;
    return Array.from({ length: columns }, (_, index) => {
      const digitIndex = index - padding;
      if (digitIndex >= 0) return digits[digitIndex];
      if (index === padding - 1 && prefix) return prefix;
      return null;
    });
  }
</script>

{#if info.layout === 'stacked'}
  <div class="stacked" style:--columns={columns}>
    {#each [digitCells(first, null), digitCells(second, info.symbol)] as row}
      <div class="row">
        {#each row as glyph, index}
          <span class="glyph digit" class:sign={glyph !== null && index < columns - String(first).length && glyph === info.symbol}>{glyph ?? ''}</span>
        {/each}
      </div>
    {/each}
    <div class="rule"></div>
    <AnswerCells cells={session.cells} selectedIndex={session.selectedIndex} outcome={session.outcome} {onSelect} />
  </div>
{:else if info.layout === 'productRow'}
  <div class="stacked" style:--columns={count}>
    <div class="inline digit">
      <span>{first}</span><span class="sign">{info.symbol}</span><span>{second}</span>
    </div>
    <div class="rule"></div>
    <AnswerCells cells={session.cells} selectedIndex={session.selectedIndex} outcome={session.outcome} {onSelect} />
  </div>
{:else}
  <div class="equation digit">
    <span>{first}</span><span class="sign">{info.symbol}</span><span>{second}</span><span class="sign">=</span>
    <AnswerCells cells={session.cells} selectedIndex={session.selectedIndex} outcome={session.outcome} {onSelect} size="var(--cell-compact)" gap="6px" />
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
