<script lang="ts">
  /** A játékos nevének kezdőbetűje színes körben vagy lekerekített négyzetben. */
  interface Props {
    name: string;
    size?: number;
    radius?: string;
    fontSize?: string;
  }
  let { name, size = 32, radius = '50%', fontSize = '0.95rem' }: Props = $props();
  const initial = $derived((name.trim().charAt(0) || '?').toUpperCase());
</script>

<span class="avatar" aria-hidden="true" style:width="{size}px" style:height="{size}px" style:border-radius={radius} style:font-size={fontSize}>{initial}</span>

<style>
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--flame-soft);
    color: var(--flame);
    font-weight: 800;
    flex: none;
  }
</style>
