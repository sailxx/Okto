<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import StatSheet from '../components/StatSheet.svelte';
  import ProfileSheet from '../components/ProfileSheet.svelte';
  import Digits from '../components/Digits.svelte';
  import Scrub from '../components/Scrub.svelte';
  import { store } from '../lib/store.svelte';
  import { router } from '../lib/router.svelte';
  import { addDays, minutesNow, startOfWeek, toMin } from '../lib/date';
  import { fmtLongDay, fmtShortDay, relDay } from '../lib/i18n';
  import { activeDays, dayFocus, dayTaskStats, dayTasks, doneOnDay, lastDays, nextUp, streak } from '../lib/stats';
  import { isDoneOn } from '../lib/recurrence';
  import { blockSize, GRID_MAX_H, type Block, type BlockType } from '../lib/model';

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
  const blocks = $derived(s.dashboard.filter((b) => b.type !== 'counter' || store.counters.some((c) => c.id === b.counterId)));
  const days14 = $derived(lastDays(14, store.today));
  const days7 = $derived(lastDays(7, store.today));
  const tasks = $derived(dayTaskStats(store.tasks, store.today));
  const doneSeries = $derived(days14.map((d) => doneOnDay(store.tasks, d)));
  const focusSeries = $derived(days7.map((d) => dayFocus(store.sessions, d)));
  const days = $derived(streak(store.tasks, store.sessions, store.today));
  const active = $derived(activeDays(store.tasks, store.sessions));
  const heat = $derived.by(() => {
    const first = addDays(startOfWeek(store.today, store.weekStart), -28);
    return Array.from({ length: 35 }, (_, i) => addDays(first, i));
  });
  const next = $derived(nextUp(store.tasks, store.now));
  const todayTimed = $derived(dayTasks(store.tasks, store.today).filter((i) => i.task.start).sort((a, b) => toMin(a.task.start!) - toMin(b.task.start!)));
  const DAY = 8 * 60;
  const planned = $derived(todayTimed.reduce((sum, i) => sum + i.task.duration, 0));

  /* ---------- per-widget scrub selection ---------- */
  let selTasks = $state<number | null>(null);
  let selFocus = $state<number | null>(null);
  let selHeat = $state<number | null>(null);
  let selLine = $state<number | null>(null);
  let selCounter = $state<Record<string, number | null>>({});

  const p2 = (n: number) => String(n).padStart(2, '0');
  const hmm = (m: number) => `${Math.floor(m / 60)}:${p2(m % 60)}`;
  const SEGS = 20;
  const lit = (ratio: number) => Math.round(Math.max(0, Math.min(1, ratio)) * SEGS);
  const dayLabel = (k: string) => relDay(store.lang, k, store.today, addDays(store.today, 1), addDays(store.today, -1));

  const keyOf = (b: Block) => (b.type === 'counter' ? `counter:${b.counterId}` : b.type);
  const LABEL: Record<Exclude<BlockType, 'counter'>, 'bTasks' | 'bFocus' | 'bStreak' | 'bNext'> = { tasks: 'bTasks', focus: 'bFocus', streak: 'bStreak', next: 'bNext' };

  function setBlocks(list: Block[]) { store.updateSettings({ dashboard: list.map((b) => ({ ...b })) }); }
  function remove(b: Block) { setBlocks(blocks.filter((x) => keyOf(x) !== keyOf(b))); }
  const available = $derived([
    ...(['tasks', 'focus', 'streak', 'next'] as const).filter((t) => !blocks.some((b) => b.type === t)).map((t) => ({ type: t }) as Block),
    ...store.counters.filter((c) => !blocks.some((b) => b.counterId === c.id)).map((c) => ({ type: 'counter', counterId: c.id }) as Block),
  ]);

  function open(b: Block) {
    if (editing) return;
    if (b.type === 'next') { router.go('calendar'); return; }
    detail = b;
  }

  /* ---------- grid: columns follow the available width ---------- */
  const ROW = 96, GAP = 10;
  let gridEl = $state<HTMLDivElement>();
  let cols = $state(2);
  $effect(() => {
    if (!gridEl) return;
    const ro = new ResizeObserver(() => { const w = gridEl!.clientWidth; cols = w >= 1040 ? 6 : w >= 600 ? 4 : 2; });
    ro.observe(gridEl);
    return () => ro.disconnect();
  });
  const span = (b: Block) => { const { w, h } = blockSize(b); return { w: Math.min(w, cols), h }; };

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
    const { w, h } = blockSize(b);
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

  /* ---------- day timeline (next widget): 06:00–24:00 ---------- */
  const T0 = 6 * 60, T1 = 24 * 60;
  const pct = (m: number) => Math.max(0, Math.min(100, ((m - T0) / (T1 - T0)) * 100));
