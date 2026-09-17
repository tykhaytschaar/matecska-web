<script lang="ts">
  interface Props {
    points: number;
    compact?: boolean;
  }
  let { points, compact = false }: Props = $props();
</script>

<div class="badge" class:compact aria-label="{points} pont">
  <span class="star" aria-hidden="true">★</span>
  <span class="value">{points}</span>
</div>

<style>
  /* A főképernyő fejlécében a Menü gombbal azonos, 44 px magas. */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 44px;
    padding: 0 16px;
    border-radius: 999px;
    background: var(--bar);
    color: #fff;
    font-weight: 700;
    font-size: 1.25rem;
    flex: none;
  }
  .compact {
    height: auto;
    padding: 5px 12px;
    font-size: 1rem;
  }
  .star {
    color: var(--gold);
  }
</style>
