<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import StatSheet from '../components/StatSheet.svelte';
  import ProfileSheet from '../components/ProfileSheet.svelte';
  import Digits from '../components/Digits.svelte';
  import { store } from '../lib/store.svelte';
  import { router } from '../lib/router.svelte';
  import { addDays, minutesNow, toMin } from '../lib/date';
  import { relDay } from '../lib/i18n';
  import { activityByDay, bestStreak, dayFocus, dayTaskStats, dayTasks, doneOnDay, lastDays, nextUp, streak, totalDone } from '../lib/stats';
  import { isDoneOn } from '../lib/recurrence';
  import { blockSize, DEFAULT_DASHBOARD, GRID_MAX_H, PRIORITY_COLORS, type Block, type BlockType } from '../lib/model';

  let editing = $state(false);
  let adding = $state(false);
  let profile = $state(false);
  let detail = $state<Block | null>(null);

  /* ---------- greeting ---------- */
  const hour = $derived(store.now.getHours());
  const autoGreeting = $derived(store.t(hour < 5 ? 'greetNight' : hour < 12 ? 'greetMorning' : hour < 18 ? 'greetDay' : hour < 23 ? 'greetEvening' : 'greetNight'));
  const s = $derived(store.data.settings);
  const greeting = $derived(`${s.greeting || autoGreeting}${s.name ? `, ${s.name}` : ''}`);

  /* ---------- data ---------- */
  // The Focus card leaves Home together with the Focus section.
  const blocks = $derived(s.dashboard.filter((b) => (b.type !== 'counter' || store.counters.some((c) => c.id === b.counterId)) && store.shows(b.type)));
  const days7 = $derived(lastDays(7, store.today));
  const days14 = $derived(lastDays(14, store.today));
  const tasks = $derived(dayTaskStats(store.tasks, store.today));
  const doneSeries = $derived(days14.map((d) => doneOnDay(store.tasks, d)));
  const focusSeries = $derived(days7.map((d) => dayFocus(store.sessions, d)));
  const days = $derived(streak(store.tasks, store.sessions, store.today));
  const activity = $derived(activityByDay(store.tasks, store.sessions));
  const best = $derived(bestStreak(activity.keys()));
  const next = $derived(nextUp(store.tasks, store.now));
  const todayTimed = $derived(dayTasks(store.tasks, store.today).filter((i) => i.task.start).sort((a, b) => toMin(a.task.start!) - toMin(b.task.start!)));
  // Today's checklist: open tasks first, timed ones by start.
  const todayList = $derived(dayTasks(store.tasks, store.today).sort((a, b) =>
    Number(isDoneOn(a.task, a.date)) - Number(isDoneOn(b.task, b.date))
    || (a.task.start ? toMin(a.task.start) : 1e4) - (b.task.start ? toMin(b.task.start) : 1e4)));

  /* ---------- period tabs ---------- */
  type Period = 'today' | 'week' | 'total';
  let period = $state<Period>('today');
  const PERIODS: [Period, 'today' | 'tabWeek' | 'tabTotal'][] = [['today', 'today'], ['week', 'tabWeek'], ['total', 'tabTotal']];
  const todayFocus = $derived(dayFocus(store.sessions, store.today));
  const weekDone = $derived(doneSeries.slice(7).reduce((a, n) => a + n, 0));
  const weekFocus = $derived(focusSeries.reduce((a, f) => ({ minutes: a.minutes + f.minutes, count: a.count + f.count }), { minutes: 0, count: 0 }));
  const weekActive = $derived(days7.filter((d) => (activity.get(d) ?? 0) > 0).length);
  const allDone = $derived(totalDone(store.tasks));
  const allFocus = $derived(store.sessions.reduce((a, x) => ({ minutes: a.minutes + x.minutes, count: a.count + 1 }), { minutes: 0, count: 0 }));

  const p2 = (n: number) => String(n).padStart(2, '0');
  const hm = (m: number) => ({ big: m < 60 ? String(m) : `${Math.floor(m / 60)}:${p2(m % 60)}`, unit: store.t(m < 60 ? 'unitMin' : 'unitHour') });
  const SEGS = 8;
  const lit = (ratio: number) => Math.round(Math.max(0, Math.min(1, ratio)) * SEGS);
  const dayLabel = (k: string) => relDay(store.lang, k, store.today, addDays(store.today, 1), addDays(store.today, -1));

  /** What each summary card shows for the chosen tab. */
  const tile = $derived.by(() => {
    const f = period === 'today' ? todayFocus : period === 'week' ? weekFocus : allFocus;
    return {
      focus: { ...hm(f.minutes), meta: period === 'today' ? store.t('focusCount')(f.count) : store.t(period === 'week' ? 'inWeek' : 'allTime') },
      streak: period === 'today' ? { big: String(days), unit: store.t('streakDays')(days), meta: store.t('bestStreak')(best) }
        : period === 'week' ? { big: `${weekActive}/7`, unit: '', meta: store.t('activeDays') }
        : { big: String(best), unit: store.t('streakDays')(best), meta: store.t('bestRun') },
      tasks: period === 'today'
        ? { big: `${tasks.done}/${tasks.total}`, unit: '', meta: tasks.total > tasks.done ? store.t('leftN')(tasks.total - tasks.done) : store.t('emptyToday') }
        : { big: String(period === 'week' ? weekDone : allDone), unit: '', meta: store.t(period === 'week' ? 'inWeek' : 'allTime') },
    };
  });

  const keyOf = (b: Block) => (b.type === 'counter' ? `counter:${b.counterId}` : b.type);
  const LABEL: Record<Exclude<BlockType, 'counter'>, 'bTasks' | 'bFocus' | 'bStreak' | 'bNext'> = { tasks: 'bTasks', focus: 'bFocus', streak: 'bStreak', next: 'bNext' };

  // Cards of switched-off sections keep their place, so they come back when the section does.
  function setBlocks(list: Block[]) {
    const hidden = s.dashboard.filter((b) => !store.shows(b.type));
    store.updateSettings({ dashboard: [...list, ...hidden].map((b) => ({ ...b })) });
  }
  /** Back to the default order and sizes, which are picked so rows fill up. */
  function resetLayout() {
    const rank = (b: Block) => { const i = DEFAULT_DASHBOARD.findIndex((d) => d.type === b.type); return i < 0 ? 99 : i; };
    setBlocks([...blocks].sort((a, b) => rank(a) - rank(b)).map((b) => (b.type === 'counter' ? { type: 'counter', counterId: b.counterId } : { type: b.type })));
  }
  function remove(b: Block) { setBlocks(blocks.filter((x) => keyOf(x) !== keyOf(b))); }
  const available = $derived([
    ...(['tasks', 'focus', 'streak', 'next'] as const).filter((t) => store.shows(t) && !blocks.some((b) => b.type === t)).map((t) => ({ type: t }) as Block),
    ...store.counters.filter((c) => !blocks.some((b) => b.counterId === c.id)).map((c) => ({ type: 'counter', counterId: c.id }) as Block),
  ]);

  function open(b: Block) {
    if (editing) return;
    if (b.type === 'next') { router.go('calendar'); return; }
    detail = b;
  }

  /* ---------- grid: columns follow the available width ---------- */
  const ROW = 80, GAP = 14;
  let gridEl = $state<HTMLDivElement>();
  let cols = $state(2);
  $effect(() => {
    if (!gridEl) return;
    const ro = new ResizeObserver(() => { const w = gridEl!.clientWidth; cols = w >= 1040 ? 6 : w >= 600 ? 4 : 2; });
    ro.observe(gridEl);
    return () => ro.disconnect();
  });
  const span = (b: Block) => { const { w, h } = blockSize(b, cols); return { w: Math.min(w, cols), h }; };

  /* ---------- edit mode: drag to swap, corner to resize ---------- */
  // While a gesture runs the layout lives here; it is saved once, on release.
  let draft = $state<Block[] | null>(null);
  const shown = $derived(draft ?? blocks);
  let dragKey = $state<string | null>(null);
  let lastSwap: string | null = null;
  let rz: { key: string; x: number; y: number; w: number; h: number; full: number } | null = null;
  let resizing = $state<string | null>(null);

  function dragDown(e: PointerEvent, b: Block) {
    if (!editing || e.button !== 0 || (e.target as Element).closest('.rm, .rz')) return;
    e.preventDefault();
    dragKey = keyOf(b); lastSwap = null;
    draft = blocks.map((x) => ({ ...x }));
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function dragMove(e: PointerEvent) {
    if (!dragKey || !draft) return;
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-key]')?.dataset.key;
    if (!over) { lastSwap = null; return; }
    if (over === dragKey || over === lastSwap) return;
    const from = draft.findIndex((x) => keyOf(x) === dragKey), to = draft.findIndex((x) => keyOf(x) === over);
    if (from < 0 || to < 0) return;
    [draft[from], draft[to]] = [draft[to], draft[from]];
    lastSwap = over;
  }
  function resizeDown(e: PointerEvent, b: Block) {
    e.preventDefault(); e.stopPropagation();
    const { w, h } = blockSize(b, cols);
    rz = { key: keyOf(b), x: e.clientX, y: e.clientY, w: Math.min(w, cols), h, full: w };
    resizing = rz.key;
    draft = blocks.map((x) => ({ ...x }));
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function resizeMove(e: PointerEvent) {
    if (!rz || !draft || !gridEl) return;
    const cell = (gridEl.clientWidth - GAP * (cols - 1)) / cols;
    const w = Math.max(1, Math.min(cols, rz.w + Math.round((e.clientX - rz.x) / (cell + GAP))));
    const h = Math.max(1, Math.min(GRID_MAX_H, rz.h + Math.round((e.clientY - rz.y) / (ROW + GAP))));
    const b = draft.find((x) => keyOf(x) === rz!.key);
    // On a narrow screen an untouched width keeps its wider desktop value.
    if (b) { b.w = w === rz.w ? rz.full : w; b.h = h; }
  }
  function gestureUp() {
    if (draft && (dragKey || rz)) setBlocks(draft);
    draft = null; dragKey = null; rz = null; resizing = null;
  }

  /* ---------- day timeline (next card): 06:00–24:00 ---------- */
  const T0 = 6 * 60, T1 = 24 * 60;
  const pct = (m: number) => Math.max(0, Math.min(100, ((m - T0) / (T1 - T0)) * 100));
</script>

{#snippet bar(on: number)}
  <span class="segs" aria-hidden="true">{#each Array(SEGS) as _, k}<i class:on={k < on}></i>{/each}</span>
{/snippet}

{#snippet head(icon: string, label: string)}
  <span class="chip"><Icon name={icon} size={17} /></span>
  <span class="ttl">{label}</span>
{/snippet}

{#snippet value(big: string, unit: string, delay: number)}
  <span class="read"><Digits class="big" text={big} {delay} />{#if unit}<em>{unit}</em>{/if}</span>
{/snippet}

<div class="page home">
  <div class="page-head">
    <div class="hello">
      <button type="button" class="greet" onclick={() => (profile = true)} title={store.t('editGreeting')}>
        <h1 class="page-title">{greeting}</h1>
      </button>
    </div>
  </div>

  <div class="tabs" role="tablist">
    {#each PERIODS as [key, label]}
      <button type="button" role="tab" aria-selected={period === key} onclick={() => (period = key)}>{store.t(label)}</button>
    {/each}
    <button type="button" class="edit-btn" class:on={editing} onclick={() => (editing = !editing)}>{editing ? store.t('done') : store.t('edit')}</button>
  </div>

  {#if editing}<p class="edit-hint">{store.t('editHint')}</p>{/if}

  <div class="blocks" class:editing bind:this={gridEl} style:--cols={cols} style:--row="{ROW}px" style:--gap="{GAP}px">
    {#each shown as b, i (keyOf(b))}
      {@const counter = b.type === 'counter' ? store.data.counters[b.counterId!] : null}
      {@const sz = span(b)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="blk" class:dragging={dragKey === keyOf(b)} class:resizing={resizing === keyOf(b)} data-key={keyOf(b)}
        style:grid-column="span {sz.w}" style:grid-row="span {sz.h}"
        onpointerdown={(e) => dragDown(e, b)} onpointermove={dragMove} onpointerup={gestureUp} onpointercancel={gestureUp}>
        <div class="cell {b.type}" class:acc={b.type === 'focus' || b.type === 'streak' || b.type === 'next' || b.type === 'tasks' || b.type === 'counter'} role="button" tabindex="0" aria-disabled={editing}
          style:--cc={counter?.color}
          onclick={() => open(b)} onkeydown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(b); }}>

          {#if b.type === 'tasks'}
            <div class="tk">
              <div class="tk-stats">
                {@render head('check', store.t('bTasks'))}
                {@render value(tile.tasks.big, tile.tasks.unit, i * 90)}
                {#if period === 'today'}{@render bar(lit(tasks.total ? tasks.done / tasks.total : 0))}{/if}
                <span class="meta">{tile.tasks.meta}</span>
              </div>
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
              <ul class="todo" aria-label={store.t('todayOf')(tasks.done, tasks.total)} onclick={(e) => e.stopPropagation()}>
                {#each todayList as it (it.task.id + it.date)}
                  {@const done = isDoneOn(it.task, it.date)}
                  <li class:done>
                    <button type="button" class="ck" style:--p={it.task.priority ? PRIORITY_COLORS[it.task.priority] : 'var(--t)'}
                      aria-label={store.t('taskDone')} aria-pressed={done} disabled={editing}
                      onclick={() => store.toggleDone(it.task, it.date)}>{#if done}<Icon name="check" size={13} />{/if}</button>
                    <button type="button" class="tt" disabled={editing} onclick={() => store.openTask(it.task, it.date)}>
                      <span class="tn">{it.task.title || '—'}</span>
                      {#if it.task.start}<span class="tm">{it.task.start}</span>{/if}
                    </button>
                  </li>
                {:else}
                  <li class="empty">{store.t('emptyToday')}</li>
                {/each}
              </ul>
            </div>

          {:else if b.type === 'focus'}
            {@render head('focus', store.t('bFocus'))}
            {@render value(tile.focus.big, tile.focus.unit, i * 90)}
            <span class="meta">{tile.focus.meta}</span>

          {:else if b.type === 'streak'}
            {@render head('flame', store.t('bStreak'))}
            {@render value(tile.streak.big, tile.streak.unit, i * 90)}
            <span class="meta">{tile.streak.meta}</span>

          {:else if b.type === 'next'}
            {@render head('clock', store.t('bNext'))}
            {#if next}
              <span class="read nxt"><Digits class="big" text={next.task.start ?? '--:--'} delay={i * 90} />
                <span class="nt"><b>{next.task.title}</b><small>{next.date === store.today ? store.t('today') : dayLabel(next.date)} · {store.listOf(next.task)?.name}</small></span>
              </span>
            {:else}
              <span class="read"><Digits class="big dim" text="--:--" delay={i * 90} /><span class="nt"><small>{store.t('nothingNext')}</small></span></span>
            {/if}
            <div class="line" aria-hidden="true">
              {#each [6, 9, 12, 15, 18, 21] as h}<span class="tick" style:left="{pct(h * 60)}%">{p2(h)}</span>{/each}
              {#each todayTimed as it (it.task.id)}
                {@const a = pct(toMin(it.task.start!))}
                <i class="slot" class:done={isDoneOn(it.task, it.date)} style:left="{a}%" style:width="max(4px, {pct(toMin(it.task.start!) + it.task.duration) - a}%)"></i>
              {/each}
              <b class="now" style:left="{pct(minutesNow(store.now))}%"></b>
            </div>

          {:else if counter}
            {@render head('plus', counter.name || store.t('counter'))}
            <span class="read"><Digits class="big" text={String(counter.count)} delay={i * 90} /><em>/{counter.target}</em></span>
            {@render bar(lit(counter.count / counter.target))}
            <span class="meta">{store.t('goalLine')(String(counter.target))}</span>
          {/if}
        </div>
        {#if editing}
          <button type="button" class="rm" aria-label={store.t('remove')} onclick={() => remove(b)}><Icon name="minus" size={14} /></button>
          <span class="grip" aria-hidden="true"><Icon name="grip" size={16} /></span>
          <span class="rz" role="button" tabindex="-1" aria-label={store.t('resize')} title={store.t('resize')}
            onpointerdown={(e) => resizeDown(e, b)} onpointermove={resizeMove} onpointerup={gestureUp} onpointercancel={gestureUp}></span>
          <span class="dims" aria-hidden="true">{sz.w}×{sz.h}</span>
        {/if}
      </div>
    {/each}
  </div>

  {#if editing}
    <div class="edit-actions">
      <button type="button" class="add-block" onclick={() => (adding = true)}><Icon name="plus" size={18} />{store.t('addBlock')}</button>
      <button type="button" class="add-block" onclick={resetLayout}><Icon name="sync" size={18} />{store.t('resetLayout')}</button>
    </div>
  {/if}
</div>

{#if adding}
  <Sheet title={store.t('addBlock')} onclose={() => (adding = false)}>
    {#if available.length}
      <div class="avail">
        {#each available as b (keyOf(b))}
          {@const c = b.counterId ? store.data.counters[b.counterId] : null}
          <form method="dialog"><button class="avail-row" onclick={() => setBlocks([...blocks, b])}>
            <span class="dot" style:--c={c ? c.color : 'var(--ink)'}></span>
            <span>{c ? `${store.t('bCounter')}: ${c.name || store.t('counter')}` : store.t(LABEL[b.type as Exclude<BlockType, 'counter'>])}</span>
            <Icon name="plus" size={18} />
          </button></form>
        {/each}
      </div>
    {:else}
      <p class="sub">{store.t('allAdded')}</p>
    {/if}
  </Sheet>
{/if}

{#if detail}<StatSheet block={detail} onclose={() => (detail = null)} />{/if}
{#if profile}<ProfileSheet onclose={() => (profile = false)} />{/if}

<style>
  .home { width: min(100% - 32px, 1560px); }
  .hello { min-width: 0; }
  .greet { display: block; max-width: 100%; text-align: left; border-radius: 8px; }
  .greet .page-title { overflow-wrap: anywhere; font-size: clamp(24px, 6vw, 30px); font-weight: 650; letter-spacing: -.025em; }
  .greet:hover .page-title { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; text-decoration-color: var(--line); }

  /* Period tabs; the layout switch sits quietly at the end of the row */
  .edit-btn { margin: 0 0 0 auto; padding: 0 0 10px; font-size: 15px; font-weight: 500; line-height: inherit; color: var(--muted); opacity: .8; transition: color 150ms ease, opacity 150ms ease; }
  .edit-btn:hover, .edit-btn.on { color: var(--ink); opacity: 1; }
  .edit-btn.on { font-weight: 600; }
  /* Period tabs */
  .tabs { display: flex; align-items: flex-end; gap: 22px; margin-top: 18px; border-bottom: 1px solid var(--line); }
  .tabs button { position: relative; padding: 0 0 10px; font-size: 15px; font-weight: 500; color: var(--muted); transition: color 150ms ease; }
  .tabs button[aria-selected='true'] { color: var(--ink); font-weight: 600; }
  .tabs button[aria-selected='true']::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; border-radius: 2px; background: var(--ink); }

  /* Cards: one anatomy — icon chip, title, big value, small note, round arrow in the corner. */
  .blocks {
    --t: var(--ink); --td: var(--muted); --tg: color-mix(in srgb, var(--ink) 12%, transparent);
    display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); grid-auto-rows: var(--row);
    grid-auto-flow: row dense; gap: var(--gap); margin-top: 18px;
  }
  .blk { position: relative; min-width: 0; min-height: 0; }

  .cell {
    container-type: size; position: relative;
    width: 100%; height: 100%; padding: 16px 18px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; cursor: pointer; overflow: hidden;
    background: color-mix(in srgb, var(--soft) 78%, var(--bg)); color: var(--t);
    border-radius: 24px;
    box-shadow: inset 0 0 0 1px var(--line), 0 1px 2px rgb(0 0 0 / 4%), 0 18px 34px -24px rgb(0 0 0 / 32%);
    transition: box-shadow 150ms ease, transform 150ms var(--ease);
  }
  .cell:hover { box-shadow: inset 0 0 0 1px var(--key-edge), 0 1px 2px rgb(0 0 0 / 4%), 0 20px 36px -24px rgb(0 0 0 / 40%); }
  .cell:active { transform: scale(.992); }
  .cell::after {
    content: '↗'; position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border-radius: 50%;
    display: grid; place-items: center; font-size: 15px; line-height: 1;
    background: var(--ink); color: var(--bg);
  }
  .editing .cell::after { display: none; }

  /* Coloured cards: Focus takes the theme colour, Streak is warm, a counter brings its own. */
  .cell.acc { --t: #fff; --td: rgb(255 255 255 / 78%); --tg: rgb(255 255 255 / 22%); color: #fff; box-shadow: inset 0 1px 0 rgb(255 255 255 / 25%), 0 20px 34px -22px rgb(0 0 0 / 50%); }
  .cell.focus { --t: var(--on-primary); --td: color-mix(in srgb, var(--on-primary) 74%, transparent); --tg: color-mix(in srgb, var(--on-primary) 22%, transparent); color: var(--on-primary); background: linear-gradient(150deg, var(--primary), color-mix(in srgb, var(--primary) 62%, var(--on-primary))); }
  .cell.streak { background: linear-gradient(150deg, #ff9142, #e5484d); }
  .cell.tasks { background: linear-gradient(150deg, #34b27b, #0f9d8c); }
  .cell.next { background: linear-gradient(150deg, #8b6cf6, #4f7cf0); }
  .cell.counter { background: linear-gradient(150deg, var(--cc, #0090ff), color-mix(in srgb, var(--cc, #0090ff) 62%, #000)); }
  .cell.focus::after { background: var(--on-primary); color: var(--primary); }
  .cell.streak::after, .cell.next::after, .cell.tasks::after, .cell.counter::after { background: rgb(255 255 255 / 92%); color: #1d1d1f; }

  .chip { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; flex: 0 0 auto; background: var(--tg); color: var(--t); }
  .chip :global(svg) { stroke-width: 2; }
  .ttl { margin-top: 6px; font-size: 14px; font-weight: 500; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .read { display: flex; align-items: baseline; gap: 8px; min-width: 0; margin-top: auto; }
  .read :global(.big) { font-size: clamp(30px, min(17cqi, 30cqh), 56px); font-weight: 700; letter-spacing: -.04em; line-height: .95; }
  .read :global(.big.dim) { color: var(--td); }
  .read em { font-style: normal; font-size: 14px; font-weight: 500; color: var(--td); white-space: nowrap; }
  .meta { font-size: 13px; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

  .segs { display: flex; gap: 4px; width: 100%; max-width: 160px; height: 4px; margin: 4px 0 2px; }
  .segs i { flex: 1; border-radius: 3px; background: var(--tg); transition: background-color 300ms ease; }
  .segs i.on { background: var(--t); }

  /* Up next: time and title, plus the day strip when there is room */
  .nxt { align-items: flex-end; gap: 14px; width: 100%; }
  .nt { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-bottom: 2px; }
  .nt b { font-family: var(--sans); font-size: 15px; font-weight: 600; line-height: 1.25; color: var(--t); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
  .nt small { font-size: 12px; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .line { display: none; position: relative; width: 100%; height: 30px; flex: 0 0 auto; margin-top: 6px; border-top: 1px solid var(--tg); }
  @container (min-height: 150px) and (min-width: 330px) { .line { display: block; } }
  .tick { position: absolute; top: 18px; transform: translateX(-50%); font-family: var(--mono); font-size: 10px; color: var(--td); }
  .tick:first-child { transform: none; }
  .slot { position: absolute; top: 5px; height: 10px; border-radius: 3px; background: var(--t); }
  .slot.done { opacity: .3; }
  .now { position: absolute; top: 0; width: 2px; height: 18px; margin-left: -1px; background: var(--red); }

  /* Tasks: summary, and today's checklist beside it (wide) or under it (tall) */
  .tk { flex: 1; width: 100%; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .tk-stats { min-height: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .todo { display: none; margin: 0; padding: 0 2px 0 0; list-style: none; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
  @container (min-width: 520px) and (min-height: 190px) {
    .tk { grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 22px; }
    .todo { display: block; border-left: 1px solid var(--tg); padding: 36px 0 0 22px; }
  }
  @container (max-width: 519px) and (min-height: 250px) {
    .tk { grid-template-rows: auto minmax(0, 1fr); }
    .todo { display: block; border-top: 1px solid var(--tg); padding-top: 2px; }
  }
  .todo li { display: flex; align-items: center; gap: 12px; min-height: 40px; border-bottom: 1px solid var(--tg); }
  .todo li:last-child { border-bottom: 0; }
  .todo .empty { color: var(--td); font-size: 14px; }
  .ck {
    flex: 0 0 auto; width: 22px; height: 22px; display: grid; place-items: center;
    border: 2px solid var(--p); border-radius: 50%; color: var(--ck, var(--bg));
    transition: background-color 150ms ease, transform 120ms ease;
  }
  .ck:active { transform: scale(.88); }
  .ck[aria-pressed='true'] { background: var(--p); }
  .cell.tasks { --ck: #12856f; }
  .ck :global(svg) { stroke-width: 3.5; }
  .tt { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 10px; padding: 8px 0; text-align: left; color: var(--t); }
  .tn { flex: 1; min-width: 0; font-size: 15px; font-weight: 500; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tm { flex: 0 0 auto; font-size: 13px; color: var(--td); font-variant-numeric: tabular-nums; }
  .tt:hover .tn { text-decoration: underline; text-decoration-color: var(--td); text-underline-offset: 3px; }
  .todo li.done .tn { color: var(--td); text-decoration: line-through; }
  .editing .todo { pointer-events: none; }

  /* Narrow cards show the reading only */
  @container (max-width: 150px) { .meta { display: none; } }
  @container (max-height: 120px) { .ttl, .meta, .segs { display: none; } }

  /* Edit mode */
  .edit-hint { margin: 10px 2px 0; color: var(--muted); font-family: var(--mono); font-size: 12px; letter-spacing: .02em; }
  .editing .blk { touch-action: none; user-select: none; -webkit-user-select: none; }
  .editing .cell { box-shadow: inset 0 0 0 2px var(--key-edge); }
  .editing .blk.dragging .cell, .editing .blk.resizing .cell { box-shadow: inset 0 0 0 2px var(--primary); }
  .editing .blk.dragging { opacity: .7; cursor: grabbing; z-index: 1; }
  .cell[aria-disabled='true'] { cursor: grab; }
  .rm { position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: var(--bg); color: var(--red); box-shadow: 0 0 0 1px var(--line); z-index: 2; }
  .rm:hover { background: var(--red); color: #fff; }
  .grip { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); color: var(--td, var(--muted)); pointer-events: none; opacity: .7; }
  .grip :global(svg) { transform: rotate(90deg); }
  .rz { position: absolute; right: 0; bottom: 0; width: 30px; height: 30px; cursor: nwse-resize; touch-action: none; z-index: 2; }
  .rz::after { content: ''; position: absolute; right: 9px; bottom: 9px; width: 10px; height: 10px; border-right: 2px solid var(--muted); border-bottom: 2px solid var(--muted); border-bottom-right-radius: 3px; }
  .rz:hover::after, .resizing .rz::after { border-color: var(--primary); }
  .dims { position: absolute; right: 34px; bottom: 10px; font-family: var(--mono); font-size: 10px; color: var(--muted); pointer-events: none; }
  .edit-actions { display: flex; gap: 10px; margin-top: 14px; }
  .add-block { display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1; height: 50px; border-radius: var(--r-key); box-shadow: inset 0 0 0 1px var(--line); color: var(--muted); font-family: var(--mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
  .add-block:hover { color: var(--ink); background: var(--soft); }
  .avail { display: flex; flex-direction: column; }
  .avail-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; border-bottom: 1px solid var(--line); font-size: 16px; text-align: left; }
  .avail-row span:nth-child(2) { flex: 1; }
  .dot { width: 9px; height: 9px; border-radius: 2px; background: var(--c); }
</style>
