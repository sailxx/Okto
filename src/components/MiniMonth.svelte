<script lang="ts">
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { addDays, addMonths, monthStart, startOfWeek } from '../lib/date';
  import { fmtDate, fmtMonth, fmtWeekdayNarrow } from '../lib/i18n';

  let { value = null, month = $bindable(), onpick, marks }: {
    value?: string | null; month: string; onpick: (key: string) => void; marks?: Set<string>;
  } = $props();

  const first = $derived(startOfWeek(monthStart(month), store.weekStart));
  const days = $derived(Array.from({ length: 42 }, (_, i) => addDays(first, i)));
  const weekdays = $derived(days.slice(0, 7));
  const inMonth = (k: string) => k.slice(0, 7) === month.slice(0, 7);
</script>

<div class="mini">
  <div class="mini-head">
    <b>{fmtMonth(store.lang, month)} <span>{month.slice(0, 4)}</span></b>
    <div>
      <button type="button" class="icon-btn sm" aria-label={store.t('prev')} onclick={() => (month = addMonths(month, -1))}><Icon name="left" size={18} /></button>
      <button type="button" class="icon-btn sm" aria-label={store.t('nextP')} onclick={() => (month = addMonths(month, 1))}><Icon name="right" size={18} /></button>
    </div>
  </div>
  <div class="mini-grid">
    {#each weekdays as w}<span class="wd">{fmtWeekdayNarrow(store.lang, w)}</span>{/each}
    {#each days as k (k)}
      <button
        type="button"
        class="d"
        class:out={!inMonth(k)}
        class:today={k === store.today}
        class:sel={k === value}
        aria-label={fmtDate(store.lang, k, { day: 'numeric', month: 'long' })}
        onclick={() => onpick(k)}
      >
        {Number(k.slice(8))}
        {#if marks?.has(k)}<i></i>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .mini { user-select: none; }
  .mini-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .mini-head b { font-size: 15px; font-weight: 600; padding-left: 4px; }
  .mini-head b span { color: var(--muted); font-weight: 500; }
  .mini-head div { display: flex; }
  .icon-btn.sm { width: 32px; height: 32px; }
  .mini-grid { display: grid; grid-template-columns: repeat(7, 1fr); row-gap: 2px; text-align: center; }
  .wd { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; padding: 4px 0; }
  .d {
    position: relative; justify-self: center;
    width: 34px; height: 34px; border-radius: 8px;
    font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums;
    transition: background-color 120ms ease;
  }
  .d:hover { background: var(--soft); }
  .d.out { color: var(--muted); opacity: .55; }
  .d.today { color: var(--accent); font-weight: 700; }
  .d.sel { background: var(--ink); color: var(--bg); font-weight: 600; opacity: 1; }
  .d.today.sel { background: var(--accent); color: var(--on-accent); }
  .d i { position: absolute; left: 50%; bottom: 3px; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: var(--muted); }
  .d.sel i { background: currentColor; }
</style>
