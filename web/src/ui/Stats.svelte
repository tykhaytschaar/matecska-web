<script lang="ts">
  import { MODE_INFO, OPERATION_INFO } from '../core/operation';
  import { averageBonus, correctRatio, groupByOperation, PERIOD_LABEL, type ModeStats, type StatsPeriod } from '../core/stats';
  import type { PlayerStore } from '../store/playerStore.svelte';

  interface Props {
    store: PlayerStore;
    onBack: () => void;
  }
  let { store, onBack }: Props = $props();

  const PERIODS: StatsPeriod[] = ['day', 'month', 'all'];
  const SHORT: Record<StatsPeriod, string> = { day: 'Napi', month: 'Havi', all: 'Összes' };

  let period = $state<StatsPeriod>('day');
  let stats = $state<ModeStats[] | null>(null);
  let sessions = $state(0);
  let offline = $state(false);

  /** Időszakváltásnál újratöltés; a régi adat marad, amíg az új meg nem jön. */
  $effect(() => {
    const current = period;
    void store.statsFor(current).then((result) => {
      if (period !== current) return;
      stats = result.stats;
      sessions = result.sessions;
      offline = result.offline;
    });
  });

  const groups = $derived(stats ? groupByOperation(stats) : []);
  const totalSolved = $derived(groups.reduce((sum, g) => sum + g.total.solved, 0));
  const fmtBonus = (value: number | null) => (value === null ? '–' : value.toLocaleString('hu-HU', { maximumFractionDigits: 1 }));

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

<div class="screen">
  <header class="top">
    <button type="button" class="back" onclick={onBack} aria-label="Vissza">‹</button>
    <h1>Statisztika</h1>
    <span class="placeholder"></span>
  </header>

  <div class="segments" role="tablist" aria-label="Időszak">
    {#each PERIODS as p (p)}
      <button type="button" role="tab" class="segment" class:on={period === p} aria-selected={period === p} onclick={() => (period = p)}>
        {SHORT[p]}
      </button>
    {/each}
  </div>

  <p class="lead">
    <strong>{store.profile.name}</strong> · {PERIOD_LABEL[period].toLowerCase()}
    {#if stats}· {totalSolved} megoldott feladat · {sessions} munkamenet{/if}
    {#if offline}· <span class="warn">nincs kapcsolat, csak a helyi adatok</span>{/if}
  </p>

  {#if !stats}
    <p class="meta center">Betöltés…</p>
  {:else}
    {#each groups as group (group.operation)}
      <section class="card block" aria-labelledby="op-{group.operation}">
        <div class="row head">
          <span class="sym">{OPERATION_INFO[group.operation].symbol}</span>
          <h2 id="op-{group.operation}">{OPERATION_INFO[group.operation].title}</h2>
          <span class="num">{group.total.solved}</span>
          <span class="ratio">{correctRatio(group.total) === null ? '–' : `${correctRatio(group.total)}%`}</span>
          <span class="bonus">{fmtBonus(averageBonus(group.total))}</span>
        </div>
        <div class="legend" aria-hidden="true">
          <span></span><span></span><span class="num">db</span><span class="ratio">helyes</span><span class="bonus">bónusz</span>
        </div>
        {#each group.modes as m (m.mode)}
          <div class="row" class:empty={m.solved === 0}>
            <span class="sym"></span>
            <span class="title">{MODE_INFO[m.mode].title}</span>
            <span class="num">{m.solved}</span>
            <span class="ratio">{correctRatio(m) === null ? '–' : `${correctRatio(m)}%`}</span>
            <span class="bonus">{fmtBonus(averageBonus(m))}<span class="of">&nbsp;/ {MODE_INFO[m.mode].basePoints}</span></span>
          </div>
        {/each}
      </section>
    {/each}
    <p class="meta">Az átlagos bónusz a helyes válaszok gyorsasági bónuszának átlaga a mód maximumához képest; a korábbi, bónusz nélkül rögzített válaszok nem számítanak bele. Munkamenet: összefüggő gyakorlás, 5 perc szünet vagy játékosváltás után új kezdődik.</p>
  {/if}
</div>

<style>
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .back {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    font-size: 2rem;
    line-height: 1;
    color: var(--flame);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  h1 {
    flex: 1;
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    text-align: center;
  }
  .placeholder {
    width: 40px;
  }
  .segments {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .segment {
    padding: 8px 10px;
    border-radius: 999px;
    border: 2px solid var(--line);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--ink);
    background: var(--card);
  }
  .segment.on {
    background: var(--flame);
    border-color: transparent;
    color: #fff;
  }
  .lead {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink-soft);
    text-align: center;
  }
  .lead strong {
    color: var(--ink);
    font-weight: 700;
  }
  .warn {
    color: var(--flame);
    font-weight: 600;
  }
  .block {
    padding: 12px 16px 14px;
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 8px 0;
    font-weight: 600;
    border-top: 1px solid var(--ink-faint);
  }
  .row.head {
    border-top: none;
    padding-top: 0;
  }
  .row.empty {
    color: var(--ink-soft);
  }
  h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sym {
    display: inline-block;
    width: 1.4rem;
    color: var(--flame);
    font-weight: 700;
    flex: none;
  }
  /* A cím rövidül, nem tolja el az oszlopokat, ha hosszú (pl. „Háromjegyűek”). */
  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Az oszlopok rem-ben, hogy a fejléc nagyobb betűje és a legenda kisebb betűje mellett is egy vonalban legyenek. */
  .num {
    width: 2.4rem;
    text-align: right;
    flex: none;
  }
  .ratio {
    width: 3rem;
    text-align: right;
    font-size: 0.85rem;
    color: var(--ink-soft);
    flex: none;
  }
  .bonus {
    width: 4rem;
    text-align: right;
    font-size: 0.85rem;
    color: var(--ink-soft);
    flex: none;
    white-space: nowrap;
  }
  .row.head .num,
  .row.head .ratio,
  .row.head .bonus {
    color: var(--ink);
    font-size: 1rem;
  }
  .of {
    font-size: 0.75rem;
  }
  .legend {
    display: flex;
    gap: 6px;
    font-size: 0.7rem;
    color: var(--ink-soft);
    padding-bottom: 2px;
  }
  .legend .num,
  .legend .ratio,
  .legend .bonus {
    font-size: 0.7rem;
    color: var(--ink-soft);
  }
  .legend span:first-child {
    width: 1.4rem;
    flex: none;
  }
  .legend span:nth-child(2) {
    flex: 1;
  }
  .meta {
    margin: 0;
    font-size: 0.8rem;
    color: var(--ink-soft);
  }
  .center {
    text-align: center;
  }
</style>
