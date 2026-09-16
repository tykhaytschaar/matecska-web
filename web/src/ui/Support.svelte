<script lang="ts">
  import { APP_INFO, SUPPORT_EMAIL } from '../core/appInfo';
  import type { GameCharacter } from '../core/characters';

  interface Props {
    /** A katalógus küszöbeiből épül a „Mikor nyílik új karakter?” válasz. */
    characters: readonly GameCharacter[];
    onBack: () => void;
  }
  let { characters, onBack }: Props = $props();

  const thresholds = $derived(
    [...new Set(characters.filter((c) => c.unlockAt > 0).map((c) => c.unlockAt))].sort((a, b) => a - b),
  );
  const thresholdText = $derived(
    thresholds.length === 0
      ? 'Egyelőre egy karakter van.'
      : `${thresholds.length === 1 ? `${thresholds[0]}` : `${thresholds.slice(0, -1).join(', ')} és ${thresholds.at(-1)}`} pontnál. A pont nem fogy el választáskor.`,
  );

  const faq = $derived([
    { q: 'Hogyan kap pontot a gyerek?', a: 'Helyes válaszért alappont jár, plusz gyorsasági bónusz. A nehezebb típusok többet érnek.' },
    { q: 'Mikor nyílik új karakter?', a: thresholdText },
    { q: 'Nem jön meg a belépőkód', a: 'Nézd meg a levélszemét mappát, és kérj újat 1 perc után.' },
  ]);

  const mailto = $derived(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Matecska ${APP_INFO.version}`)}`);

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
    <h1>Segítség</h1>
    <span class="placeholder"></span>
  </header>

  <section class="card block">
    <h2>Gyakori kérdések</h2>
    <div class="faq">
      {#each faq as item (item.q)}
        <details>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      {/each}
    </div>
  </section>

  <section class="card block">
    <h2>Írj nekünk</h2>
    <p class="lead">Hiba, kérés, ötlet – 2 munkanapon belül válaszolunk.</p>
    <a class="chunky" href={mailto}>E-mail: {SUPPORT_EMAIL}</a>
    <p class="fine">Verzió {APP_INFO.version} · a levélbe automatikusan bekerül</p>
  </section>
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
  .block {
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
  .faq {
    display: flex;
    flex-direction: column;
  }
  details {
    padding: 10px 0;
    border-top: 1px solid var(--ink-faint);
  }
  summary {
    font-weight: 600;
    cursor: pointer;
  }
  details p {
    margin: 8px 0 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--ink-soft);
  }
  .lead {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  a.chunky {
    text-decoration: none;
  }
  .fine {
    margin: 0;
    text-align: center;
    font-size: 0.8rem;
    color: var(--ink-soft);
  }
</style>
