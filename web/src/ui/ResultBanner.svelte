<script lang="ts">
  import { totalPoints } from '../core/scoring';
  import type { Outcome } from '../core/session';

  interface Props {
    outcome: Outcome | null;
  }
  let { outcome }: Props = $props();
</script>

<!-- Mindig foglalt hely: az eredmény megjelenése nem tolja el a feladatot. -->
<div class="slot" role="status" aria-live="polite">
  {#if outcome?.kind === 'correct'}
    <div class="banner correct">
      <div class="title">✓ Helyes! +{totalPoints(outcome.score)} pont</div>
      <div class="detail">
        {#if outcome.score.bonus > 0}
          {outcome.score.base} alap + {outcome.score.bonus} gyorsasági bónusz
        {:else}
          {outcome.score.base} alap pont
        {/if}
      </div>
    </div>
  {:else if outcome?.kind === 'wrong'}
    <div class="banner wrong">
      <div class="title">✕ Helytelen −{outcome.score.penalty} pont</div>
      <div class="detail">A helyes válasz: <strong>{outcome.correctAnswer}</strong></div>
    </div>
  {/if}
</div>

<style>
  .slot {
    height: var(--banner-height);
    width: 100%;
    display: flex;
    align-items: center;
  }
  .banner {
    width: 100%;
    max-height: var(--banner-height);
    padding: 8px 20px;
    border-radius: var(--radius);
    color: #fff;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
    animation: pop 0.2s ease-out;
  }
  .correct {
    background: var(--green);
  }
  .wrong {
    background: var(--red);
  }
  .title {
    font-size: clamp(1rem, 2.2svh, 1.15rem);
    font-weight: 700;
  }
  .detail {
    font-size: 0.9rem;
    opacity: 0.95;
  }
  .detail strong {
    font-size: clamp(1.25rem, 2.8svh, 1.6rem);
    font-weight: 700;
    vertical-align: middle;
    margin-left: 4px;
  }
  @keyframes pop {
    from {
      transform: scale(0.96);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
