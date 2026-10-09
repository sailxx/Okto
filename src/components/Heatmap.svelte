<script lang="ts">
  // Activity map: one column per week, one row per weekday, darker = more done that day.
  // Fits as many weeks as the width allows; without a fixed `cell` the cell size follows the height.
  // Hover, touch-drag or arrow keys pick a day (bindable `sel`, a day key).
  import { store } from '../lib/store.svelte';
  import { addDays, startOfWeek } from '../lib/date';
  import { fmtDate, fmtShortDay } from '../lib/i18n';

  let { counts, label, cell = 0, maxWeeks = 53, sel = $bindable(null) }: {
    counts: Map<string, number>; label: string; cell?: number; maxWeeks?: number; sel?: string | null;
  } = $props();

  const GAP = 3, MONTHS = 16;
  let w = $state(0), h = $state(0);
  const size = $derived(cell || Math.max(6, Math.min(18, Math.floor((h - MONTHS - GAP * 6) / 7))));
  const weeks = $derived(Math.max(1, Math.min(maxWeeks, Math.floor((w + GAP) / (size + GAP)))));
  const first = $derived(addDays(startOfWeek(store.today, store.weekStart), -7 * (weeks - 1)));
  const days = $derived(Array.from({ length: weeks * 7 }, (_, i) => addDays(first, i)));
  const max = $derived(Math.max(4, ...days.map((d) => counts.get(d) ?? 0)));
  const level = (k: string) => { const n = counts.get(k) ?? 0; return n ? Math.min(4, Math.ceil((n / max) * 4)) : 0; };

  // A month is labelled over the week its 1st falls in, unless that crowds the previous label.
  const months = $derived.by(() => {
    const out: { col: number; name: string }[] = [];
    for (let c = 0; c < weeks; c++) {
      const start = days.slice(c * 7, c * 7 + 7).find((d) => d.endsWith('-01'));
      if (!start || (out.length && c - out[out.length - 1].col < 3)) continue;
      out.push({ col: c, name: fmtDate(store.lang, start, { month: 'short' }).replace('.', '') });
    }
    return out;
  });

  let grid = $state<HTMLDivElement>();
  function pick(e: PointerEvent) {
    const r = grid!.getBoundingClientRect();
    const c = Math.floor((e.clientX - r.left) / (size + GAP)), row = Math.floor((e.clientY - r.top) / (size + GAP));
    if (c < 0 || c >= weeks || row < 0 || row > 6) return;
    const k = days[c * 7 + row];
    sel = k > store.today ? store.today : k;
  }
  function key(e: KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault(); e.stopPropagation();
    const k = addDays(sel ?? store.today, step);
    sel = k < first ? first : k > store.today ? store.today : k;
  }
</script>

<div class="hm" bind:clientWidth={w} bind:clientHeight={h} style:--s="{size}px" style:--g="{GAP}px" style:--weeks={weeks}>
  <div class="mo" aria-hidden="true">
    {#each months as m (m.col)}<span style:grid-column="{m.col + 1}">{m.name}</span>{/each}
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <div class="grid" bind:this={grid} role="group" tabindex="0" aria-label="{label}, {store.t('weeksN')(weeks)}"
    onpointerdown={pick} onpointermove={pick} onpointerleave={() => (sel = null)} onkeydown={key} onblur={() => (sel = null)}
    onclick={(e) => e.stopPropagation()}>
    {#each days as k (k)}
      <i class="l{level(k)}" class:today={k === store.today} class:future={k > store.today} class:sel={sel === k}
        title={k > store.today ? undefined : `${fmtShortDay(store.lang, k)} · ${store.t('dayActs')(counts.get(k) ?? 0)}`}></i>
    {/each}
  </div>
</div>

<style>
  .hm { --ink: var(--hm-ink, var(--well-ink)); --ghost: var(--hm-ghost, var(--well-ghost)); --dim: var(--hm-dim, var(--well-dim)); --bg: var(--hm-bg, var(--well)); width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; }
  .mo, .grid { display: grid; grid-template-columns: repeat(var(--weeks), var(--s)); column-gap: var(--g); }
  .mo { height: 16px; flex: 0 0 auto; }
  .mo span { white-space: nowrap; font-family: var(--mono); font-size: 10px; letter-spacing: .06em; color: var(--dim); }
  .grid { grid-template-rows: repeat(7, var(--s)); grid-auto-flow: column; row-gap: var(--g); align-self: flex-start; touch-action: pan-y; outline-offset: 4px; border-radius: 3px; }
  i { border-radius: min(3px, calc(var(--s) / 4)); background: var(--ghost); }
  .l1 { background: color-mix(in srgb, var(--ink) 28%, transparent); }
  .l2 { background: color-mix(in srgb, var(--ink) 50%, transparent); }
  .l3 { background: color-mix(in srgb, var(--ink) 75%, transparent); }
  .l4 { background: var(--ink); }
  .future { background: none; box-shadow: inset 0 0 0 1px var(--ghost); }
  .today { box-shadow: 0 0 0 1.5px var(--bg), 0 0 0 2.5px var(--dim); }
  .sel { outline: 2px solid var(--ink); outline-offset: 1px; }
</style>
