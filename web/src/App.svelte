<script lang="ts">
  import { modesOf, type MathOperation, type PracticeMode } from './core/operation';
  import { ProfileStore } from './store/profileStore.svelte';
  import { platformStorage } from './platform/storage';
  import About from './ui/About.svelte';
  import Collection from './ui/Collection.svelte';
  import Home from './ui/Home.svelte';
  import ModePicker from './ui/ModePicker.svelte';
  import Practice from './ui/Practice.svelte';

  type Screen =
    | { kind: 'home' }
    | { kind: 'modes'; operation: MathOperation }
    | { kind: 'practice'; mode: PracticeMode }
    | { kind: 'collection' }
    | { kind: 'about' };

  const store = new ProfileStore(platformStorage());
  let screen = $state<Screen>({ kind: 'home' });
  const goHome = () => (screen = { kind: 'home' });

  /** Egyetlen alkategóriánál rögtön a gyakorlás indul, különben az alkategória-választó. */
  function openOperation(operation: MathOperation) {
    const modes = modesOf(operation);
    screen = modes.length === 1 ? { kind: 'practice', mode: modes[0] } : { kind: 'modes', operation };
  }
</script>

{#if !store.ready}
  <div class="screen"></div>
{:else if screen.kind === 'practice'}
  {#key screen.mode}
    <Practice {store} mode={screen.mode} onBack={goHome} />
  {/key}
{:else if screen.kind === 'modes'}
  <ModePicker {store} operation={screen.operation} onPick={(mode) => (screen = { kind: 'practice', mode })} onBack={goHome} />
{:else if screen.kind === 'collection'}
  <Collection {store} onBack={goHome} />
{:else if screen.kind === 'about'}
  <About onBack={goHome} />
{:else}
  <Home
    {store}
    onPractice={openOperation}
    onCollection={() => (screen = { kind: 'collection' })}
    onAbout={() => (screen = { kind: 'about' })}
  />
{/if}
