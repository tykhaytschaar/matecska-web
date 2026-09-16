<script lang="ts">
  import { modesOf, type MathOperation, type PracticeMode } from './core/operation';
  import { createServices } from './platform/services';
  import { platformStorage } from './platform/storage';
  import { catalogBaseUrl } from './platform/supabase';
  import { CatalogStore } from './store/catalogStore.svelte';
  import { AccountStore } from './store/account.svelte';
  import { DevMode } from './store/devMode.svelte';
  import { PlayerStore } from './store/playerStore.svelte';
  import About from './ui/About.svelte';
  import Collection from './ui/Collection.svelte';
  import Home from './ui/Home.svelte';
  import ModePicker from './ui/ModePicker.svelte';
  import Players from './ui/Players.svelte';
  import Practice from './ui/Practice.svelte';
  import SignIn from './ui/SignIn.svelte';

  type Screen =
    | { kind: 'home' }
    | { kind: 'modes'; operation: MathOperation }
    | { kind: 'practice'; mode: PracticeMode }
    | { kind: 'collection' }
    | { kind: 'players' }
    | { kind: 'about' };

  const storage = platformStorage();
  const devMode = new DevMode(storage);
  const catalog = new CatalogStore(storage, catalogBaseUrl());
  const services = createServices(storage);
  const account = services ? new AccountStore(services.auth) : null;
  const backend = services?.backend ?? null;

  let screen = $state<Screen>({ kind: 'home' });
  const goHome = () => (screen = { kind: 'home' });

  /** A bejelentkezett fiókhoz tartozó játékosok; fiókváltásnál újraépül. */
  let store = $state<PlayerStore | null>(null);
  $effect(() => {
    const userId = account?.user?.id ?? null;
    if (!userId || !backend) {
      store = null;
      return;
    }
    const next = new PlayerStore(storage, backend, catalog, userId);
    store = next;
    screen = { kind: 'home' };
    return () => next.dispose();
  });

  /** Egyetlen alkategóriánál rögtön a gyakorlás indul, különben az alkategória-választó. */
  function openOperation(operation: MathOperation) {
    const modes = modesOf(operation);
    screen = modes.length === 1 ? { kind: 'practice', mode: modes[0] } : { kind: 'modes', operation };
  }

  async function signOut() {
    await store?.clearLocal();
    await account?.signOut();
    goHome();
  }

  async function deleteAccount() {
    await store?.clearLocal();
    await account?.deleteAccount();
    goHome();
  }
</script>

{#if !account}
  <div class="screen">
    <p class="setup">
      Nincs beállítva a szerver. Add meg a <code>VITE_SUPABASE_URL</code> és <code>VITE_SUPABASE_KEY</code> értékét
      (lásd <code>.env.example</code>), és buildelj újra.
    </p>
  </div>
{:else if account.status === 'loading' || (account.status === 'signedIn' && (!store || !store.ready))}
  <div class="screen"></div>
{:else if account.status === 'signedOut' || !store}
  <SignIn {account} />
{:else if screen.kind === 'about'}
  <About {store} {account} {devMode} onBack={() => (screen = store?.active ? { kind: 'home' } : { kind: 'players' })} onSignOut={signOut} onDeleteAccount={deleteAccount} />
{:else if !store.active || screen.kind === 'players'}
  <Players {store} onPick={goHome} onBack={store.active ? goHome : null} onAbout={() => (screen = { kind: 'about' })} />
{:else if screen.kind === 'practice'}
  {#key screen.mode}
    <Practice {store} mode={screen.mode} onBack={goHome} />
  {/key}
{:else if screen.kind === 'modes'}
  <ModePicker {store} operation={screen.operation} onPick={(mode) => (screen = { kind: 'practice', mode })} onBack={goHome} />
{:else if screen.kind === 'collection'}
  <Collection {store} onBack={goHome} />
{:else}
  <Home
    {store}
    onPractice={openOperation}
    onCollection={() => (screen = { kind: 'collection' })}
    onAbout={() => (screen = { kind: 'about' })}
    onPlayers={() => (screen = { kind: 'players' })}
  />
{/if}

<style>
  .setup {
    margin: auto;
    text-align: center;
    color: var(--ink-soft);
    font-weight: 600;
    line-height: 1.5;
  }
  code {
    color: var(--ink);
  }
</style>
