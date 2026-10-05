<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import TimeGrid from '../components/TimeGrid.svelte';
  import MonthGrid from '../components/MonthGrid.svelte';
  import MiniMonth from '../components/MiniMonth.svelte';
  import TaskRow from '../components/TaskRow.svelte';
  import ScopeSheet from '../components/ScopeSheet.svelte';
  import { store, type Scope } from '../lib/store.svelte';
  import { addDays, addMonths, monthStart, startOfWeek, toMin } from '../lib/date';
  import { fmtLongDay, fmtMonth, fmtWeekdayNarrow } from '../lib/i18n';
  import { instancesInRange, isDoneOn, type Instance } from '../lib/recurrence';
  import type { Task } from '../lib/model';

  type View = 'day' | 'week' | 'month';
  const mq = matchMedia('(min-width: 900px)');
  let desktop = $state(mq.matches);
  onMount(() => {
    const on = () => { desktop = mq.matches; };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  });

  const view = $derived<View>(store.device.calView ?? (desktop ? 'week' : 'month'));
  const setView = (v: View) => store.setDevice({ calView: v });
  let cursor = $state(store.today);
  let miniMonth = $state(monthStart(store.today));
  let pendingMove = $state<{ inst: Instance; patch: Partial<Task> } | null>(null);

  const visible = $derived(store.tasks.filter((t) => !store.data.settings.hiddenLists.includes(t.listId)));
  const weekLen = $derived(desktop ? 7 : 3);
  const days = $derived(
    view === 'day' ? [cursor]
      : desktop ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor, store.weekStart), i))
      : Array.from({ length: 3 }, (_, i) => addDays(cursor, i)),
  );
  const titleKey = $derived(view === 'month' ? cursor : days[0]);
  const strip = $derived(Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor, store.weekStart), i)));

  function step(dir: 1 | -1) {
    if (view === 'month') cursor = addMonths(cursor, dir);
    else if (view === 'week') cursor = addDays(cursor, dir * weekLen);
    else cursor = addDays(cursor, dir);
    miniMonth = monthStart(cursor);
  }
  function goToday() { cursor = store.today; miniMonth = monthStart(cursor); }
  function openDay(k: string) { cursor = k; setView('day'); }

  function pickMonthDay(k: string) {
    if (desktop) openDay(k);
    else cursor = k;
  }

  const dayList = $derived(
    instancesInRange(visible, cursor, cursor).sort((a, b) => {
      const da = isDoneOn(a.task, a.date) ? 1 : 0, db = isDoneOn(b.task, b.date) ? 1 : 0;
      return da - db || (a.task.start ? toMin(a.task.start) : -1) - (b.task.start ? toMin(b.task.start) : -1);
    }),
  );

  function onmove(inst: Instance, patch: Partial<Task>) {
    if (inst.task.repeat) pendingMove = { inst, patch };
    else store.saveTask({ ...inst.task, ...patch });
  }
  function applyScope(scope: Scope) {
    if (!pendingMove) return;
    store.editTask(pendingMove.inst.task, pendingMove.inst.date, pendingMove.patch, scope);
    pendingMove = null;
  }

  function toggleList(id: string) {
    const hidden = store.data.settings.hiddenLists;
    store.updateSettings({ hiddenLists: hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id] });
  }

  /* Horizontal swipe on phones flips the period. */
  let sx = 0, sy = 0, swiping = false;
  function tDown(e: PointerEvent) { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; swiping = true; }
  function tUp(e: PointerEvent) {
    if (!swiping) return;
    swiping = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }
</script>

