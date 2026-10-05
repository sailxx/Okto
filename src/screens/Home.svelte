<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import StatSheet from '../components/StatSheet.svelte';
  import { store } from '../lib/store.svelte';
  import { router } from '../lib/router.svelte';
  import { addDays } from '../lib/date';
  import { fmtLongDay, locale, relDay } from '../lib/i18n';
  import { dayFocus, dayTaskStats, nextUp, streak } from '../lib/stats';
  import type { Block, BlockType } from '../lib/model';

  let editing = $state(false);
  let adding = $state(false);
  let detail = $state<Block | null>(null);

  const hour = $derived(store.now.getHours());
  const greeting = $derived(store.t(hour < 5 ? 'greetNight' : hour < 12 ? 'greetMorning' : hour < 18 ? 'greetDay' : hour < 23 ? 'greetEvening' : 'greetNight'));
  const blocks = $derived(store.data.settings.dashboard.filter((b) => b.type !== 'counter' || store.counters.some((c) => c.id === b.counterId)));
  const fmt = $derived(new Intl.NumberFormat(locale(store.lang)));

  const tasks = $derived(dayTaskStats(store.tasks, store.today));
  const focus = $derived(dayFocus(store.sessions, store.today));
  const days = $derived(streak(store.tasks, store.sessions, store.today));
  const next = $derived(nextUp(store.tasks, store.now));
  const hm = (m: number) => store.t('hm')(Math.floor(m / 60), m % 60);

  const keyOf = (b: Block) => (b.type === 'counter' ? `counter:${b.counterId}` : b.type);
  const wide = (b: Block) => b.type === 'tasks' || b.type === 'next' || b.type === 'counter';

  // Column of each block in a sequential grid flow, so only inner edges get a divider.
  const mq = matchMedia('(min-width: 900px)');
  let cols = $state(mq.matches ? 4 : 2);
  $effect(() => { const on = () => { cols = mq.matches ? 4 : 2; }; mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); });
  const firstInRow = $derived.by(() => {
    const out = new Set<string>();
    let c = 0;
    for (const b of blocks) {
      const span = wide(b) ? 2 : 1;
      if (c + span > cols) c = 0;
      if (c === 0) out.add(keyOf(b));
      c = (c + span) % cols;
    }
    return out;
  });
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

  /* ---------- drag to reorder (edit mode) ---------- */
  let dragKey = $state<string | null>(null);
  function gripDown(e: PointerEvent, b: Block) {
    e.preventDefault();
    dragKey = keyOf(b);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function gripMove(e: PointerEvent) {
    if (!dragKey) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-key]');
    const over = el?.dataset.key;
    if (!over || over === dragKey) return;
    const list = [...blocks];
    const from = list.findIndex((x) => keyOf(x) === dragKey), to = list.findIndex((x) => keyOf(x) === over);
    if (from < 0 || to < 0) return;
    list.splice(to, 0, list.splice(from, 1)[0]);
    setBlocks(list);
  }
  function gripUp() { dragKey = null; }
</script>

