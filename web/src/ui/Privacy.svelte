<script lang="ts">
  import { PRIVACY_POLICY_URL } from '../core/appInfo';

  interface Props {
    onBack: () => void;
  }
  let { onBack }: Props = $props();

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
    <h1>Adatvédelem</h1>
    <span class="placeholder"></span>
  </header>

  <!-- Rövid összefoglaló; a mérvadó szöveg a linkelt teljes tájékoztató (web/public/adatvedelem). -->
  <section class="card body">
    <h2>Mit tárolunk?</h2>
    <p>
      A fiók e-mail-címét a bejelentkezéshez, a létrehozott játékosok becenevét, pontjait, beállításait és a
      megoldott feladatok statisztikáit. Jelszót, születési dátumot, fotót nem kérünk.
    </p>
    <h2>Hol?</h2>
    <p>
      A készülékeden és a Supabase szerverén, az EU-ban. Adatfeldolgozókat használunk (Supabase, a levelek
      küldéséhez Resend, a webes változat tárhelyéhez Netlify); másnak nem adjuk át, hirdetés és elemzés nincs.
    </p>
    <h2>Törlés</h2>
    <p>
      A fiók és minden hozzá tartozó adat bármikor törölhető a Menü → <em>Az alkalmazásról</em> képernyőn, a
      Fiók törlése gombbal; egy játékos külön is (Játékosok → ceruza). A törlést a fiók e-mail-címére küldött
      kóddal kell megerősíteni, és azonnal, véglegesen megtörténik.
    </p>
    <a class="link" href={PRIVACY_POLICY_URL} target="_blank" rel="noopener">Teljes adatkezelési tájékoztató →</a>
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
  .body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 0.95rem;
    line-height: 1.5;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }
  p {
    margin: 0;
  }
  .link {
    color: var(--flame);
    font-weight: 600;
  }
</style>
