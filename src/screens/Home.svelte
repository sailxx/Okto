<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import StatSheet from '../components/StatSheet.svelte';
  import Digits from '../components/Digits.svelte';
  import { store } from '../lib/store.svelte';
  import { router } from '../lib/router.svelte';
  import { addDays } from '../lib/date';
  import { fmtLongDay, relDay } from '../lib/i18n';
  import { dayFocus, dayTaskStats, dayTasks, nextUp, streak } from '../lib/stats';
  import type { Block, BlockType } from '../lib/model';

  let editing = $state(false);
  let adding = $state(false);
  let detail = $state<Block | null>(null);

  const hour = $derived(store.now.getHours());
  const greeting = $derived(store.t(hour < 5 ? 'greetNight' : hour < 12 ? 'greetMorning' : hour < 18 ? 'greetDay' : hour < 23 ? 'greetEvening' : 'greetNight'));
  const blocks = $derived(store.data.settings.dashboard.filter((b) => b.type !== 'counter' || store.counters.some((c) => c.id === b.counterId)));

  const tasks = $derived(dayTaskStats(store.tasks, store.today));
  const focus = $derived(dayFocus(store.sessions, store.today));
  const days = $derived(streak(store.tasks, store.sessions, store.today));
  const next = $derived(nextUp(store.tasks, store.now));
  // Day capacity: timed work planned today against an 8-hour day.
  const DAY = 8 * 60;
  const planned = $derived(dayTasks(store.tasks, store.today).reduce((s, i) => s + (i.task.start ? i.task.duration : 0), 0));

  const p2 = (n: number) => String(n).padStart(2, '0');
  const hmm = (m: number) => `${Math.floor(m / 60)}:${p2(m % 60)}`;
  const SEGS = 20;
  const lit = (ratio: number) => Math.round(Math.max(0, Math.min(1, ratio)) * SEGS);

  const keyOf = (b: Block) => (b.type === 'counter' ? `counter:${b.counterId}` : b.type);
  const wide = (b: Block) => b.type === 'tasks' || b.type === 'next' || b.type === 'counter';
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

