<script lang="ts">
  import { APP_INFO, SUPPORT_EMAIL } from '../core/appInfo';

  interface Props {
    onBack: () => void;
  }
  let { onBack }: Props = $props();

  const faq = $derived([
    { q: 'Nem jön meg a belépőkód', a: 'Nézd meg a levélszemét mappát, és kérj újat pár perc után, ha ott sincs. Szolgáltatódtól függően percekig is eltarthat, mire megérkezik - de egy óráig él.' },
    { q: 'Hogyan kapok pontokat?', a: 'Helyes válaszért alappont jár, plusz gyorsasági bónusz. A nehezebb típusok alapból többet érnek, és a bónusz is magasabb.' },
    { q: 'Mikor nyílik új karakter?', a: 'Amint eléred az alatta látható pontszámot. Új karaktereket folyamatosan alkotunk, ha szeretnél, te is rajzolhatsz egyet ;)' },
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
    <h2>Írj nekem</h2>
    <p class="lead">Hiba, kérés, ötlet – amint lehet, válaszolok.</p>
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
