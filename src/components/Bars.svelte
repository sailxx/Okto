<script lang="ts">
  // Single-series 7-day bar chart: thin rounded bars on a baseline, one accent hue,
  // per-bar hover/focus tooltip, values in text ink (never the series colour).
  import { store } from '../lib/store.svelte';
  import { fmtWeekdayShort, fmtShortDay } from '../lib/i18n';

  let { days, values, format = (v: number) => String(v) }: { days: string[]; values: number[]; format?: (v: number) => string } = $props();

  const max = $derived(Math.max(1, ...values));
  let hover = $state<number | null>(null);
</script>

<div class="bars" role="list">
  {#each days as d, i}
    <div class="col" role="listitem" aria-label="{fmtShortDay(store.lang, d)}: {format(values[i])}"
      onpointerenter={() => (hover = i)} onpointerleave={() => (hover = null)}>
      <span class="val" class:show={hover === i || i === days.length - 1 || values[i] === max && values[i] > 0}>{format(values[i])}</span>
      <div class="track">
        <i class:today={d === store.today} style:height="{values[i] ? Math.max(4, (values[i] / max) * 100) : 0}%"></i>
      </div>
      <span class="day" class:today={d === store.today}>{fmtWeekdayShort(store.lang, d)}</span>
    </div>
  {/each}
</div>

<style>
  .bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; height: 168px; }
  .col { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; cursor: default; }
  .val { height: 16px; font-family: var(--mono); color: var(--muted); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; opacity: 0; transition: opacity 120ms ease; white-space: nowrap; }
  .val.show { opacity: 1; color: var(--ink); }
  .track { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; border-bottom: 1px solid var(--line); }
  .track i { width: min(26px, 70%); border-radius: 4px 4px 0 0; background: color-mix(in srgb, var(--accent) 45%, var(--bg)); }
  .track i.today { background: var(--accent); }
  .col:hover .track i { background: var(--accent); }
  .day { color: var(--muted); font-family: var(--mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; }
  .day.today { color: var(--ink); }
</style>
