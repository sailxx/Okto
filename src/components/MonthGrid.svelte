<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { addDays, monthStart, startOfWeek, toMin, weekday } from '../lib/date';
  import { fmtWeekdayShort } from '../lib/i18n';
  import { instancesInRange, isDoneOn, type Instance } from '../lib/recurrence';
  import type { Task } from '../lib/model';

  let { month, tasks, selected, compact, onpick }: {
    month: string; tasks: Task[]; selected: string; compact: boolean; onpick: (key: string) => void;
  } = $props();

  const first = $derived(startOfWeek(monthStart(month), store.weekStart));
  const days = $derived(Array.from({ length: 42 }, (_, i) => addDays(first, i)));
  const byDay = $derived.by(() => {
    const map = new Map<string, Instance[]>();
    for (const i of instancesInRange(tasks, days[0], days[41])) map.set(i.date, [...(map.get(i.date) ?? []), i]);
    for (const list of map.values()) list.sort((a, b) => (a.task.start ? toMin(a.task.start) : -1) - (b.task.start ? toMin(b.task.start) : -1));
    return map;
  });
  const inMonth = (k: string) => k.slice(0, 7) === month.slice(0, 7);
  const MAX = 3;
</script>

<div class="mg" class:compact>
  <div class="wd-row">
    {#each days.slice(0, 7) as d}<span class:weekend={[0, 6].includes(weekday(d))}>{fmtWeekdayShort(store.lang, d)}</span>{/each}
  </div>
  <div class="cells">
    {#each days as d (d)}
      {@const items = byDay.get(d) ?? []}
      <button
        type="button" class="cell" class:out={!inMonth(d)} class:sel={d === selected} class:today={d === store.today}
        onclick={() => onpick(d)}
      >
        <span class="num">{Number(d.slice(8))}</span>
        {#if compact}
          <span class="dots">
            {#each items.slice(0, 3) as i}<i style:--c={store.colorOf(i.task)} class:done={isDoneOn(i.task, i.date)}></i>{/each}
          </span>
        {:else}
          <span class="lines">
            {#each items.slice(0, items.length > MAX ? MAX - 1 : MAX) as i (i.task.id)}
              <span class="ln" class:done={isDoneOn(i.task, i.date)} style:--c={store.colorOf(i.task)}>
                {#if i.task.start}<em>{i.task.start}</em>{/if}{i.task.title}
              </span>
            {/each}
            {#if items.length > MAX}<span class="more">{store.t('more')(items.length - MAX + 1)}</span>{/if}
          </span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .mg { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  .wd-row { display: grid; grid-template-columns: repeat(7, 1fr); padding-bottom: 6px; }
  .wd-row span { color: var(--muted); font-size: 12px; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: .04em; }
  .wd-row span.weekend { opacity: .7; }
  .cells { display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 1fr; flex: 1; border-top: 1px solid var(--line); }
  .cell {
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px;
    min-width: 0; padding: 6px 2px; border-bottom: 1px solid var(--line);
    text-align: left;
  }
  .compact .cell { min-height: 52px; }
  .num { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; font-size: 16px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .out .num { color: var(--muted); opacity: .5; }
  .today .num { color: var(--accent); font-weight: 700; }
  .sel .num { background: var(--ink); color: var(--bg); font-weight: 600; opacity: 1; }
  .today.sel .num { background: var(--accent); color: var(--on-accent); }
  .dots { display: flex; gap: 3px; height: 6px; }
  .dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--c); }
  .dots i.done { opacity: .35; }

  .mg:not(.compact) .cell { align-items: stretch; padding: 6px 4px; border-left: 1px solid var(--line); min-height: 110px; }
  .mg:not(.compact) .cell:nth-child(7n + 1) { border-left: 0; }
  .mg:not(.compact) .num { align-self: flex-end; width: 28px; height: 28px; font-size: 14px; }
  .mg:not(.compact) .cell:hover { background: color-mix(in srgb, var(--soft) 60%, transparent); }
  .mg:not(.compact) .sel .num { background: none; color: inherit; }
  .mg:not(.compact) .today .num { background: var(--accent); color: var(--on-accent); }
  .lines { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .ln {
    display: flex; align-items: center; gap: 5px; min-width: 0;
    font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ln::before { content: ''; flex: 0 0 auto; width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
  .ln em { font-style: normal; color: var(--muted); font-weight: 500; font-variant-numeric: tabular-nums; }
  .ln.done { opacity: .45; text-decoration: line-through; }
  .more { color: var(--muted); font-size: 12px; font-weight: 600; padding-left: 12px; }
</style>
