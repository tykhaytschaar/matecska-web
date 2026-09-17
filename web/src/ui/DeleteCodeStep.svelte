<script lang="ts">
  import { onMount } from 'svelte';
  import { DeletionCodeError } from '../store/backend';

  /**
   * E-mailes megerősítés törléshez: betöltéskor kódot kér a fiók e-mail címére, a kód beírása után a
   * `confirm` fut. A szerver a kódot 10 percig fogadja el, újat percenként enged.
   */
  interface Props {
    request: () => Promise<void>;
    confirm: (code: string) => Promise<void>;
    onCancel: () => void;
    confirmLabel?: string;
  }
  let { request, confirm, onCancel, confirmLabel = 'Végleges törlés' }: Props = $props();

  let code = $state('');
  let sent = $state(false);
  let busy = $state(false);
  let error = $state<string | null>(null);
  const codeValid = $derived(/^\d{6}$/.test(code.trim()));

  function describe(e: unknown, fallback: string): string {
    return e instanceof DeletionCodeError ? e.message : fallback;
  }

  async function send() {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await request();
      sent = true;
    } catch (e) {
      error = describe(e, 'A kód kérése nem sikerült.');
    } finally {
      busy = false;
    }
  }

  async function submit() {
    if (!codeValid || busy) return;
    busy = true;
    error = null;
    try {
      await confirm(code.trim());
    } catch (e) {
      error = describe(e, 'A törlés nem sikerült.');
    } finally {
      busy = false;
    }
  }

  // Egyszer, megjelenéskor kérünk kódot (effektben a saját állapotváltozásai újraindítanák).
  onMount(() => {
    void send();
  });
</script>

<form class="step" onsubmit={(e) => { e.preventDefault(); void submit(); }}>
  <p class="text">
    {#if sent}
      Küldtünk egy hatjegyű kódot a fiók e-mail címére. Írd be a törlés megerősítéséhez; a kód 10 percig érvényes.
    {:else if busy}
      Kód küldése…
    {:else}
      A törléshez e-mailes megerősítés kell.
    {/if}
  </p>
  <input
    type="text"
    bind:value={code}
    inputmode="numeric"
    autocomplete="one-time-code"
    pattern="[0-9]*"
    maxlength="6"
    placeholder="••••••"
    aria-label="Megerősítő kód"
    disabled={busy || !sent}
  />
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="actions">
    <button type="button" class="pill" onclick={onCancel} disabled={busy}>Mégse</button>
    <button type="button" class="pill" onclick={send} disabled={busy}>Új kód</button>
    <button type="submit" class="pill danger" disabled={!codeValid || busy || !sent}>{busy && sent ? 'Törlés…' : confirmLabel}</button>
  </div>
</form>

<style>
  .step {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .text {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    font-weight: 600;
  }
  input {
    font: inherit;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.3em;
    text-align: center;
    padding: 10px 14px;
    border-radius: 12px;
    border: 2px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    width: 100%;
  }
  input:focus {
    outline: none;
    border-color: var(--red);
  }
  .error {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--red);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
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
    opacity: 0.5;
  }
  .danger {
    background: var(--red);
    border-color: transparent;
    color: #fff;
    font-weight: 700;
  }
</style>