<div class="page wide home">
  <div class="page-head">
    <div>
      <h1 class="page-title">{greeting}</h1>
      <p class="page-sub">{fmtLongDay(store.lang, store.today)}</p>
    </div>
    <button type="button" class="text-btn" class:accent={editing} onclick={() => (editing = !editing)}>{editing ? store.t('done') : store.t('edit')}</button>
  </div>

  <div class="blocks" class:editing>
    {#each blocks as b, i (keyOf(b))}
      {@const counter = b.type === 'counter' ? store.data.counters[b.counterId!] : null}
      <div class="blk" class:wide={wide(b)} class:first={firstInRow.has(keyOf(b))} class:dragging={dragKey === keyOf(b)} data-key={keyOf(b)} style:--d="{(i % 3) * -0.12}s">
        <button type="button" class="blk-body" onclick={() => open(b)} disabled={editing}>
          <span class="label">{counter ? counter.name || store.t('counter') : store.t(LABEL[b.type as Exclude<BlockType, 'counter'>])}</span>
          {#if b.type === 'tasks'}
            <span class="num">{tasks.done}<small> / {tasks.total}</small></span>
            <span class="bar"><i style:width="{tasks.total ? (tasks.done / tasks.total) * 100 : 0}%"></i></span>
          {:else if b.type === 'focus'}
            <span class="num">{#if focus.minutes >= 60}{Math.floor(focus.minutes / 60)}<small>{store.lang === 'ru' ? ' ч ' : ' h '}</small>{/if}{focus.minutes % 60}<small>{store.lang === 'ru' ? ' м' : ' m'}</small></span>
            <span class="sub">{store.t('focusCount')(focus.count)}</span>
          {:else if b.type === 'streak'}
            <span class="num">{days}</span>
            <span class="sub">{store.t('streakDays')(days)}</span>
          {:else if b.type === 'next'}
            {#if next}
              <span class="next">
                <b>{next.task.start}</b>
                <span class="nt">{next.task.title}</span>
                <span class="nl" style:--c={store.colorOf(next.task)}>{next.date === store.today ? store.listOf(next.task)?.name : relDay(store.lang, next.date, store.today, addDays(store.today, 1), addDays(store.today, -1))}</span>
              </span>
            {:else}
              <span class="sub empty-next">{store.t('nothingNext')}</span>
            {/if}
          {:else if counter}
            <span class="num" style:--c={counter.color}>{fmt.format(counter.count)}<small> / {fmt.format(counter.target)}</small></span>
            <span class="bar" style:--c={counter.color}><i style:width="{Math.min(100, (counter.count / counter.target) * 100)}%"></i></span>
          {/if}
        </button>
        {#if editing}
          <button type="button" class="rm" aria-label={store.t('remove')} onclick={() => remove(b)}><Icon name="minus" size={16} /></button>
          <span class="grip" role="button" tabindex="-1" aria-hidden="true" onpointerdown={(e) => gripDown(e, b)} onpointermove={gripMove} onpointerup={gripUp} onpointercancel={gripUp}><Icon name="grip" size={18} /></span>
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

<style>
  .blocks { display: grid; grid-template-columns: repeat(2, 1fr); margin-top: 22px; border-top: 1px solid var(--line); }
  @media (min-width: 900px) { .blocks { grid-template-columns: repeat(4, 1fr); } }
  .blk { position: relative; grid-column: span 1; min-width: 0; border-bottom: 1px solid var(--line); border-left: 1px solid var(--line); }
  .blk.first { border-left: 0; }
  .blk:not(.first) .blk-body { padding-left: 18px; }
  .blk.wide { grid-column: span 2; }
  .blk-body { display: flex; flex-direction: column; align-items: stretch; gap: 6px; width: 100%; padding: 20px 16px 20px 2px; text-align: left; border-radius: 0; transition: background-color 150ms ease; }
  @media (min-width: 900px) { .blk-body { padding: 22px 18px; } }
  .blk-body:not(:disabled):hover { background: color-mix(in srgb, var(--soft) 55%, transparent); }
  .blk-body:disabled { cursor: default; opacity: 1; }
  .label { margin: 0; }
  .num { font-family: 'Inter Display', 'Inter', sans-serif; font-size: clamp(40px, 11vw, 56px); font-weight: 700; letter-spacing: -.045em; line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .num small { font-size: .5em; color: var(--muted); letter-spacing: -.02em; }
  .sub { color: var(--muted); font-size: 15px; font-weight: 500; }
  .bar { display: block; height: 4px; margin-top: 10px; background: var(--line); border-radius: 99px; overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--c, var(--accent)); border-radius: inherit; transition: width 300ms ease; }
  .next { display: grid; grid-template-columns: auto 1fr; align-items: baseline; column-gap: 14px; row-gap: 2px; }
  .next b { font-family: 'Inter Display', 'Inter', sans-serif; font-size: 34px; font-weight: 700; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .nt { font-size: 18px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nl { grid-column: 2; display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 14px; font-weight: 500; }
  .nl::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
  .empty-next { padding: 8px 0 4px; }

  /* Edit mode: iOS-like wiggle */
  .editing .blk { animation: wiggle 300ms ease-in-out infinite alternate; animation-delay: var(--d); }
  .editing .blk.dragging { animation: none; opacity: .6; }
  @keyframes wiggle { from { transform: rotate(-0.5deg); } to { transform: rotate(0.5deg); } }
  .rm { position: absolute; top: 10px; right: 6px; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: var(--red); color: #fff; }
  .rm :global(svg) { stroke-width: 2.6; }
  .grip { position: absolute; right: 6px; bottom: 12px; width: 32px; height: 32px; display: grid; place-items: center; color: var(--muted); cursor: grab; touch-action: none; }
  .add-block { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 52px; margin-top: 18px; border: 2px dashed var(--line); border-radius: 99px; color: var(--muted); font-weight: 600; }
  .add-block:hover { color: var(--ink); border-color: var(--muted); }
  .avail { display: flex; flex-direction: column; }
  .avail-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; border-bottom: 1px solid var(--line); font-size: 16px; font-weight: 500; text-align: left; }
  .avail-row span:nth-child(2) { flex: 1; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
  @media (prefers-reduced-motion: reduce) { .editing .blk { animation: none; } }
</style>
