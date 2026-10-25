<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import StatSheet from '../components/StatSheet.svelte';
  import ProfileSheet from '../components/ProfileSheet.svelte';
  import Digits from '../components/Digits.svelte';
  import GithubCard from '../components/GithubCard.svelte';
  import LeetcodeCard from '../components/LeetcodeCard.svelte';
  import LeetStatsCard from '../components/LeetStatsCard.svelte';
  import { store } from '../lib/store.svelte';
  import { router } from '../lib/router.svelte';
  import { addDays, minutesNow, toMin } from '../lib/date';
  import { relDay } from '../lib/i18n';
  import { activityByDay, bestStreak, dayFocus, dayTaskStats, dayTasks, doneOnDay, lastDays, nextUp, streak, totalDone } from '../lib/stats';
  import { isDoneOn } from '../lib/recurrence';
  import { currentProblem, leetcodeTasks, problemUrl } from '../lib/leetcode';
  import { dayScore, fmtMoney, habitsOn, monthTotals, ratio } from '../lib/life';
  import { blockSize, COLORS, DEFAULT_DASHBOARD, GRID_MAX_H, GRID_PHONE_W, isPhoneGrid, phoneDefault, PRIORITY_COLORS, type Block, type BlockType } from '../lib/model';

  let editing = $state(false);
  let adding = $state(false);
  let profile = $state(false);
  let detail = $state<Block | null>(null);
  let painting = $state<string | null>(null);

  /* ---------- greeting ---------- */
  const hour = $derived(store.now.getHours());
  const autoGreeting = $derived(store.t(hour < 5 ? 'greetNight' : hour < 12 ? 'greetMorning' : hour < 18 ? 'greetDay' : hour < 23 ? 'greetEvening' : 'greetNight'));
  const s = $derived(store.data.settings);
  const greeting = $derived.by(() => { const g = `${s.greeting || autoGreeting}${s.name ? `, ${s.name}` : ""}`; return /[!?.…]$/.test(g) ? g : g + "!"; });

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
  const SEGS = 12;
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

  /* ---------- habits, health, finance ---------- */
  const habitsToday = $derived(habitsOn(store.habits, store.today));
  const habitsDone = $derived(habitsToday.filter((x) => x.done).length);
  const habitsTotal = $derived(habitsToday.length);
  const health = $derived(store.healthOf(store.today));
  const money = $derived(monthTotals(store.money, store.today));
  const budgetLeft = $derived(s.budget - money.spent);
  const cash = (n: number) => `${fmtMoney(n, store.lang)} ${store.t('fCurrency')}`;

  /* ---------- productivity: share of the day's tasks and habits that got done, per day ---------- */
  const prodDays = $derived(lastDays(period === 'total' ? 30 : 14, store.today));
  const prod = $derived.by(() => {
    const series = prodDays.map((d) => {
      const t = dayTaskStats(store.tasks, d), h = habitsOn(store.habits, d);
      const total = t.total + h.length;
      return total ? Math.round(((t.done + h.filter((x) => x.done).length) / total) * 100) : 0;
    });
    const avg = Math.round(series.reduce((a, n) => a + n, 0) / series.length);
    return { series, avg };
  });
  const W = 300, H = 100;
  const prodPts = $derived(prod.series.map((n, k) => [(k / Math.max(1, prod.series.length - 1)) * W, H - (n / 100) * H] as const));
  const prodLine = $derived(prodPts.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '));
  const prodArea = $derived(`${prodLine} L${W} ${H} L0 ${H} Z`);

  /* ---------- goal ---------- */
  let goalOpen = $state(false);
  let goalDraft = $state({ title: '', due: '', pct: 0 });
  const goal = $derived(s.goal);
  const goalDays = $derived(goal.due ? Math.max(0, Math.round((new Date(`${goal.due}T12:00:00`).getTime() - new Date(`${store.today}T12:00:00`).getTime()) / 86400000)) : null);
  const goalDue = $derived(goal.due ? new Intl.DateTimeFormat(store.lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' }).format(new Date(`${goal.due}T12:00:00`)) : '');
  function openGoal() { if (editing) return; goalDraft = { ...goal }; goalOpen = true; }
  function saveGoal() { store.updateSettings({ goal: { title: goalDraft.title.trim().slice(0, 120), due: goalDraft.due, pct: Math.max(0, Math.min(100, Math.round(goalDraft.pct))) } }); }
  const focusGoalHm = $derived(hm(s.focusGoal));

  /* ---------- day score ---------- */
  const score = $derived(dayScore({ tasksDone: tasks.done, tasksTotal: tasks.total, focusMin: todayFocus.minutes, habitsDone, habitsTotal: habitsTotal, water: health.water, waterGoal: s.waterGoal }));
  const scoreState = $derived((score < 25 ? 'dayS0' : score < 50 ? 'dayS1' : score < 75 ? 'dayS2' : 'dayS3') as 'dayS0' | 'dayS1' | 'dayS2' | 'dayS3');
  const SCALE = ['#f3b4bd', '#dcdce1', '#b9cbf5', '#a9e0c4'];
  const keyOf = (b: Block) => (b.type === 'counter' ? `counter:${b.counterId}` : b.type);
  const LABEL: Record<Exclude<BlockType, 'counter'>, 'bTasks' | 'bFocus' | 'bStreak' | 'bNext' | 'bGithub' | 'bLeetcode' | 'bHabits' | 'bHealth' | 'bFinance' | 'dayScore' | 'bProd' | 'bGoal' | 'bLeetStats'> = { tasks: 'bTasks', focus: 'bFocus', streak: 'bStreak', next: 'bNext', github: 'bGithub', leetcode: 'bLeetcode', habits: 'bHabits', health: 'bHealth', finance: 'bFinance', score: 'dayScore', productivity: 'bProd', goal: 'bGoal', leetstats: 'bLeetStats' };

  // Cards of switched-off sections keep their place, so they come back when the section does.
  function setBlocks(list: Block[]) {
    const hidden = s.dashboard.filter((b) => !store.shows(b.type));
    store.updateSettings({ dashboard: [...list, ...hidden].map((b) => ({ ...b })) });
  }
  /** Phone sizes as they look now, so desktop edits stop leaking into them. */
  const freezePhone = (b: Block): Block => { const { w, h } = blockSize(b, 2); return { ...b, pw: b.pw ?? Math.min(w, GRID_PHONE_W), ph: b.ph ?? h }; };
  /** Back to the default order and sizes, which are picked so rows fill up. Only this device's sizes reset. */
  function resetLayout() {
    const rank = (b: Block) => { const i = DEFAULT_DASHBOARD.findIndex((d) => d.type === b.type); return i < 0 ? 99 : i; };
    const phone = isPhoneGrid(cols);
    setBlocks([...blocks].sort((a, b) => rank(a) - rank(b)).map((b) => {
      if (phone) return { ...b, ...phoneDefault(b) };
      const { w: _w, h: _h, ...rest } = freezePhone(b);
      return rest;
    }));
  }
  const painted = $derived(blocks.find((b) => keyOf(b) === painting) ?? null);
  /** Без `tint` карточка возвращает стандартный цвет. */
  function paint(b: Block, tint?: string) {
    setBlocks(blocks.map((x) => { if (keyOf(x) !== keyOf(b)) return x; const { tint: _, ...rest } = x; return tint ? { ...rest, tint } : rest; }));
  }
  function remove(b: Block) { setBlocks(blocks.filter((x) => keyOf(x) !== keyOf(b))); }
  const available = $derived([
    ...(['score', 'productivity', 'goal', 'tasks', 'focus', 'streak', 'next', 'finance', 'habits', 'health', 'github', 'leetcode', 'leetstats'] as const).filter((t) => store.shows(t) && !blocks.some((b) => b.type === t)).map((t) => (t === 'leetstats' ? { type: t, tint: '#f76b15' } : { type: t }) as Block),
    ...store.counters.filter((c) => !blocks.some((b) => b.counterId === c.id)).map((c) => ({ type: 'counter', counterId: c.id }) as Block),
  ]);

  function open(b: Block) {
    if (editing) return;
    if (b.type === 'next') { router.go('calendar'); return; }
    if (b.type === 'score' || b.type === 'productivity') return;
    if (b.type === 'goal') { openGoal(); return; }
    if (b.type === 'habits' || b.type === 'health' || b.type === 'finance') { router.go(b.type); return; }
    if (b.type === 'leetstats') { if (s.leetcodeUser) window.open(`https://leetcode.com/u/${s.leetcodeUser}`, '_blank', 'noopener'); return; }
    if (b.type === 'github') { if (s.github) window.open(`https://github.com/${s.github}`, '_blank', 'noopener'); return; }
    if (b.type === 'leetcode') {
      const cur = currentProblem(leetcodeTasks(store.tasks));
      const url = cur && problemUrl(cur);
      if (url) window.open(url, '_blank', 'noopener');
      return;
    }
    detail = b;
  }

  /* ---------- grid: columns follow the available width ---------- */
  const ROW = 56, GAP = 10;
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
    if (!editing || e.button !== 0 || (e.target as Element).closest('.rm, .rz, .paint')) return;
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
    const phone = isPhoneGrid(cols);
    draft = blocks.map((x) => (phone || keyOf(x) !== rz!.key ? { ...x } : freezePhone(x)));
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function resizeMove(e: PointerEvent) {
    if (!rz || !draft || !gridEl) return;
    const cell = (gridEl.clientWidth - GAP * (cols - 1)) / cols;
    const w = Math.max(1, Math.min(cols, rz.w + Math.round((e.clientX - rz.x) / (cell + GAP))));
    const h = Math.max(1, Math.min(GRID_MAX_H, rz.h + Math.round((e.clientY - rz.y) / (ROW + GAP))));
    const b = draft.find((x) => keyOf(x) === rz!.key);
    if (!b) return;
    if (isPhoneGrid(cols)) { b.pw = w; b.ph = h; return; }
    // On a narrow desktop grid an untouched width keeps its wider value.
    b.w = w === rz.w ? rz.full : w; b.h = h;
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
  <span class="hd"><span class="chip"><Icon name={icon} size={15} /></span><span class="ttl">{label}</span></span>
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
      <p class="greet-sub">{store.t('greetSub')}</p>
    </div>
  </div>


  <div class="tabs" role="tablist">
    {#each PERIODS as [key, label]}
      <button type="button" role="tab" aria-selected={period === key} onclick={() => (period = key)}>{store.t(label)}</button>
    {/each}
    <button type="button" class="edit-btn" class:on={editing} onclick={() => (editing = !editing)}>{editing ? store.t('done') : store.t('customize')}</button>
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
        <div class="cell {b.type}" class:acc={!!b.tint && b.tint !== 'none'} class:tint={b.tint && b.tint !== 'none'} role="button" tabindex="0" aria-disabled={editing}
          style:--cc={counter?.color} style:--bc={b.tint !== 'none' ? b.tint : undefined}
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
                      onclick={() => store.toggleDone(it.task, it.date)}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        {#if done}<circle class="fill" cx="12" cy="12" r="11" /><path class="tick" d="m7.4 12.4 3.2 3.2 6-6.6" />{:else}<circle class="ring" cx="12" cy="12" r="10" />{/if}
                      </svg>
                    </button>
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

          {:else if b.type === 'github'}
            <GithubCard disabled={editing} look={!b.tint || b.tint === 'none' ? 'plain' : 'tint'} />

          {:else if b.type === 'leetstats'}
            <LeetStatsCard disabled={editing} />

          {:else if b.type === 'leetcode'}
            <LeetcodeCard disabled={editing} index={i} />

          {:else if b.type === 'score'}
            <div class="sc">
              {@render head('check', store.t('dayScore'))}
              <span class="read"><Digits class="big" text={String(score)} delay={i * 90} /></span>
              <span class="meta">{store.t(scoreState)}</span>
              <div class="scale" aria-hidden="true">
                <div class="scale-bar">{#each SCALE as c}<i style:background={c}></i>{/each}<b style:left="{score}%"></b></div>
                <div class="scale-lbl"><span>0</span><span>25</span><span>50</span><span>75</span></div>
              </div>
            </div>

          {:else if b.type === 'productivity'}
            <div class="pr">
              {@render head('check', store.t('bProd'))}
              <span class="sub">{store.t('prodSub')(prodDays.length)}</span>
              <div class="chart" aria-hidden="true">
                <div class="yl"><span>100%</span><span>50%</span><span>0%</span></div>
                <div class="plot">
                  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none">
                    <defs><linearGradient id="prg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".22" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs>
                    <path class="grid" d="M0 0H{W}M0 {H / 2}H{W}M0 {H}H{W}" />
                    <path class="area" d={prodArea} fill="url(#prg)" />
                    <path class="ln" d={prodLine} />
                  </svg>
                  {#if prodPts.length}<i class="dot" style:left="{(prodPts[prodPts.length - 1][0] / W) * 100}%" style:top="{prodPts[prodPts.length - 1][1]}%"></i>{/if}
                </div>
              </div>
            </div>

          {:else if b.type === 'goal'}
            {@render head('flag', store.t('bGoal'))}
            {#if goal.title}
              <span class="goal-t">{goal.title}</span>
              <span class="sub">{goal.due ? `${store.t('until')} ${goalDue} · ${store.t('daysLeft')(goalDays ?? 0)}` : ''}</span>
              <div class="gp"><span class="gbar"><i style:width="{goal.pct}%"></i></span><b>{goal.pct}%</b></div>
            {:else}
              <span class="goal-t dim">{store.t('goalEmpty')}</span>
            {/if}

          {:else if b.type === 'finance'}
            {@render head('wallet', store.t('fSpent'))}
            <span class="read"><Digits class="big" text={fmtMoney(money.spent, store.lang)} delay={i * 90} /><em>{store.t('fCurrency')}</em></span>
            <div class="duo">
              {#if s.budget > 0}
                <span><small>{store.t('limitLbl')}</small><b>{cash(s.budget)}</b></span>
                <span class="end"><small>{budgetLeft >= 0 ? store.t('fLeft') : store.t('fOver')}</small><b>{cash(Math.abs(budgetLeft))}</b></span>
              {:else}
                <span><small>{store.t('fEarned')}</small><b>{cash(money.earned)}</b></span>
              {/if}
            </div>

          {:else if b.type === 'habits'}
            {@render head('habit', store.t('bHabits'))}
            <span class="read"><Digits class="big" text={`${habitsDone}/${habitsTotal}`} delay={i * 90} /></span>
            {@render bar(lit(ratio(habitsDone, habitsTotal)))}
            <span class="meta">{habitsTotal ? store.t('habitsOf')(habitsDone, habitsTotal) : store.t('habitNone')}</span>

          {:else if b.type === 'health'}
            {@render head('drop', store.t('hWater'))}
            <span class="read"><Digits class="big" text={String(health.water)} delay={i * 90} /><em>/{s.waterGoal}</em></span>
            {@render bar(lit(ratio(health.water, s.waterGoal)))}
            <span class="meta">{health.sleep ? `${store.t('hSleep')}: ${health.sleep} ${store.t('hHours')}` : store.t('hGlasses')}</span>

          {:else if b.type === 'focus'}
            {@render head('focus', store.t('bFocus'))}
            {@render value(tile.focus.big, tile.focus.unit, i * 90)}
            {#if period === 'today'}
              <div class="duo">
                <span><small>{store.t('setsLbl')}</small><b>{todayFocus.count}</b></span>
                <span class="end"><small>{store.t('goalLbl')}</small><b>{focusGoalHm.big} {focusGoalHm.unit}</b></span>
              </div>
            {:else}<span class="meta">{tile.focus.meta}</span>{/if}

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
              {#each [6, 9, 12, 15, 18, 21] as h}<span class="hr" style:left="{pct(h * 60)}%">{p2(h)}</span>{/each}
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
          <button type="button" class="paint" aria-label={store.t('cardColor')} title={store.t('cardColor')} onclick={() => (painting = keyOf(b))}><Icon name="palette" size={14} /></button>
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

{#if painted}
  <Sheet title={store.t('cardColor')} onclose={() => (painting = null)}>
    <div class="swatches">
      <button type="button" class="sw plain" class:on={painted.tint === 'none'} aria-label={store.t('cardPlain')} title={store.t('cardPlain')} onclick={() => paint(painted, 'none')}></button>
      {#each COLORS as c}
        <button type="button" class="sw" class:on={painted.tint?.toLowerCase() === c} style:--c={c} aria-label={c} onclick={() => paint(painted, c)}></button>
      {/each}
      <label class="sw custom" class:on={!!painted.tint && painted.tint !== 'none' && !COLORS.includes(painted.tint.toLowerCase())} title={store.t('cardCustom')}>
        <input type="color" value={painted.tint && painted.tint !== 'none' ? painted.tint : '#0090ff'} aria-label={store.t('cardCustom')} onchange={(e) => paint(painted, e.currentTarget.value)} />
      </label>
    </div>
    <button type="button" class="reset-tint" onclick={() => paint(painted)}>{store.t('cardDefault')}</button>
  </Sheet>
{/if}

{#if goalOpen}
  <Sheet title={store.t('bGoal')} onclose={() => (goalOpen = false)}>
    <form method="dialog" onsubmit={saveGoal}>
      <label class="field"><span>{store.t('goalLbl')}</span><input type="text" maxlength="120" bind:value={goalDraft.title} placeholder={store.t('goalPh')} /></label>
      <label class="field"><span>{store.t('goalDue')}</span><input type="date" bind:value={goalDraft.due} /></label>
      <label class="field"><span>{store.t('goalPct')}: {goalDraft.pct}%</span><input type="range" min="0" max="100" step="1" bind:value={goalDraft.pct} /></label>
      <div class="row-btns single"><button class="solid-btn" value="save">{store.t('save')}</button></div>
    </form>
  </Sheet>
{/if}

{#if detail}<StatSheet block={detail} onclose={() => (detail = null)} />{/if}
{#if profile}<ProfileSheet onclose={() => (profile = false)} />{/if}

<style>
  .home { width: min(100% - 32px, 1560px); }
  .home :global(.page-head) { margin-top: 0; }
  .hello { min-width: 0; }
  .greet-sub { margin: 2px 0 0; font-size: clamp(18px, 4.6vw, 22px); font-weight: 500; letter-spacing: -.015em; color: var(--muted); opacity: .75; }

  .greet { display: block; max-width: 100%; text-align: left; border-radius: 8px; }
  .greet .page-title { overflow-wrap: anywhere; font-size: clamp(24px, 6vw, 30px); font-weight: 650; letter-spacing: -.025em; }
  .greet:hover .page-title { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; text-decoration-color: var(--line); }

  /* Period tabs; the layout switch sits quietly at the end of the row */
  .tabs .edit-btn { margin: 0 0 8px auto; padding: 5px 13px; border-radius: 99px; font-size: 13px; font-weight: 500; line-height: 1.3; color: var(--ink); background: color-mix(in srgb, var(--ink) 7%, transparent); transition: background-color 150ms ease; }
  .tabs .edit-btn:hover, .tabs .edit-btn.on { background: color-mix(in srgb, var(--ink) 13%, transparent); }
  .tabs .edit-btn.on { font-weight: 600; }
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

  /* Cards: quiet surfaces — white on light themes, a step lighter than the page on dark ones. */
  .cell {
    container-type: size; position: relative;
    width: 100%; height: 100%; padding: 14px 16px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; cursor: pointer; overflow: hidden;
    background: color-mix(in srgb, var(--bg) 30%, #fff); color: var(--t);
    border-radius: 24px;
    box-shadow: 0 0 0 1px var(--line), 0 12px 26px -20px rgb(0 0 0 / 30%);
    transition: box-shadow 150ms ease, transform 150ms var(--ease);
  }
  :global(:root[data-tone='dark']) .cell { background: color-mix(in srgb, var(--bg) 90%, #fff); }
  .cell:hover { box-shadow: 0 0 0 1px var(--key-edge), 0 14px 28px -20px rgb(0 0 0 / 38%); }
  .cell:active { transform: scale(.992); }
  /* A card the person painted keeps its colour. */
  .cell.acc { --t: #fff; --td: rgb(255 255 255 / 78%); --tg: rgb(255 255 255 / 22%); color: #fff; box-shadow: inset 0 1px 0 rgb(255 255 255 / 30%), 0 16px 28px -20px rgb(0 0 0 / 50%); }
  .cell.acc.tint { background: linear-gradient(150deg, var(--bc), color-mix(in srgb, var(--bc) 62%, #000)); }

  /* No unlit LCD segments behind the figures. */
  .cell :global(.digits .ghost) { display: none; }

  /* A small round icon and a quiet caption, then the figure. */
  .hd { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; }
  .chip { display: grid; place-items: center; flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%; background: color-mix(in srgb, var(--t) 8%, transparent); color: var(--td); }
  .chip :global(svg) { width: 15px; height: 15px; }
  .ttl { font-size: 12.5px; font-weight: 500; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .sub { font-size: 11.5px; color: var(--td); opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .read { display: flex; align-items: baseline; gap: 6px; min-width: 0; margin-top: auto; }
  .read :global(.big) { font-size: clamp(26px, min(14cqi, 30cqh), 40px); font-weight: 500; letter-spacing: -.04em; line-height: .95; }
  .read :global(.big.dim) { color: var(--td); }
  .read em { font-style: normal; font-size: 14px; font-weight: 600; color: var(--td); white-space: nowrap; }
  /* The line that matters (what is left, the state, the best run) sits in a bright pill. */
  .meta { font-size: 12px; font-weight: 500; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

  /* One continuous bar; the lit part is the progress. */
  .segs { display: flex; gap: 3px; width: 100%; height: 4px; margin: 4px 0 2px; }
  .segs i { flex: 1; border-radius: 99px; background: var(--tg); transition: background-color 300ms ease; }
  .segs i.on { background: var(--t); }

  /* Day score: figure, state and a four-step scale with a marker */
  .sc { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; width: 100%; height: 100%; min-height: 0; }
  .scale { width: 100%; margin-top: 8px; }
  .scale-bar { position: relative; display: flex; gap: 4px; height: 8px; }
  .scale-bar i { flex: 1; border-radius: 99px; }
  .scale-bar b { position: absolute; top: -7px; width: 0; height: 0; margin-left: -4px; border-inline: 4px solid transparent; border-top: 5px solid var(--t); }
  .scale-lbl { display: flex; margin-top: 4px; }
  .scale-lbl span { flex: 1; font: 500 10px var(--mono); color: var(--td); }
  @container (max-height: 120px) { .scale { display: none; } }

  /* Productivity: a line over the last two weeks */
  .pr { display: flex; flex-direction: column; gap: 2px; width: 100%; height: 100%; min-height: 0; color: var(--t); }
  .chart { flex: 1; min-height: 0; display: flex; gap: 8px; margin-top: 6px; }
  .yl { display: flex; flex-direction: column; justify-content: space-between; font: 500 9.5px var(--mono); color: var(--td); }
  .plot { position: relative; flex: 1; min-width: 0; }
  .plot svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .plot .grid { stroke: var(--tg); stroke-width: 1; stroke-dasharray: 3 4; vector-effect: non-scaling-stroke; fill: none; }
  .plot .ln { fill: none; stroke: var(--t); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
  .plot .area { stroke: none; }
  .plot .dot { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: var(--t); box-shadow: 0 0 0 3px color-mix(in srgb, var(--t) 18%, transparent); }

  /* Goal */
  .goal-t { font-size: 15px; font-weight: 600; line-height: 1.25; margin-top: 4px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
  .goal-t.dim { color: var(--td); font-weight: 500; font-size: 13px; }
  .gp { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: auto; }
  .gbar { flex: 1; height: 4px; border-radius: 99px; background: var(--tg); overflow: hidden; }
  .gbar i { display: block; height: 100%; border-radius: inherit; background: var(--t); }
  .gp b { font: 600 11px var(--mono); color: var(--td); }

  /* Two small figures along the bottom: label above, value below */
  .duo { display: flex; justify-content: space-between; gap: 10px; width: 100%; margin-top: 6px; }
  .duo span { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .duo .end { align-items: flex-end; }
  .duo small { font-size: 10.5px; color: var(--td); }
  .duo b { font-size: 13px; font-weight: 600; color: var(--t); white-space: nowrap; }

  /* Up next: time and title, plus the day strip when there is room */
  .nxt { align-items: flex-end; gap: 14px; width: 100%; }
  .nt { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-bottom: 2px; }
  .nt b { font-family: var(--sans); font-size: 17px; font-weight: 700; line-height: 1.25; color: var(--t); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
  .nt small { font-size: 12px; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .line { display: none; position: relative; width: 100%; height: 30px; flex: 0 0 auto; margin-top: 6px; border-top: 1px solid var(--tg); }
  @container (min-height: 150px) and (min-width: 330px) { .line { display: block; } }
  .hr { position: absolute; top: 18px; transform: translateX(-50%); font-family: var(--mono); font-size: 10px; color: var(--td); }
  .hr:first-child { transform: none; }
  .slot { position: absolute; top: 5px; height: 10px; border-radius: 3px; background: var(--t); }
  .slot.done { opacity: .3; }
  .now { position: absolute; top: 0; width: 2px; height: 18px; margin-left: -1px; background: var(--red); }

  /* Tasks: summary, and today's checklist beside it (wide) or under it (tall) */
  .tk { flex: 1; width: 100%; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .tk-stats { min-height: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .todo { display: none; margin: 0; padding: 0 2px 0 0; list-style: none; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  @container (min-width: 520px) and (min-height: 190px) {
    .tk { grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 22px; }
    .todo { display: block; padding: 8px 0 0; }
  }
  @container (max-width: 519px) and (min-height: 250px) {
    .tk { grid-template-rows: auto minmax(0, 1fr); }
    .todo { display: block; border-top: 1px solid var(--tg); padding-top: 2px; }
  }
  .todo li { display: flex; align-items: center; gap: 12px; min-height: 40px; margin: 3px 0; padding: 0 14px; border-radius: 16px; background: color-mix(in srgb, var(--t) 11%, transparent); }
  .todo .empty { color: var(--td); font-size: 14px; }
  /* Drawn as SVG so the ring stays crisp at any pixel density, even on a gradient card. */
  .ck { flex: 0 0 auto; width: 24px; height: 24px; padding: 0; color: var(--p); transition: transform 120ms ease; }
  .ck:active { transform: scale(.88); }
  .ck svg { display: block; width: 100%; height: 100%; overflow: visible; }
  .ck .ring { fill: none; stroke: currentColor; stroke-width: 2.2; }
  .ck .fill { fill: currentColor; }
  .ck .tick { fill: none; stroke: var(--ck, var(--bg)); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  .tt { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 10px; padding: 8px 0; text-align: left; color: var(--t); }
  .tn { flex: 1; min-width: 0; font-size: 15px; font-weight: 600; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tm { flex: 0 0 auto; font-size: 12.5px; font-weight: 600; color: var(--td); font-variant-numeric: tabular-nums; }
  .tt:hover .tn { text-decoration: underline; text-decoration-color: var(--td); text-underline-offset: 3px; }
  /* The next open task stands out from the rest of the list. */
  .todo li:first-child:not(.done) { background: color-mix(in srgb, var(--t) 24%, transparent); box-shadow: inset 0 1px 0 rgb(255 255 255 / 20%); }
  .todo li:first-child:not(.done) .tn { font-weight: 700; }
  .todo li.done .tn { color: var(--td); text-decoration: line-through; }
  .editing .todo { pointer-events: none; }

  /* Narrow cards show the reading only */
  @container (max-width: 150px) { .meta { display: none; } }
  @container (max-height: 84px) { .meta, .segs, .duo { display: none; } }

  /* Edit mode */
  .edit-hint { margin: 10px 2px 0; color: var(--muted); font-family: var(--mono); font-size: 12px; letter-spacing: .02em; }
  .editing .blk { touch-action: none; user-select: none; -webkit-user-select: none; }
  .editing .cell { box-shadow: inset 0 0 0 2px var(--key-edge); }
  .editing .blk.dragging .cell, .editing .blk.resizing .cell { box-shadow: inset 0 0 0 2px var(--primary); }
  .editing .blk.dragging { opacity: .7; cursor: grabbing; z-index: 1; }
  .cell[aria-disabled='true'] { cursor: grab; }
  .rm { position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: var(--bg); color: var(--red); box-shadow: 0 0 0 1px var(--line); z-index: 2; }
  .paint { position: absolute; top: 8px; right: 40px; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: var(--bg); color: var(--ink); box-shadow: 0 0 0 1px var(--line); z-index: 2; }
  .paint:hover { background: var(--ink); color: var(--bg); }
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
  .swatches { display: flex; flex-wrap: wrap; gap: 12px; padding: 4px 0 8px; }
  .sw { position: relative; width: 38px; height: 38px; border-radius: 50%; background: var(--c); box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%); }
  .sw.on { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--ink); }
  .sw.plain { background: color-mix(in srgb, var(--soft) 78%, var(--bg)); box-shadow: inset 0 0 0 1px var(--line); }
  .sw.plain.on { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--ink); }
  .sw input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .sw.custom { background: conic-gradient(#e5484d, #ffb224, #30a46c, #0090ff, #8e4ec6, #e5484d); }
  .reset-tint { margin-top: 6px; padding: 8px 0; color: var(--muted); font-size: 14px; }
  .dot { width: 9px; height: 9px; border-radius: 2px; background: var(--c); }
</style>
