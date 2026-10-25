<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import Tasks from './Tasks.svelte';
  import { store } from '../lib/store.svelte';
  import { router, type HabitsTab } from '../lib/router.svelte';
  import { addDays, startOfWeek, weekday } from '../lib/date';
  import { fmtWeekdayShort } from '../lib/i18n';
  import { habitStreak, habitsOn } from '../lib/life';
  import { dayTaskStats } from '../lib/stats';
  import { occursOn } from '../lib/recurrence';
  import type { Task } from '../lib/model';

  const tab = $derived(router.tab);
  const setTab = (t: HabitsTab) => { router.tab = t; };
  const week = $derived(Array.from({ length: 7 }, (_, i) => addDays(store.today, i - 6)));
  const doneToday = $derived(habitsOn(store.habits, store.today).filter((x) => x.done).length);
  const dueToday = $derived(habitsOn(store.habits, store.today).length);
  const taskStats = $derived(dayTaskStats(store.tasks.filter((t) => t.kind === 'task'), store.today));
  const weekday1 = (k: string) => new Intl.DateTimeFormat(store.lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'narrow' }).format(new Date(`${k}T12:00:00`));
  const weekNames = $derived.by(() => {
    const s = startOfWeek(store.today, store.weekStart);
    return Array.from({ length: 7 }, (_, i) => { const k = addDays(s, i); return { n: weekday(k), label: fmtWeekdayShort(store.lang, k) }; });
  });

  /** «каждый день», «Пн Ср Пт», «каждые 2 дня»… */
  function when(h: Task): string {
    const r = h.repeat;
    const time = h.start ? `${h.start} · ` : '';
    if (!r) return time + store.t('rNone');
    if (r.freq === 'week' && r.days?.length) return time + weekNames.filter((d) => r.days!.includes(d.n)).map((d) => d.label).join(' ');
    if (r.freq === 'day' && r.interval === 1) return time + store.t('everyDay');
    const label = store.t(({ day: 'rDay', weekday: 'rWeekday', week: 'rWeek', month: 'rMonth' } as const)[r.freq]);
    return time + label + (r.interval > 1 ? ` ×${r.interval}` : '');
  }

</script>

<div class="page wide">
  <div class="page-head">
    <div>
      <h1 class="page-title">{store.t('navHabits')}</h1>
      <p class="page-sub">{tab === 'tasks' ? store.t('todayOf')(taskStats.done, taskStats.total) : store.habits.length ? store.t('habitsOf')(doneToday, dueToday) : store.t('habitNone')}</p>
    </div>
    <button type="button" class="add-new" onclick={() => (tab === 'tasks' ? store.openNewTask() : store.openNewHabit())}><Icon name="plus" size={18} /><span>{store.t(tab === 'tasks' ? 'newTask' : 'newHabit')}</span></button>
  </div>

  <div class="seg" role="tablist">
    <button type="button" role="tab" aria-selected={tab === 'habits'} onclick={() => setTab('habits')}>{store.t('navHabits')}</button>
    <button type="button" role="tab" aria-selected={tab === 'tasks'} onclick={() => setTab('tasks')}>{store.t('tasks')}</button>
  </div>

  {#if tab === 'tasks'}
    <Tasks embedded />
  {:else}
    {#if store.habits.length}
      <ul class="list">
        {#each store.habits as h (h.id)}
          {@const due = occursOn(h, store.today)}
          {@const on = h.doneDates.includes(store.today)}
          {@const run = habitStreak(h, store.today)}
          <li style:--c={store.colorOf(h)} class:rest={!due}>
            <button type="button" class="tick" class:on aria-pressed={on} aria-label={store.t('habitDone')} disabled={!due} onclick={() => store.toggleDone(h, store.today)}><Icon name="check" size={20} /></button>
            <button type="button" class="body" onclick={() => store.openTask(h, due ? store.today : h.date)}>
              <span class="hn">{h.title}</span>
              <span class="hm"><Icon name="flame" size={13} />{run} {store.t('streakDays')(run)}<i>·</i>{when(h)}</span>
            </button>
            <span class="wk" aria-label={store.t('habitWeek')}>
              {#each week as d}
                {@const sched = occursOn(h, d)}
                <button type="button" class="d" class:on={h.doneDates.includes(d)} class:today={d === store.today} class:off={!sched} disabled={!sched} title={d} onclick={() => store.toggleDone(h, d)}>{weekday1(d)}</button>
              {/each}
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="empty">
        <p class="hint label">{store.t('habitsEmpty')}</p>
        <p>{store.t('habitsEmptyHint')}</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .add-new {
    display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto;
    height: 44px; padding: 0 16px 0 12px; border-radius: var(--r-key);
    background: var(--primary); color: var(--on-primary); font-weight: 600; font-size: 15px;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 25%), 0 2px 0 var(--key-edge);
    transition: transform 90ms var(--ease), filter 150ms ease;
  }
  .add-new:hover { filter: brightness(1.08); }
  .add-new:active { transform: translateY(2px); }
  .add-new :global(svg) { stroke-width: 2.4; }

  /* Habits | Tasks switch: one glass capsule */
  .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 16px 0 14px; padding: 4px; border-radius: 18px; background: var(--glass-fill); box-shadow: var(--glass-edge); }
  .seg button { height: 38px; border-radius: 14px; font-size: 15px; font-weight: 500; color: var(--muted); transition: background-color 150ms ease, color 150ms ease; }
  .seg button[aria-selected='true'] { color: var(--ink); font-weight: 600; background: var(--glass-lens); box-shadow: var(--glass-lens-edge); }

  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  li { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 22px; background: var(--glass-fill); box-shadow: var(--glass-edge); flex-wrap: wrap; }
  li.rest { opacity: .62; }
  .tick { display: grid; place-items: center; flex: 0 0 auto; width: 40px; height: 40px; border-radius: 50%; color: transparent; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c) 55%, var(--line)); transition: background 150ms ease, color 150ms ease, transform 120ms var(--ease); }
  .tick :global(svg) { stroke-width: 2.6; }
  .tick.on { background: var(--c); color: #fff; box-shadow: none; }
  .tick:active:not(:disabled) { transform: scale(.92); }
  .tick:disabled { cursor: default; }
  .body { flex: 1 1 120px; min-width: 0; display: flex; flex-direction: column; gap: 2px; text-align: left; }
  .hn { font-weight: 600; font-size: 16px; overflow-wrap: anywhere; }
  .hm { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px; color: var(--muted); font-family: var(--mono); font-size: 11.5px; }
  .hm i { font-style: normal; opacity: .6; }
  .wk { display: flex; gap: 4px; }
  .d { width: 26px; height: 26px; border-radius: 50%; font: 600 11px var(--mono); color: var(--muted); background: color-mix(in srgb, var(--ink) 7%, transparent); }
  .d.on { background: var(--c); color: #fff; }
  .d.off { opacity: .35; cursor: default; }
  .d.today:not(.on) { box-shadow: inset 0 0 0 1.5px var(--c); color: var(--ink); }
</style>
