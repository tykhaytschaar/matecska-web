<script lang="ts">
  import { APP_INFO, formatBuildTime } from '../core/appInfo';
  import { CAT } from '../core/characters';
  import { OPERATION_INFO, OPERATIONS } from '../core/operation';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';
  import type { ProfileStore } from '../store/profileStore.svelte';

  interface Props {
    store: ProfileStore;
    onBack: () => void;
  }
  let { store, onBack }: Props = $props();

  /** A nullázás két koppintás: az első csak a megerősítő gombokat mutatja. */
  let confirmingReset = $state(false);

  const stats = $derived(
    OPERATIONS.map((operation) => {
      const s = store.profile.stats[operation] ?? { solved: 0, correct: 0 };
      return { operation, ...s, ratio: s.solved > 0 ? Math.round((s.correct / s.solved) * 100) : null };
    }),
  );
  const totalSolved = $derived(stats.reduce((sum, s) => sum + s.solved, 0));

  function handleReset() {
    store.resetStats();
    confirmingReset = false;
  }

  const rows = [
    { label: 'Verzió', value: APP_INFO.version },
    { label: 'Build ideje', value: formatBuildTime(APP_INFO.builtAt) },
    { label: 'Fejlesztő', value: APP_INFO.developer },
  ];

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (confirmingReset) confirmingReset = false;
      else onBack();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

<div class="screen">
  <header class="top">
    <button type="button" class="back" onclick={onBack} aria-label="Vissza a főképernyőre">‹</button>
    <h1>Infó</h1>
    <span class="placeholder"></span>
  </header>

  <div class="spacer"></div>

  <div class="hero">
    <CharacterSprite character={CAT} size={96} />
    <span class="name">{APP_INFO.name}</span>
    <span class="tagline">Alapműveletek gyakorlása pontokért és karakterekért</span>
  </div>

  <dl class="card info">
    {#each rows as row}
      <div class="row">
        <dt>{row.label}</dt>
        <dd>{row.value}</dd>
      </div>
    {/each}
  </dl>

  <section class="card stats" aria-labelledby="stats-title">
    <h2 id="stats-title">Statisztika</h2>
    <table>
      <thead>
        <tr><th scope="col">Művelet</th><th scope="col" class="num">Megoldott</th><th scope="col" class="num">Helyes</th></tr>
      </thead>
      <tbody>
        {#each stats as s}
          <tr>
            <th scope="row"><span class="sym">{OPERATION_INFO[s.operation].symbol}</span>{OPERATION_INFO[s.operation].title}</th>
            <td class="num">{s.solved}</td>
            <td class="num">{s.correct}{#if s.ratio !== null}<span class="ratio">{s.ratio}%</span>{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if confirmingReset}
      <div class="confirm">
        <span>Biztosan nullázod? A pontok megmaradnak.</span>
        <div class="actions">
          <button type="button" class="pill" onclick={() => (confirmingReset = false)}>Mégse</button>
          <button type="button" class="pill danger" onclick={handleReset}>Nullázás</button>
        </div>
      </div>
    {:else}
      <button type="button" class="pill reset" disabled={totalSolved === 0} onclick={() => (confirmingReset = true)}>
        Statisztika nullázása
      </button>
    {/if}
  </section>

  <div class="spacer"></div>
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
  .spacer {
    flex: 1;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }
  .name {
    font-weight: 900;
    letter-spacing: 0.2em;
    font-size: 1.25rem;
    text-transform: uppercase;
  }
  .tagline {
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .info {
    margin: 0;
    padding: 4px 16px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    padding: 12px 0;
  }
  .row + .row {
    border-top: 1px solid var(--ink-faint);
  }
  dt {
    font-weight: 600;
    color: var(--ink-soft);
  }
  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
  .stats {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 8px 0;
    text-align: left;
    font-weight: 600;
  }
  thead th {
    font-size: 0.8rem;
    color: var(--ink-soft);
    border-bottom: 1px solid var(--ink-faint);
  }
  tbody th {
    color: var(--ink);
  }
  .sym {
    display: inline-block;
    width: 1.4em;
    color: var(--flame);
  }
  .num {
    text-align: right;
  }
  .ratio {
    margin-left: 6px;
    font-size: 0.8rem;
    color: var(--ink-soft);
  }
  .pill {
    align-self: flex-end;
    padding: 8px 14px;
    border-radius: 999px;
    border: 2px solid var(--line);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--ink);
  }
  .pill:disabled {
    color: var(--ink-soft);
  }
  .pill.danger {
    background: var(--red);
    border-color: transparent;
    color: #fff;
  }
  .confirm {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 0.9rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
