<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    onclick: () => void;
  }
  let { onclick }: Props = $props();
</script>

<button type="button" class="menu" {onclick} aria-label="Menü" aria-haspopup="dialog">
  <Icon name="menu" strokeWidth={2.2} />
  <span>Menü</span>
</button>

<style>
  .menu {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 44px;
    padding: 0 12px 0 10px;
    border-radius: 999px;
    border: 2px solid var(--line);
    background: var(--card);
    color: var(--ink);
    box-shadow: var(--shadow);
    font-weight: 700;
    flex: none;
    transition: opacity 0.1s ease;
  }
  .menu:active {
    opacity: 0.6;
  }
</style>
