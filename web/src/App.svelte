<script lang="ts">
  import type { MathOperation } from './core/operation';
  import { ProfileStore } from './store/profileStore.svelte';
  import { browserStorage } from './store/storage';
  import Collection from './ui/Collection.svelte';
  import Home from './ui/Home.svelte';
  import Practice from './ui/Practice.svelte';

  type Screen = { kind: 'home' } | { kind: 'practice'; operation: MathOperation } | { kind: 'collection' };

  const store = new ProfileStore(browserStorage());
  let screen = $state<Screen>({ kind: 'home' });
  const goHome = () => (screen = { kind: 'home' });
</script>

{#if screen.kind === 'practice'}
  {#key screen.operation}
    <Practice {store} operation={screen.operation} onBack={goHome} />
  {/key}
{:else if screen.kind === 'collection'}
  <Collection {store} onBack={goHome} />
{:else}
  <Home {store} onPractice={(operation) => (screen = { kind: 'practice', operation })} onCollection={() => (screen = { kind: 'collection' })} />
{/if}