</script>

{#snippet bar(on: number)}
  <span class="segs" aria-hidden="true">{#each Array(SEGS) as _, s}<i class:on={s < on}></i>{/each}</span>
{/snippet}

<div class="page home">
  <div class="page-head">
    <div class="hello">
      <button type="button" class="greet" onclick={() => (profile = true)} title={store.t('editGreeting')}>
        <h1 class="page-title">{greeting}</h1>
      </button>
      <p class="page-sub">{fmtLongDay(store.lang, store.today)}</p>
    </div>
    <button type="button" class="text-btn" class:accent={editing} onclick={() => (editing = !editing)}>{editing ? store.t('done') : store.t('edit')}</button>
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
        <div class="cell" role="button" tabindex="0" aria-disabled={editing}
          onclick={() => open(b)} onkeydown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(b); }}>

          {#if b.type === 'tasks'}
            {@const d = selTasks === null ? null : days14[selTasks]}
            <span class="legend">
              <span class="label">{store.t('bTasks')} · {d ? dayLabel(d) : store.t('todayLine')}</span>
              <span class="label">{store.t('plan')} {hmm(planned)}/{hmm(DAY)}</span>
            </span>
            <span class="read">
              {#if d}<Digits class="big" text={p2(doneSeries[selTasks!])} /><em>{store.t('tasksDone')}</em>
              {:else}<Digits class="big" text={`${p2(tasks.done)}/${p2(tasks.total)}`} delay={i * 90} />{/if}
            </span>
            {@render bar(lit(tasks.total ? tasks.done / tasks.total : 0))}
            <div class="chart"><Scrub days={days14} values={doneSeries} bind:sel={selTasks} label="{store.t('tasksDone')}, {store.t('last14')}" /></div>

          {:else if b.type === 'focus'}
            {@const d = selFocus === null ? null : days7[selFocus]}
            {@const f = d ? focusSeries[selFocus!] : focusSeries[6]}
            <span class="legend">
              <span class="label">{store.t('bFocus')} · {d ? dayLabel(d) : store.t('todayLine')}</span>
              <span class="label">{store.t('focusCount')(f.count)}</span>
            </span>
            <span class="read"><Digits class="big" text={hmm(f.minutes)} delay={i * 90} /></span>
            <div class="chart"><Scrub days={days7} values={focusSeries.map((x) => x.minutes)} bind:sel={selFocus} label="{store.t('focusMin')}, {store.t('last7d')}" /></div>

          {:else if b.type === 'streak'}
            {@const d = selHeat === null ? null : heat[selHeat]}
            <span class="legend">
              <span class="label">{store.t('bStreak')}</span>
              <span class="label">{d ? fmtShortDay(store.lang, d) : store.t('streakDays')(days)}</span>
            </span>
            <span class="read"><Digits class="big" text={d ? (active.has(d) ? '01' : '00') : p2(days)} delay={i * 90} /></span>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
            <div class="heat" role="group" tabindex="0" aria-label="{store.t('bStreak')}, {store.t('last5w')}"
              onpointerleave={() => (selHeat = null)} onclick={(e) => e.stopPropagation()}
              onkeydown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); selHeat = Math.max(0, Math.min(34, (selHeat ?? 34) + (e.key === 'ArrowLeft' ? -1 : 1))); } }}>
              {#each heat as k, h (k)}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <i class:on={active.has(k)} class:today={k === store.today} class:sel={selHeat === h} class:future={k > store.today}
                  onpointerenter={() => (selHeat = h)}></i>
              {/each}
            </div>

          {:else if b.type === 'next'}
            {@const picked = selLine === null ? null : todayTimed[selLine]}
            {@const shown = picked ?? next}
            <span class="legend">
              <span class="label">{picked ? store.t('timeline') : store.t('bNext')}</span>
              {#if shown}<span class="label">{shown.date === store.today ? store.t('today') : dayLabel(shown.date)}</span>{/if}
            </span>
            {#if shown}
              <span class="read next"><Digits class="big" text={shown.task.start ?? '--:--'} delay={i * 90} />
                <span class="nt"><b>{shown.task.title}</b><small style:--c={store.colorOf(shown.task)}>{store.listOf(shown.task)?.name}</small></span>
              </span>
            {:else}
              <span class="read"><Digits class="big dim" text="--:--" delay={i * 90} /><span class="nt"><small>{store.t('nothingNext')}</small></span></span>
            {/if}
            <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
            <div class="line" role="group" tabindex="0" aria-label={store.t('timeline')} onclick={(e) => e.stopPropagation()} onpointerleave={() => (selLine = null)}
              onkeydown={(e) => { if (todayTimed.length && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); e.stopPropagation(); selLine = Math.max(0, Math.min(todayTimed.length - 1, (selLine ?? -1) + (e.key === 'ArrowLeft' ? -1 : 1))); } }}>
              {#each [6, 9, 12, 15, 18, 21] as h}<span class="tick" style:left="{pct(h * 60)}%">{p2(h)}</span>{/each}
              {#each todayTimed as it, k (it.task.id)}
                {@const a = pct(toMin(it.task.start!))}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <i class="slot" class:done={isDoneOn(it.task, it.date)} class:sel={selLine === k}
                  style:left="{a}%" style:width="max(4px, {pct(toMin(it.task.start!) + it.task.duration) - a}%)"
                  onpointerenter={() => (selLine = k)}></i>
              {/each}
              <b class="now" style:left="{pct(minutesNow(store.now))}%"></b>
            </div>

          {:else if counter}
            {@const sel = selCounter[counter.id] ?? null}
            {@const series = days7.map((d) => (d === store.today ? counter.count : counter.daily[d] ?? 0))}
            <span class="legend">
              <span class="label">{counter.name || store.t('counter')} · {sel === null ? store.t('todayLine') : dayLabel(days7[sel])}</span>
              <span class="label">{store.t('goalLine')(String(counter.target))}</span>
            </span>
            <span class="read"><Digits class="big" text={String(sel === null ? counter.count : series[sel]).padStart(3, '0')} delay={i * 90} /><em>/{counter.target}</em></span>
            {@render bar(lit(counter.count / counter.target))}
            <div class="chart"><Scrub days={days7} values={series} bind:sel={() => selCounter[counter.id] ?? null, (v) => (selCounter[counter.id] = v)} label="{counter.name || store.t('counter')}, {store.t('last7d')}" /></div>
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
    <button type="button" class="add-block" onclick={() => (adding = true)}><Icon name="plus" size={18} />{store.t('addBlock')}</button>
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
  .greet .page-title { overflow-wrap: anywhere; }
  .greet:hover .page-title { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; text-decoration-color: var(--line); }

  /* Widgets: a grid the person arranges — swap by dragging, resize by the corner. */
  .blocks {
    display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); grid-auto-rows: var(--row);
    grid-auto-flow: row dense; gap: var(--gap); margin-top: 18px;
  }
  .blk { position: relative; min-width: 0; min-height: 0; }

  .cell {
    container-type: size;
    width: 100%; height: 100%; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 8px; text-align: left; cursor: pointer; overflow: hidden;
    background: var(--well); color: var(--well-ink);
    border-radius: 12px; box-shadow: inset 0 0 0 1px var(--well-edge);
    transition: box-shadow 150ms ease, background-color 150ms ease;
  }
  .cell:hover { box-shadow: inset 0 0 0 1px var(--well-dim); }
  .cell[aria-disabled='true'] { cursor: grab; }
  .legend { display: flex; justify-content: space-between; gap: 10px; flex: 0 0 auto; }
  .legend .label { margin: 0; font-size: 10px; letter-spacing: .14em; color: var(--well-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .legend .label + .label { text-align: right; flex: 0 0 auto; opacity: .8; }

  .read { display: flex; align-items: baseline; gap: 8px; min-width: 0; flex: 0 0 auto; }
  .read :global(.big) { font-size: clamp(26px, min(13cqi, 30cqh), 92px); font-weight: 700; letter-spacing: -.04em; line-height: .95; }
  .read :global(.big.dim) { color: var(--well-dim); }
  .read em { font-style: normal; font-family: var(--mono); font-size: 12px; color: var(--well-dim); }
  .next { align-items: flex-end; gap: 14px; }
  .nt { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-bottom: 3px; }
  .nt b { font-family: var(--sans); font-size: clamp(14px, 3.6cqi, 19px); font-weight: 600; line-height: 1.25; color: var(--well-ink); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
  .nt small { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 11px; color: var(--well-dim); }
  .nt small[style]::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--c); }

  .segs { display: grid; grid-template-columns: repeat(20, 1fr); gap: 2px; height: 4px; flex: 0 0 auto; }
  .segs i { border-radius: 1px; background: var(--well-ghost); transition: background-color 300ms ease; }
  .segs i.on { background: var(--well-ink); }
  :global([data-boot='test']) .segs i { background: var(--well-dim); }

  .chart { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; }

  /* Small blocks show just the reading. */
  @container (max-height: 170px) { .chart, .heat, .line, .segs { display: none; } }
  @container (max-width: 200px) { .legend .label + .label { display: none; } .nt { display: none; } }

  /* Streak: five weeks of activity */
  .heat { display: grid; grid-template-columns: repeat(7, minmax(0, min(22px, 9cqh))); gap: 3px; margin-top: auto; outline-offset: 4px; border-radius: 4px; align-self: flex-start; }
  .heat i { aspect-ratio: 1; border-radius: 3px; background: var(--well-ghost); box-shadow: inset 0 0 0 1px var(--well-ghost); }
  .heat i.on { background: var(--well-ink); }
  .heat i.future { opacity: .35; }
  .heat i.today { box-shadow: inset 0 0 0 1px var(--well-ink), 0 0 0 2px var(--well), 0 0 0 3px var(--well-dim); }
  .heat i.sel { outline: 2px solid var(--well-ink); outline-offset: 1px; }

  /* Next: today's plan as a strip, 06–24 */
  .line { position: relative; height: 36px; flex: 0 0 auto; margin-top: auto; border-top: 1px solid var(--well-ghost); outline-offset: 4px; border-radius: 2px; }
  .tick { position: absolute; top: 24px; transform: translateX(-50%); font-family: var(--mono); font-size: 10px; color: var(--well-dim); }
  .tick:first-child { transform: none; }
  .slot { position: absolute; top: 6px; height: 14px; border-radius: 2px; background: var(--well-ink); }
  .slot.done { background: color-mix(in srgb, var(--well-ink) 30%, transparent); }
  .slot.sel { outline: 2px solid var(--well-ink); outline-offset: 2px; }
  .now { position: absolute; top: 0; width: 2px; height: 22px; margin-left: -1px; background: var(--red); }

  /* Edit mode */
  .edit-hint { margin: 10px 2px 0; color: var(--muted); font-family: var(--mono); font-size: 12px; letter-spacing: .02em; }
  .editing .blk { touch-action: none; user-select: none; -webkit-user-select: none; }
  .editing .cell { box-shadow: inset 0 0 0 1px var(--well-dim); }
  .editing .blk.dragging .cell, .editing .blk.resizing .cell { box-shadow: inset 0 0 0 2px var(--primary); }
  .editing .blk.dragging { opacity: .7; cursor: grabbing; z-index: 1; }
  .rm { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: var(--bg); color: var(--red); box-shadow: 0 0 0 1px var(--line); z-index: 2; }
  .rm:hover { background: var(--red); color: #fff; }
  .grip { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); color: var(--well-dim); pointer-events: none; opacity: .7; }
  .grip :global(svg) { transform: rotate(90deg); }
  .rz { position: absolute; right: 0; bottom: 0; width: 26px; height: 26px; cursor: nwse-resize; touch-action: none; z-index: 2; }
  .rz::after { content: ''; position: absolute; right: 6px; bottom: 6px; width: 10px; height: 10px; border-right: 2px solid var(--well-dim); border-bottom: 2px solid var(--well-dim); border-bottom-right-radius: 3px; }
  .rz:hover::after, .resizing .rz::after { border-color: var(--primary); }
  .dims { position: absolute; right: 30px; bottom: 8px; font-family: var(--mono); font-size: 10px; color: var(--well-dim); pointer-events: none; }
  .add-block { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; margin-top: 14px; border-radius: var(--r-key); box-shadow: inset 0 0 0 1px var(--line); color: var(--muted); font-family: var(--mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
  .add-block:hover { color: var(--ink); background: var(--soft); }
  .avail { display: flex; flex-direction: column; }
  .avail-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; border-bottom: 1px solid var(--line); font-size: 16px; text-align: left; }
  .avail-row span:nth-child(2) { flex: 1; }
  .dot { width: 9px; height: 9px; border-radius: 2px; background: var(--c); }
</style>
