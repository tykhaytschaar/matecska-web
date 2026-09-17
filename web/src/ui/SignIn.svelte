<script lang="ts">
  import { CAT } from '../core/characters';
  import CharacterSprite from '../sprites/CharacterSprite.svelte';
  import type { AccountStore } from '../store/account.svelte';

  interface Props {
    account: AccountStore;
    onPrivacy: () => void;
    onSupport: () => void;
  }
  let { account, onPrivacy, onSupport }: Props = $props();

  let step = $state<'email' | 'code'>('email');
  let email = $state('');
  let code = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
  const codeValid = $derived(code.replace(/\s+/g, '').length >= 6);

  async function requestCode() {
    if (!emailValid || busy) return;
    busy = true;
    error = null;
    try {
      await account.requestCode(email);
      step = 'code';
      code = '';
    } catch (e) {
      error = describe(e, 'Nem sikerült elküldeni a kódot.');
    } finally {
      busy = false;
    }
  }

  async function verify() {
    if (!codeValid || busy) return;
    busy = true;
    error = null;
    try {
      await account.verifyCode(email, code);
    } catch (e) {
      error = describe(e, 'Hibás vagy lejárt kód.');
    } finally {
      busy = false;
    }
  }

  function changeEmail() {
    step = 'email';
    code = '';
    error = null;
  }

  /** Emberi hibaüzenet; a hálózati hibát külön nevezzük meg. */
  function describe(e: unknown, fallback: string): string {
    const message = e instanceof Error ? e.message : '';
    if (/fetch|network|Failed to fetch/i.test(message)) return 'Nincs internetkapcsolat.';
    if (/rate limit|too many|security purposes/i.test(message)) return 'Túl sok kérés. Várj egy percet, aztán próbáld újra.';
    if (/expired|invalid/i.test(message)) return 'Hibás vagy lejárt kód.';
    return fallback;
  }
</script>

<div class="screen">
  <div class="spacer"></div>

  <div class="hero">
    <CharacterSprite character={CAT} size={96} />
    <span class="name">Matecska</span>
    <span class="tagline">Belépés</span>
  </div>

  {#if step === 'email'}
    <form class="card form" onsubmit={(e) => { e.preventDefault(); void requestCode(); }}>
      <label for="email">E-mail cím</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        autocomplete="email"
        inputmode="email"
        autocapitalize="off"
        spellcheck="false"
        placeholder="szulo@example.hu"
        disabled={busy}
      />
      <p class="hint">Erre a címre küldünk egy belépőkódot.</p>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button type="submit" class="chunky" disabled={!emailValid || busy}>{busy ? 'Küldés…' : 'Kód kérése'}</button>
    </form>
  {:else}
    <form class="card form" onsubmit={(e) => { e.preventDefault(); void verify(); }}>
      <label for="code">Belépőkód</label>
      <input
        id="code"
        type="text"
        bind:value={code}
        autocomplete="one-time-code"
        inputmode="numeric"
        pattern="[0-9 ]*"
        maxlength="8"
        placeholder="••••••"
        disabled={busy}
        class="code"
      />
      <p class="hint">Elküldtük a kódot: <strong>{email.trim()}</strong>. Nézd meg a levélszemetet is.</p>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button type="submit" class="chunky" disabled={!codeValid || busy}>{busy ? 'Ellenőrzés…' : 'Belépés'}</button>
      <div class="links">
        <button type="button" class="pill" onclick={requestCode} disabled={busy}>Új kód</button>
        <button type="button" class="pill" onclick={changeEmail} disabled={busy}>Másik e-mail</button>
      </div>
    </form>
  {/if}

  <div class="spacer"></div>

  <div class="footer">
    <button type="button" class="footlink" onclick={onPrivacy}>Adatvédelem</button>
    <button type="button" class="footlink" onclick={onSupport}>Segítség</button>
  </div>
</div>

<style>
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
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
  }
  label {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  input {
    font: inherit;
    font-size: 1.125rem;
    padding: 12px 14px;
    border-radius: var(--radius-cell);
    border: 2px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    width: 100%;
  }
  input:focus {
    outline: none;
    border-color: var(--flame);
  }
  input.code {
    font-size: 1.75rem;
    font-weight: 600;
    letter-spacing: 0.3em;
    text-align: center;
  }
  .hint {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .hint strong {
    color: var(--ink);
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .error {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--red);
  }
  .links {
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  .pill {
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
  .footer {
    display: flex;
    justify-content: center;
    gap: 16px;
  }
  .footlink {
    padding: 8px 4px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-soft);
  }
  .footlink:active {
    opacity: 0.6;
  }
</style>
