<script lang="ts">
  import TaskRow from '../components/TaskRow.svelte';
  import ListEditor from '../components/ListEditor.svelte';
  import { store } from '../lib/store.svelte';
  import { addDays, toMin } from '../lib/date';
  import { relDay, fmtLongDay } from '../lib/i18n';
  import { instancesInRange, isDoneOn, occurrences, type Instance } from '../lib/recurrence';
  import { dayTaskStats, overdue } from '../lib/stats';
  import type { Task } from '../lib/model';

  type Group = { key: string; label: string; late?: boolean; items: Instance[]; showDate?: boolean };

  let listEdit = $state<{ id: string | null } | null>(null);
  const filter = $derived(store.device.taskFilter);
  const setFilter = (f: string) => store.setDevice({ taskFilter: f });
  const stats = $derived(dayTaskStats(store.tasks, store.today));

  const byTime = (a: Instance, b: Instance) => {
    const da = isDoneOn(a.task, a.date) ? 1 : 0, db = isDoneOn(b.task, b.date) ? 1 : 0;
    if (da !== db) return da - db;
    const ta = a.task.start ? toMin(a.task.start) : -1, tb = b.task.start ? toMin(b.task.start) : -1;
    return ta - tb || b.task.priority - a.task.priority || a.task.createdAt - b.task.createdAt;
  };

  /** Pending tasks, each series once at its next occurrence. */
  function pending(tasks: Task[]): Instance[] {
    const out: Instance[] = [];
    for (const t of tasks) {
      if (t.repeat) {
        const next = occurrences(t, store.today, addDays(store.today, 400)).find((d) => !isDoneOn(t, d));
        if (next) out.push({ task: t, date: next });
      } else if (!t.done) out.push({ task: t, date: t.date ?? '' });
    }
    return out;
  }

  function datedGroups(items: Instance[]): Group[] {
    const tomorrow = addDays(store.today, 1), yesterday = addDays(store.today, -1);
    const map = new Map<string, Instance[]>();
    for (const i of items) { const k = i.date || 'none'; map.set(k, [...(map.get(k) ?? []), i]); }
    return [...map.entries()]
      .sort(([a], [b]) => (a === 'none' ? 1 : b === 'none' ? -1 : a.localeCompare(b)))
      .map(([k, list]) => ({
        key: k,
        label: k === 'none' ? store.t('fNoDate') : relDay(store.lang, k, store.today, tomorrow, yesterday),
        late: k !== 'none' && k < store.today,
        items: list.sort(byTime),
      }));
  }

  const groups = $derived.by((): Group[] => {
    const tasks = store.tasks;
    const today = store.today;
    if (filter === 'today') {
      const late = overdue(tasks, today);
      const out: Group[] = [];
      if (late.length) out.push({ key: 'late', label: store.t('overdue'), late: true, showDate: true, items: late.map((t) => ({ task: t, date: t.date! })).sort((a, b) => a.date.localeCompare(b.date)) });
      out.push({ key: 'today', label: fmtLongDay(store.lang, today), items: instancesInRange(tasks, today, today).sort(byTime) });
      return out;
    }
    if (filter === 'upcoming') return datedGroups(instancesInRange(tasks, addDays(today, 1), addDays(today, 14)));
    if (filter === 'nodate') return [{ key: 'none', label: '', items: tasks.filter((t) => !t.date && !t.done).map((t) => ({ task: t, date: '' })).sort(byTime) }];
    if (filter === 'done') {
      const done = tasks.filter((t) => !t.repeat && t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).slice(0, 200);
      return [{ key: 'done', label: '', showDate: true, items: done.map((t) => ({ task: t, date: t.date ?? '' })) }];
    }
    const pool = filter.startsWith('list:') ? tasks.filter((t) => t.listId === filter.slice(5)) : tasks;
    return datedGroups(pending(pool));
  });

  const isEmpty = $derived(groups.every((g) => g.items.length === 0));
  const filters: [string, 'fToday' | 'fUpcoming' | 'fAll' | 'fNoDate' | 'fDone'][] = [
    ['today', 'fToday'], ['upcoming', 'fUpcoming'], ['all', 'fAll'], ['nodate', 'fNoDate'], ['done', 'fDone'],
  ];

  function pickList(id: string) {
    if (filter === `list:${id}`) listEdit = { id };
    else setFilter(`list:${id}`);
  }
</script>

<div class="page wide">
  <div class="page-head">
    <div>
      <h1 class="page-title">{store.t('tasks')}</h1>
      <p class="page-sub">{store.t('todayOf')(stats.done, stats.total)}</p>
    </div>
  </div>

  <div class="tags" role="listbox">
    {#each filters as [key, label]}
      <button type="button" class="tag plain" role="option" aria-selected={filter === key} onclick={() => setFilter(key)}>{store.t(label)}</button>
    {/each}
    <span class="sep" aria-hidden="true"></span>
    {#each store.lists as l (l.id)}
      <button type="button" class="tag" role="option" style:--c={l.color} aria-selected={filter === `list:${l.id}`} onclick={() => pickList(l.id)}>{l.name}</button>
    {/each}
    <button type="button" class="tag add" onclick={() => (listEdit = { id: null })}>+ {store.t('addList')}</button>
  </div>

  {#if isEmpty}
    <div class="empty">
      <p class="hint">{filter === 'today' ? store.t('emptyToday') : store.t('emptyList')}</p>
      <p>{store.t('emptyHint')}</p>
    </div>
  {:else}
    {#each groups as g (g.key)}
      {#if g.items.length}
        <section class="group-sec">
          {#if g.label}<h2 class="label" class:late={g.late}>{g.label}</h2>{/if}
          {#each g.items as i (i.task.id + i.date)}
            <TaskRow task={i.task} date={i.date || null} showDate={g.showDate} />
          {/each}
        </section>
      {/if}
    {/each}
  {/if}
</div>

{#if listEdit}<ListEditor id={listEdit.id} onclose={() => (listEdit = null)} />{/if}

<style>
  .tags { margin-top: 18px; }
  .tag.plain::before { display: none; }
  .tag.plain { padding: 0 14px; }
  .sep { flex: 0 0 1px; align-self: stretch; margin: 6px 2px; background: var(--line); }
  .group-sec { margin-top: 22px; }
  .group-sec .label { margin: 0 0 2px 2px; }
  .label.late { color: var(--red); }
</style>
