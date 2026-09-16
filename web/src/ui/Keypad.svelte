<script lang="ts">
  interface Props {
    disabled?: boolean;
    onDigit: (digit: number) => void;
    onDelete: () => void;
  }
  let { disabled = false, onDigit, onDelete }: Props = $props();

  const rows = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
</script>

<div class="keypad" class:disabled>
  {#each rows as row}
    <div class="row">
      {#each row as digit}
        <button type="button" class="key" {disabled} onclick={() => onDigit(digit)}>{digit}</button>
      {/each}
    </div>
  {/each}
  <div class="row">
    <span class="key spacer" aria-hidden="true"></span>
    <button type="button" class="key" {disabled} onclick={() => onDigit(0)}>0</button>
    <button type="button" class="key" {disabled} onclick={onDelete} aria-label="Törlés">⌫</button>
  </div>
</div>

<style>
  .keypad {
    display: flex;
    flex-direction: column;
    gap: clamp(6px, 1.2svh, 10px);
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
  }
  .row {
    display: flex;
    gap: clamp(6px, 1.2svh, 10px);
  }
  .key {
    flex: 1;
    height: var(--key-height);
    border-radius: 16px;
    border: 2px solid var(--line);
    box-shadow: var(--shadow);
    background: var(--card);
    color: var(--ink);
    font-size: 1.75rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s ease;
  }
  .key:active:not(:disabled) {
    background: var(--flame-soft);
  }
  .key:disabled {
    color: var(--ink-soft);
    box-shadow: none;
  }
  .spacer {
    visibility: hidden;
  }
</style>
