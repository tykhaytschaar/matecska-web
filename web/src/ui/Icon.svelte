<script lang="ts">
  /** Vonalas ikonok a menühöz és a fejlécekhez; 24-es rácson, currentColor. */
  export type IconName = 'menu' | 'chevron-down' | 'chevron-right' | 'chars' | 'info' | 'shield' | 'help' | 'heart' | 'pencil';

  interface Props {
    name: IconName;
    size?: number;
    strokeWidth?: number;
  }
  let { name, size = 20, strokeWidth = 2 }: Props = $props();

  const PATHS: Record<IconName, string> = {
    menu: 'M4 6h16M4 12h16M4 18h16',
    'chevron-down': 'M6 9l6 6 6-6',
    'chevron-right': 'M9 6l6 6-6 6',
    chars: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    shield: 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01',
    heart: 'M12 21s-7-4.6-9-9a5 5 0 0 1 9-4 5 5 0 0 1 9 4c-2 4.4-9 9-9 9z',
    pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  };
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={PATHS[name]} />
</svg>
