<script lang="ts">
  import type { Outcome } from '../core/session';

  interface Props {
    cells: readonly (number | null)[];
    selectedIndex: number;
    outcome: Outcome | null;
    onSelect: (index: number) => void;
    /** CSS méret (pl. `var(--cell)` vagy `52px`). */
    size?: string;
    gap?: string;
  }
  let { cells, selectedIndex, outcome, onSelect, size = 'var(--cell)', gap = 'var(--cell-gap)' }: Props = $props();
</script>

<div class="cells" style:gap={gap}>
  {#each cells as cell, index}
    <button
      type="button"
      class="cell"
      class:selected={outcome === null && index === selectedIndex}
      class:correct={outcome?.kind === 'correct'}
      class:wrong={outcome?.kind === 'wrong'}
      style:width={size}
      style:height={size}
      aria-label={cell === null ? 'üres rubrika' : String(cell)}
      aria-pressed={outcome === null && index === selectedIndex}
      disabled={outcome !== null}
      onclick={() => onSelect(index)}
    >
      {#if cell !== null}<span class="digit">{cell}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .cells {
    display: flex;
  }
  .cell {
    border-radius: var(--radius-cell);
    border: 2px solid var(--ink-soft);
    background: var(--card);
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .cell.selected {
    border: 3px solid var(--flame);
    background: var(--flame-soft);
  }
  .cell.correct {
    border-color: var(--green);
    background: rgba(52, 199, 89, 0.15);
    color: var(--green);
  }
  .cell.wrong {
    border-color: var(--red);
    background: rgba(255, 59, 48, 0.15);
    color: var(--red);
  }
</style>