<div class="page full cal" class:desktop>
  {#if desktop}
    <aside class="cal-side">
      <MiniMonth value={cursor} bind:month={miniMonth} onpick={(k) => { cursor = k; }} />
      <div class="lists">
        <span class="label">{store.t('lists')}</span>
        {#each store.lists as l (l.id)}
          <label class="lst" style:--c={l.color}>
            <input type="checkbox" checked={!store.data.settings.hiddenLists.includes(l.id)} onchange={() => toggleList(l.id)} />
            <i></i><span>{l.name}</span>
          </label>
        {/each}
      </div>
    </aside>
  {/if}

  <section class="cal-main">
    <header class="cal-head">
      <h1 class="page-title">{fmtMonth(store.lang, titleKey)} <span>{titleKey.slice(0, 4)}</span></h1>
      <div class="nav">
        <button type="button" class="text-btn" onclick={goToday}>{store.t('today')}</button>
        <button type="button" class="icon-btn" aria-label={store.t('prev')} onclick={() => step(-1)}><Icon name="left" /></button>
        <button type="button" class="icon-btn" aria-label={store.t('nextP')} onclick={() => step(1)}><Icon name="right" /></button>
      </div>
    </header>

    <div class="seg views">
      {#each [['day', 'vDay'], ['week', 'vWeek'], ['month', 'vMonth']] as const as [v, l]}
        <button type="button" aria-pressed={view === v} onclick={() => setView(v)}>{store.t(l)}</button>
      {/each}
    </div>

    <div class="cal-body" onpointerdown={tDown} onpointerup={tUp} onpointercancel={() => (swiping = false)} role="presentation">
      {#if view === 'month'}
        <MonthGrid month={cursor} tasks={visible} selected={cursor} compact={!desktop} onpick={pickMonthDay} />
        {#if !desktop}
          <div class="day-list">
            <h2 class="label">{fmtLongDay(store.lang, cursor)}</h2>
            {#each dayList as i (i.task.id + i.date)}
              <TaskRow task={i.task} date={i.date} />
            {:else}
              <button type="button" class="empty-add" onclick={() => store.openNewTask({ date: cursor })}>+ {store.t('newTask')}</button>
            {/each}
          </div>
        {/if}
      {:else}
        {#if view === 'day' && !desktop}
          <div class="strip">
            {#each strip as d}
              <button type="button" class:sel={d === cursor} class:today={d === store.today} onclick={() => (cursor = d)}>
                <span>{fmtWeekdayNarrow(store.lang, d)}</span><b>{Number(d.slice(8))}</b>
              </button>
            {/each}
          </div>
        {/if}
        {#key days.join()}
          <TimeGrid {days} tasks={visible} {onmove} onday={openDay} />
        {/key}
      {/if}
    </div>
  </section>
</div>

{#if pendingMove}
  <ScopeSheet onpick={applyScope} onclose={() => (pendingMove = null)} />
{/if}

<style>
  .cal { padding-bottom: 0; }
  .cal-main { display: flex; flex-direction: column; min-width: 0; min-height: 0; flex: 1; }
  .cal:not(.desktop) .cal-main { flex: none; height: calc(100svh - var(--chrome)); }
  .cal.desktop { flex-direction: row; gap: 28px; height: 100svh; padding-top: 24px; }
  .cal.desktop .cal-main { height: calc(100svh - 24px); padding-bottom: 16px; }
  .cal-side { width: 240px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 24px; padding-top: 6px; }
  .cal-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 6px; }
  .cal-head .page-title { font-size: clamp(26px, 7vw, 40px); white-space: nowrap; }
  .page-title span { color: var(--muted); }
  .nav { display: flex; align-items: center; }
  .views { margin: 12px 0 10px; }
  .views { grid-template-columns: repeat(3, 1fr); }
  .cal-body { display: flex; flex-direction: column; flex: 1; min-height: 0; }

  .day-list { margin-top: 14px; overflow-y: auto; flex: 0 1 auto; padding-bottom: 80px; }
  .day-list .label { margin: 0 0 2px 2px; }
  .empty-add { padding: 14px 2px; color: var(--muted); font-size: 15px; font-weight: 600; }

  .strip { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
  .strip button { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0; }
  .strip span { color: var(--muted); font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .strip b { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .strip .today b { color: var(--accent); }
  .strip .sel b { background: var(--ink); color: var(--bg); }
  .strip .today.sel b { background: var(--accent); color: var(--on-accent); }

  .lists { display: flex; flex-direction: column; gap: 2px; }
  .lst { display: flex; align-items: center; gap: 10px; min-height: 34px; font-size: 15px; font-weight: 500; cursor: pointer; }
  .lst input { position: absolute; opacity: 0; pointer-events: none; }
  .lst i { width: 18px; height: 18px; border-radius: 5px; border: 2px solid var(--c); display: grid; place-items: center; }
  .lst input:checked + i { background: var(--c); }
  .lst input:checked + i::after { content: ''; width: 8px; height: 4px; margin-top: -2px; border: solid #fff; border-width: 0 0 2px 2px; transform: rotate(-45deg); }
  .lst input:focus-visible + i { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
