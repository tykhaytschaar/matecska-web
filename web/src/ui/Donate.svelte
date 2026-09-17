<script lang="ts">
  import { KOFI_EMBED_URL, KOFI_URL } from '../core/appInfo';
  import { CAT } from '../core/characters';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';

  /** Csak a webes változatban érhető el (a menü natív appban nem mutatja). */
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
    <h1>Támogass!</h1>
    <span class="placeholder"></span>
  </header>

  <div class="hero">
    <CharacterSprite character={CAT} size={72} mood="happy" />
    <h2>Örülök, hogy hasznosnak találod!</h2>
    <p>A Matecska örökké ingyenes lesz, és reklám nélkül készül a szabadidőmben. Köszönöm, ha egy (vagy akár több) kávé árával segítesz.</p>
  </div>

  <!-- A Ko-fi saját panelje; a fizetés a Ko-fi oldalán történik, az app kártyaadatot nem lát. -->
  <div class="card panel">
    <iframe src={KOFI_EMBED_URL} title="Támogatás Ko-fin" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>

  <p class="fine">
    A támogatás egyszeri és önkéntes, a Ko-fi oldalán keresztül. Nem nyit fel karaktert és nem ad pontot – a játék
    mindenkinek ugyanaz marad. Ha a panel nem töltődik be:<br />
    <a href={KOFI_URL} target="_blank" rel="noopener">ko-fi.com oldal megnyitása →</a>
  </p>
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
  .panel {
    overflow: hidden;
    padding: 0;
    background: #f9f9f9;
  }
  /* A Ko-fi ajánlott magassága 712 px; így a panel görgetés nélkül kifér. */
  iframe {
    display: block;
    width: 100%;
    height: 712px;
    border: none;
  }
  .fine {
    margin: 0;
    text-align: center;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--ink-soft);
  }
  .fine a {
    color: var(--flame);
    font-weight: 600;
  }
</style>
