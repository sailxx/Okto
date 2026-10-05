<script lang="ts">
  import Sheet from './Sheet.svelte';
  import Bars from './Bars.svelte';
  import { store } from '../lib/store.svelte';
  import { router, type Route } from '../lib/router.svelte';
  import { activeDays, dayFocus, doneOnDay, lastDays, streak } from '../lib/stats';
  import { fmtShortDay } from '../lib/i18n';
  import type { Block } from '../lib/model';

  let { block, onclose }: { block: Block; onclose: () => void } = $props();

  const days7 = $derived(lastDays(7, store.today));
  const days30 = $derived(lastDays(30, store.today));
  const counter = $derived(block.counterId ? store.data.counters[block.counterId] : null);
  const hm = (m: number) => store.t('hm')(Math.floor(m / 60), m % 60);

  const series = $derived.by(() => {
    if (block.type === 'focus') return { v7: days7.map((d) => dayFocus(store.sessions, d).minutes), total: days30.reduce((s, d) => s + dayFocus(store.sessions, d).minutes, 0), fmt: hm };
    if (block.type === 'counter' && counter) {
      const val = (d: string) => (d === store.today ? counter.count : counter.daily[d] ?? 0);
      return { v7: days7.map(val), total: days30.reduce((s, d) => s + val(d), 0), fmt: (n: number) => String(n) };
    }
    return { v7: days7.map((d) => doneOnDay(store.tasks, d)), total: days30.reduce((s, d) => s + doneOnDay(store.tasks, d), 0), fmt: (n: number) => String(n) };
  });

  const active = $derived(activeDays(store.tasks, store.sessions));
  const title = $derived(
    block.type === 'counter' ? counter?.name || store.t('counter')
      : store.t(({ tasks: 'bTasks', focus: 'bFocus', streak: 'bStreak', next: 'bNext' } as const)[block.type]),
  );
  const target = $derived<Route>(block.type === 'focus' || block.type === 'counter' ? 'focus' : block.type === 'next' ? 'calendar' : 'tasks');

  function go() {
    if (block.type === 'counter' && counter) store.setDevice({ activeCounter: counter.id, focusMode: 'counter' });
    if (block.type === 'focus') store.setDevice({ focusMode: 'pomodoro' });
    onclose();
    router.go(target);
  }
</script>

<Sheet {title} {onclose}>
  {#if block.type === 'streak'}
    <p class="big">{streak(store.tasks, store.sessions, store.today)} <span>{store.t('streakDays')(streak(store.tasks, store.sessions, store.today))}</span></p>
    <span class="label">{store.t('last30')(String(days30.filter((d) => active.has(d)).length))}</span>
    <div class="dots" role="list">
      {#each days30 as d}
        <i role="listitem" class:on={active.has(d)} class:today={d === store.today} title={fmtShortDay(store.lang, d)} aria-label="{fmtShortDay(store.lang, d)}: {active.has(d) ? '✓' : '—'}"></i>
      {/each}
    </div>
  {:else}
    <span class="label">{store.t('last7')} · {block.type === 'focus' ? store.t('focusMin') : block.type === 'counter' ? title : store.t('tasksDone')}</span>
    <Bars days={days7} values={series.v7} format={series.fmt} />
    <p class="total">{store.t('last30')(series.fmt(series.total))}</p>
  {/if}
  <form method="dialog" class="row-btns">
    <button class="line-btn" type="button" onclick={go}>{store.t(target === 'focus' ? 'navFocus' : target === 'calendar' ? 'navCalendar' : 'navTasks')}</button>
    <button class="solid-btn">{store.t('done')}</button>
  </form>
</Sheet>

<style>
  .label { margin-bottom: 12px; }
  .big { margin: 0 0 18px; font-family: 'Inter Display', 'Inter', sans-serif; font-size: 56px; font-weight: 700; letter-spacing: -.04em; line-height: 1; }
  .big span { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 500; letter-spacing: 0; color: var(--muted); }
  .dots { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; margin-bottom: 20px; }
  .dots i { aspect-ratio: 1; border-radius: 6px; background: var(--soft); }
  .dots i.on { background: var(--accent); }
  .dots i.today { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--line); }
  .total { margin: 14px 2px 18px; color: var(--muted); font-size: 15px; font-weight: 500; }
</style>
