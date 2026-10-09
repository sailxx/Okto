<script lang="ts">
  // Display numerals: unlit "8" segments sit behind the live value, like an LCD.
  import { boot } from '../lib/boot.svelte';

  let { text, delay = 0, class: cls = '' }: { text: string; delay?: number; class?: string } = $props();

  const ghost = $derived(text.replace(/\d/g, '8'));
  let now = $state(0);

  $effect(() => {
    if (boot.phase !== 'settle') return;
    let raf = 0;
    const loop = () => { now = performance.now(); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  });

  const shown = $derived.by(() => {
    if (boot.phase === 'off') return '';
    if (boot.phase === 'test') return ghost;
    if (boot.phase === 'on') return text;
    const elapsed = now - boot.settleAt - delay;
    let digit = 0;
    return [...text].map((ch) => {
      if (!/\d/.test(ch)) return ch;
      const settled = elapsed > 120 + digit++ * 70;
      return settled ? ch : '8';
    }).join('');
  });
</script>

<span class="digits {cls}" aria-label={text}><span class="ghost" aria-hidden="true">{ghost}</span><span class="live" aria-hidden="true">{shown}</span></span>

<style>
  /* Ghost and live value share one grid cell, so they line up whatever the alignment around them. */
  /* Interface font with tabular figures: the mono font's dotted zero reads as noise at display sizes. */
  .digits { display: inline-grid; font-family: var(--sans); font-variant-numeric: tabular-nums; white-space: pre; }
  .ghost, .live { grid-area: 1 / 1; justify-self: center; }
  .ghost { color: var(--well-ghost); }
  .live { color: inherit; }
</style>
