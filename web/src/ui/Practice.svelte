<script lang="ts">
  import { OPERATION_INFO, type MathOperation } from '../core/operation';
  import { selectedCharacter } from '../core/profile';
  import { bonus, bonusFraction } from '../core/scoring';
  import {
    canSubmit,
    createSession,
    deleteDigit,
    elapsedSeconds,
    enterDigit,
    isSubmitted,
    nextExercise,
    selectCell,
    submit,
    type SessionState,
  } from '../core/session';
  import CharacterSprite, { type Mood } from '../sprites/CharacterSprite.svelte';
  import type { ProfileStore } from '../store/profileStore.svelte';
  import BonusBar from './BonusBar.svelte';
  import Keypad from './Keypad.svelte';
  import PointsBadge from './PointsBadge.svelte';
  import Problem from './Problem.svelte';
  import ResultBanner from './ResultBanner.svelte';

  interface Props {
    store: ProfileStore;
    operation: MathOperation;
    onBack: () => void;
    /** Tesztelhetőség: előre beállított kezdőállapot. */
    initial?: SessionState;
  }
  let { store, operation, onBack, initial }: Props = $props();

  const nowSeconds = () => performance.now() / 1000;

  // svelte-ignore state_referenced_locally
  let session = $state.raw<SessionState>(initial ?? createSession(operation, nowSeconds()));
  let mood = $state<Mood>('idle');
  let now = $state(nowSeconds());

  const info = $derived(OPERATION_INFO[operation]);
  const submitted = $derived(isSubmitted(session));
  const elapsed = $derived(elapsedSeconds(session, now));
  const fraction = $derived(bonusFraction(elapsed, info.bonusTiming));
  const bonusNow = $derived(bonus(elapsed, info.bonusTiming));

  // A bónuszcsík ketyeg, amíg nincs beküldve.
  $effect(() => {
    if (submitted) return;
    const id = setInterval(() => {
      now = nowSeconds();
    }, 100);
    return () => clearInterval(id);
  });

  function handleSubmit() {
    if (!canSubmit(session)) return;
    session = submit(session, nowSeconds());
    const outcome = session.outcome;
    if (!outcome) return;
    mood = outcome.kind === 'correct' ? 'happy' : 'yuck';
    store.record(outcome.score, outcome.kind === 'correct', operation);
  }

  function handleNext() {
    mood = 'idle';
    session = nextExercise(session, nowSeconds());
    now = nowSeconds();
  }

  function handleKey(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (/^[0-9]$/.test(event.key)) {
      session = enterDigit(session, Number(event.key));
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      session = deleteDigit(session);
    } else if (event.key === 'Enter') {
      submitted ? handleNext() : handleSubmit();
    } else if (event.key === 'ArrowLeft') {
      session = selectCell(session, session.selectedIndex - 1);
    } else if (event.key === 'ArrowRight') {
      session = selectCell(session, session.selectedIndex + 1);
    } else if (event.key === 'Escape') {
      onBack();
    } else {
      return;
    }
    event.preventDefault();
  }
</script>

<svelte:window onkeydown={handleKey} />

<div class="screen">
  <header class="top">
    <button type="button" class="back" onclick={onBack} aria-label="Vissza a főképernyőre">‹</button>
    <h1>{info.title}</h1>
    <div class="right">
      <CharacterSprite character={selectedCharacter(store.profile)} {mood} size={36} />
      <PointsBadge points={store.profile.totalPoints} compact />
    </div>
  </header>

  <div class="spacer"></div>

  <div class="problem">
    <Problem {session} onSelect={(index) => (session = selectCell(session, index))} />
  </div>

  <BonusBar {fraction} bonus={bonusNow} />
  <ResultBanner outcome={session.outcome} />

  <div class="spacer"></div>

  <Keypad
    disabled={submitted}
    onDigit={(digit) => (session = enterDigit(session, digit))}
    onDelete={() => (session = deleteDigit(session))}
  />

  {#if submitted}
    <button type="button" class="chunky" onclick={handleNext}>→ Következő</button>
  {:else}
    <button type="button" class="chunky" disabled={!canSubmit(session)} onclick={handleSubmit}>➤ Beküldés</button>
  {/if}
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
  .right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .spacer {
    flex: 1;
  }
  .problem {
    display: flex;
    justify-content: center;
  }
</style>
