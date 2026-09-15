<script lang="ts">
  interface Props {
    fraction: number;
    bonus: number;
  }
  let { fraction, bonus }: Props = $props();
</script>

<div class="bonus" class:empty={fraction <= 0} aria-hidden="true">
  <span class="bolt">⚡︎</span>
  <div class="track"><div class="fill" style:width="{fraction * 100}%"></div></div>
  <span class="value">+{bonus}</span>
</div>

<style>
  .bonus {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
    color: var(--flame);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .empty {
    color: var(--ink-soft);
  }
  .track {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: var(--ink-faint);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 999px;
    background: var(--flame);
    transition: width 0.1s linear;
  }
  .value {
    width: 32px;
    text-align: right;
  }
</style>
