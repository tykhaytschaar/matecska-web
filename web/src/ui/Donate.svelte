<script lang="ts">
  import { CAT } from '../core/characters';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';

  interface Props {
    onBack: () => void;
  }
  let { onBack }: Props = $props();

  /**
   * Az összegek az App Store árszintekhez igazítandók; a végleges árat a StoreKit termékből kell
   * megjeleníteni. A vásárlás Capacitor IAP pluginnal készül (consumable: tip_small, tip_medium, tip_large);
   * a plugin még nincs telepítve, a gomb addig tájékoztat.
   */
  const tiers = [
    { id: 'tip_small', amount: '990 Ft', label: 'Egy kávé' },
    { id: 'tip_medium', amount: '2 490 Ft', label: 'Egy ebéd' },
    { id: 'tip_large', amount: '4 990 Ft', label: 'Nagy köszönet' },
  ];
  let selected = $state(0);
  let notice = $state<string | null>(null);

  function support() {
    notice = 'A támogatás hamarosan elérhető az App Store-on keresztül.';
  }

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
    <h1>Támogasd a fejlesztőt</h1>
    <span class="placeholder"></span>
  </header>

  <div class="hero">
    <CharacterSprite character={CAT} size={72} mood="happy" />
    <h2>Köszönjük, hogy velünk gyakorolsz!</h2>
    <p>A Matecska ingyenes, reklám nélkül készül egy fejlesztő szabadidejében. Ha hasznos, egy kávé árával sokat segítesz.</p>
  </div>

  <div class="tiers" role="radiogroup" aria-label="Támogatás összege">
    {#each tiers as tier, i (tier.id)}
      <button type="button" class="card tier" class:selected={selected === i} role="radio" aria-checked={selected === i} onclick={() => (selected = i)}>
        <span class="amount">{tier.amount}</span>
        <span class="label">{tier.label}</span>
      </button>
    {/each}
  </div>

  <button type="button" class="chunky" onclick={support}>Támogatom · {tiers[selected].amount}</button>
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  <p class="fine">Egyszeri, App Store-on keresztül. Nem nyit fel karaktert és nem ad pontot – a játék mindenkinek ugyanaz marad.</p>

  <div class="spacer"></div>

  <!-- TODO: App Store értékelés / share sheet -->
  <a class="link" href="https://tykhaytschaar.github.io/matecska-web/" target="_blank" rel="noopener">Más módon segítenék (értékelés, megosztás) →</a>
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
    gap: 8px;
    text-align: center;
  }
  h2 {
    margin: 4px 0 0;
    font-size: 1.1rem;
    font-weight: 700;
  }
  .hero p {
    margin: 0;
    max-width: 300px;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--ink-soft);
  }
  .tiers {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .tier {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 8px;
    color: var(--ink);
  }
  .tier.selected {
    border-color: var(--flame);
    box-shadow: inset 0 0 0 1px var(--flame), var(--shadow);
  }
  .amount {
    font-weight: 700;
    font-size: 1.15rem;
    white-space: nowrap;
  }
  .label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--ink-soft);
  }
  .notice {
    margin: 0;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--flame);
  }
  .fine {
    margin: 0;
    text-align: center;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--ink-soft);
  }
  .link {
    text-align: center;
    color: var(--flame);
    font-weight: 600;
    padding: 8px 0;
  }
</style>