{#snippet bar(on: number, color = 'var(--ochre)')}
  <span class="segs" style:--c={color} aria-hidden="true">
    {#each Array(SEGS) as _, s}<i class:on={s < on}></i>{/each}
  </span>
{/snippet}

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
      <div class="blk" class:wide={wide(b)} class:dragging={dragKey === keyOf(b)} data-key={keyOf(b)} style:--d="{(i % 3) * -0.12}s">
        <button type="button" class="well cell" onclick={() => open(b)} disabled={editing}>
          <span class="legend">
            <span class="label">{counter ? counter.name || store.t('counter') : store.t(LABEL[b.type as Exclude<BlockType, 'counter'>])}</span>
            {#if b.type === 'tasks'}<span class="label">{store.t('plan')} {hmm(planned)}/{hmm(DAY)}</span>
            {:else if b.type === 'focus'}<span class="label">{store.t('focusCount')(focus.count)}</span>
            {:else if b.type === 'streak'}<span class="label">{store.t('streakDays')(days)}</span>
            {:else if b.type === 'next' && next}<span class="label">{next.date === store.today ? store.t('today') : relDay(store.lang, next.date, store.today, addDays(store.today, 1), addDays(store.today, -1))}</span>
            {:else if counter}<span class="label">{store.t('goalLine')(String(counter.target))}</span>{/if}
          </span>

          {#if b.type === 'tasks'}
            <span class="read"><Digits class="big" text={`${p2(tasks.done)}/${p2(tasks.total)}`} delay={i * 90} /></span>
            {@render bar(lit(tasks.total ? tasks.done / tasks.total : 0))}
            <span class="cap" aria-hidden="true"><i style:width="{Math.min(100, (planned / DAY) * 100)}%" class:over={planned > DAY}></i></span>
          {:else if b.type === 'focus'}
            <span class="read"><Digits class="big" text={hmm(focus.minutes)} delay={i * 90} /></span>
          {:else if b.type === 'streak'}
            <span class="read"><Digits class="big" text={p2(days)} delay={i * 90} /></span>
          {:else if b.type === 'next'}
            {#if next}
              <span class="read next"><Digits class="big" text={next.task.start ?? '--:--'} delay={i * 90} />
                <span class="nt"><b>{next.task.title}</b><small style:--c={store.colorOf(next.task)}>{store.listOf(next.task)?.name}</small></span>
              </span>
            {:else}
              <span class="read"><Digits class="big dim" text="--:--" delay={i * 90} /><span class="nt"><small>{store.t('nothingNext')}</small></span></span>
            {/if}
          {:else if counter}
            <span class="read"><Digits class="big" text={String(counter.count).padStart(3, '0')} delay={i * 90} /><em>/{counter.target}</em></span>
            {@render bar(lit(counter.count / counter.target), counter.color)}
          {/if}
        </button>
        {#if editing}
          <button type="button" class="rm key" aria-label={store.t('remove')} onclick={() => remove(b)}><Icon name="minus" size={16} /></button>
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
            <span class="dot" style:--c={c ? c.color : 'var(--ochre)'}></span>
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
  .blocks { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 20px; }
  @media (min-width: 900px) { .blocks { grid-template-columns: repeat(4, 1fr); gap: 14px; } }
  .blk { position: relative; min-width: 0; }
  .blk.wide { grid-column: span 2; }

  .cell {
    width: 100%; min-height: 136px; padding: 14px 14px 14px;
    display: flex; flex-direction: column; gap: 10px; text-align: left;
    transition: filter 150ms ease, transform 90ms var(--ease);
  }
  .cell:not(:disabled):hover { filter: brightness(1.04); }
  .cell:not(:disabled):active { transform: scale(.992); }
  .cell:disabled { cursor: default; }
  .legend { display: flex; justify-content: space-between; gap: 10px; }
  .legend .label { margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .legend .label + .label { text-align: right; }

  .read { display: flex; align-items: baseline; gap: 8px; margin-top: auto; min-width: 0; }
  .read :global(.big) { font-size: clamp(38px, 11vw, 60px); font-weight: 700; letter-spacing: -.04em; line-height: .95; }
  .read :global(.big.dim) { color: var(--well-dim); }
  .read em { font-style: normal; font-family: var(--mono); font-size: 13px; color: var(--well-dim); }
  .wide .read :global(.big) { font-size: clamp(44px, 13vw, 72px); }
  .next { align-items: flex-end; gap: 16px; }
  .nt { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-bottom: 4px; }
  .nt b { font-family: var(--sans); font-size: 17px; font-weight: 600; line-height: 1.25; color: var(--well-ink); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
  .nt small { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 12px; color: var(--well-dim); }
  .nt small[style]::before { content: ''; width: 7px; height: 7px; border-radius: 2px; background: var(--c); }

  .segs { display: grid; grid-template-columns: repeat(20, 1fr); gap: 3px; height: 10px; }
  .segs i { border-radius: 1.5px; background: var(--well-ghost); transition: background-color 300ms ease; }
  .segs i.on { background: var(--c); }
  .cap { display: block; height: 2px; margin-top: -4px; background: var(--well-ghost); border-radius: 2px; overflow: hidden; }
  .cap i { display: block; height: 100%; background: var(--blue); }
  .cap i.over { background: var(--red); }

  /* Power-on: lit segments during self-test */
  :global([data-boot='test']) .segs i { background: var(--well-dim); }

  /* Edit mode */
  .editing .blk { animation: wiggle 260ms ease-in-out infinite alternate; animation-delay: var(--d); }
  .editing .blk.dragging { animation: none; opacity: .55; }
  @keyframes wiggle { from { transform: rotate(-0.4deg); } to { transform: rotate(0.4deg); } }
  .rm { position: absolute; top: -8px; right: -6px; width: 30px; height: 30px; --k-ink: var(--red); }
  .grip { position: absolute; right: 8px; bottom: 8px; width: 32px; height: 32px; display: grid; place-items: center; color: var(--well-dim); cursor: grab; touch-action: none; }
  .add-block { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; margin-top: 14px; border-radius: var(--r-key); box-shadow: inset 0 0 0 1px var(--line); color: var(--muted); font-family: var(--mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
  .add-block:hover { color: var(--ink); background: var(--soft); }
  .avail { display: flex; flex-direction: column; }
  .avail-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; border-bottom: 1px solid var(--line); font-size: 16px; text-align: left; }
  .avail-row span:nth-child(2) { flex: 1; }
  .dot { width: 9px; height: 9px; border-radius: 2px; background: var(--c); }
  @media (prefers-reduced-motion: reduce) { .editing .blk { animation: none; } }
</style>
