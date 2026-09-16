<script lang="ts">
  import { APP_INFO, formatBuildTime } from '../core/appInfo';
  import { CAT } from '../core/characters';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';

  interface Props {
    onBack: () => void;
  }
  let { onBack }: Props = $props();

  const rows = [
    { label: 'Verzió', value: APP_INFO.version },
    { label: 'Build ideje', value: formatBuildTime(APP_INFO.builtAt) },
    { label: 'Fejlesztő', value: APP_INFO.developer },
  ];

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
</style>
