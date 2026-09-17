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
  import Donate from './ui/Donate.svelte';
  import EditPlayer from './ui/EditPlayer.svelte';
  import Home from './ui/Home.svelte';
  import Menu from './ui/Menu.svelte';
  import ModePicker from './ui/ModePicker.svelte';
  import Players from './ui/Players.svelte';
  import Practice from './ui/Practice.svelte';
  import Privacy from './ui/Privacy.svelte';
  import SignIn from './ui/SignIn.svelte';
  import Stats from './ui/Stats.svelte';
  import Support from './ui/Support.svelte';

  type Screen =
    | { kind: 'home' }
    | { kind: 'modes'; operation: MathOperation }
    | { kind: 'practice'; mode: PracticeMode }
    | { kind: 'collection' }
    | { kind: 'players' }
    | { kind: 'about' }
    | { kind: 'privacy'; from: 'home' | 'signin' }
    | { kind: 'support'; from: 'home' | 'signin' }
    | { kind: 'donate' }
    | { kind: 'editPlayer'; id: string }
    | { kind: 'stats' }
    /** Csak kijelentkezve: vissza a belépő képernyőre. */
    | { kind: 'signin' };

  const storage = platformStorage();
  const devMode = new DevMode(storage);
  const catalog = new CatalogStore(storage, catalogBaseUrl());
  const services = createServices(storage);
  const account = services ? new AccountStore(services.auth) : null;
  const backend = services?.backend ?? null;

  let screen = $state<Screen>({ kind: 'home' });
  const goHome = () => (screen = { kind: 'home' });
  /** A menülap a Home vagy a Players fölött. */
  let menuOpen = $state(false);
  const openMenu = () => (menuOpen = true);
  const closeMenu = () => (menuOpen = false);
  /** Adatvédelem és Segítség a belépés előtt is elérhető; a vissza gomb oda visz, ahonnan jött. */
  const backFrom = (from: 'home' | 'signin') => () => (screen = from === 'home' ? { kind: 'home' } : { kind: 'signin' });

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
    menuOpen = false;
    return () => next.dispose();
  });

  /** Egyetlen alkategóriánál rögtön a gyakorlás indul, különben az alkategória-választó. */
  function openOperation(operation: MathOperation) {
    const modes = modesOf(operation);
    screen = modes.length === 1 ? { kind: 'practice', mode: modes[0] } : { kind: 'modes', operation };
  }

  async function signOut() {
    menuOpen = false;
    await store?.clearLocal();
    await account?.signOut();
    screen = { kind: 'signin' };
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
{:else if screen.kind === 'privacy' && (account.status === 'signedOut' || !store)}
  <Privacy onBack={backFrom('signin')} />
{:else if screen.kind === 'support' && (account.status === 'signedOut' || !store)}
  <Support onBack={backFrom('signin')} />
{:else if account.status === 'signedOut' || !store}
  <SignIn {account} onPrivacy={() => (screen = { kind: 'privacy', from: 'signin' })} onSupport={() => (screen = { kind: 'support', from: 'signin' })} />
{:else if screen.kind === 'privacy'}
  <Privacy onBack={backFrom(screen.from)} />
{:else if screen.kind === 'support'}
  <Support onBack={backFrom(screen.from)} />
{:else if screen.kind === 'donate'}
  <Donate onBack={goHome} />
{:else if screen.kind === 'stats'}
  <Stats {store} onBack={goHome} />
{:else if screen.kind === 'editPlayer'}
  {#key screen.id}
    <EditPlayer {store} playerId={screen.id} onDone={() => (screen = { kind: 'players' })} />
  {/key}
{:else if screen.kind === 'signin'}
  <Home {store} onPractice={openOperation} onCollection={() => (screen = { kind: 'collection' })} onMenu={openMenu} onPlayers={() => (screen = { kind: 'players' })} />
{:else if screen.kind === 'about'}
  <About
    {store}
    {account}
    {devMode}
    onBack={() => (screen = store?.active ? { kind: 'home' } : { kind: 'players' })}
    onSignOut={signOut}
    onDeleteAccount={deleteAccount}
    onDonate={() => (screen = { kind: 'donate' })}
  />
{:else if !store.active || screen.kind === 'players'}
  <Players {store} onPick={goHome} onBack={store.active ? goHome : null} onMenu={openMenu} onEdit={(id) => (screen = { kind: 'editPlayer', id })} />
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
    onMenu={openMenu}
    onPlayers={() => (screen = { kind: 'players' })}
  />
{/if}

{#if menuOpen && store && account?.status === 'signedIn'}
  <Menu
    {store}
    onClose={closeMenu}
    onPlayers={() => (screen = { kind: 'players' })}
    onCollection={() => (screen = { kind: 'collection' })}
    onStats={() => (screen = { kind: 'stats' })}
    onAbout={() => (screen = { kind: 'about' })}
    onPrivacy={() => (screen = { kind: 'privacy', from: 'home' })}
    onSupport={() => (screen = { kind: 'support', from: 'home' })}
    onDonate={() => (screen = { kind: 'donate' })}
    onSignOut={() => void signOut()}
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
