<script lang="ts">
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { addDays } from '../lib/date';
  import { relDay } from '../lib/i18n';
  import { isDoneOn } from '../lib/recurrence';
  import { PRIORITY_COLORS, type Task } from '../lib/model';

  let { task, date, showDate = false }: { task: Task; date: string | null; showDate?: boolean } = $props();

  const done = $derived(isDoneOn(task, date ?? ''));
  const list = $derived(store.listOf(task));
  const subDone = $derived(task.subtasks.filter((s) => s.done).length);
  const overdue = $derived(!task.repeat && !task.done && task.date !== null && task.date < store.today);
  const dateLabel = $derived(date ? relDay(store.lang, date, store.today, addDays(store.today, 1), addDays(store.today, -1)) : '');

  /* Swipe left (touch) reveals «Tomorrow» / «Delete». */
  let dx = $state(0);
  let open = $state(false);
  let startX = 0, startY = 0, swiping = false;
  let tracking = $state(false);
  const ACTIONS = 148;

  function down(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    startX = e.clientX; startY = e.clientY; tracking = true; swiping = false;
  }
  function move(e: PointerEvent) {
    if (!tracking) return;
    const mx = e.clientX - startX, my = e.clientY - startY;
    if (!swiping) {
      if (Math.abs(my) > 10) { tracking = false; return; }
      if (Math.abs(mx) > 10) swiping = true; else return;
    }
    dx = Math.max(-ACTIONS - 20, Math.min(0, (open ? -ACTIONS : 0) + mx));
  }
  function up() {
    if (!tracking) return;
    tracking = false;
    if (swiping) { open = dx < -ACTIONS / 2; dx = open ? -ACTIONS : 0; }
  }
  function openEditor() {
    if (swiping) { swiping = false; return; }
    if (open) { open = false; dx = 0; return; }
    store.openTask(task, date);
  }
  function tomorrow() {
    open = false; dx = 0;
    const target = addDays(store.today, 1);
    if (task.repeat && date) store.editTask(task, date, { date: target }, 'one');
    else store.saveTask({ ...task, date: target });
  }
  function remove() {
    open = false; dx = 0;
    store.deleteTask(task, date, task.repeat ? 'one' : 'all');
  }
</script>

<div class="row-wrap">
  <div class="swipe-actions" class:show={dx < 0} aria-hidden={!open}>
    <button type="button" class="sa later" onclick={tomorrow}>{store.t('moveTomorrow')}</button>
    <button type="button" class="sa del" onclick={remove}><Icon name="trash" size={20} /></button>
  </div>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="row" class:done
    style:transform="translateX({dx}px)"
    style:transition={tracking ? 'none' : undefined}
    onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}
    onclick={openEditor}
  >
    <button
      type="button" class="check" style:--p={PRIORITY_COLORS[task.priority]}
      aria-label={store.t('taskDone')} aria-pressed={done}
      onclick={(e) => { e.stopPropagation(); store.toggleDone(task, date); }}
    >
      {#if done}<Icon name="check" size={16} />{/if}
    </button>
    <div class="body">
      <div class="line1">
        <span class="title">{task.title || '—'}</span>
        <span class="when" class:late={overdue}>
          {#if showDate && dateLabel}{dateLabel}{#if task.start} · {/if}{/if}{task.start ?? ''}
        </span>
      </div>
      <div class="line2">
        <span class="no">№{String(store.taskNo.get(task.id) ?? 0).padStart(3, "0")}</span>
        {#if list}<span class="lst" style:--c={list.color}>{list.name}</span>{/if}
        {#if task.subtasks.length}<span>{subDone}/{task.subtasks.length}</span>{/if}
        {#if task.focusMinutes}<span class="ic"><Icon name="tomato" size={14} />{store.t('durMin')(task.focusMinutes)}</span>{/if}
        {#if task.repeat}<span class="ic"><Icon name="repeat" size={14} /></span>{/if}
        {#if task.reminder !== null && task.start}<span class="ic"><Icon name="bell" size={14} /></span>{/if}
        {#if task.note}<span class="ic"><Icon name="note" size={14} /></span>{/if}
      </div>
    </div>
  </div>
</div>

<style>
  .row-wrap { position: relative; overflow: hidden; border-bottom: 1px solid var(--line); }
  .swipe-actions { position: absolute; inset: 0 0 0 auto; display: flex; visibility: hidden; }
  .swipe-actions.show { visibility: visible; }
  .sa { width: 74px; height: 100%; display: grid; place-items: center; color: #fff; font-size: 13px; font-weight: 600; }
  .sa.later { background: var(--muted); }
  .sa.del { background: var(--red); }
  .row {
    position: relative; display: flex; align-items: flex-start; gap: 14px;
    padding: 14px 2px; background: var(--bg); cursor: pointer;
    transition: transform 220ms cubic-bezier(.2,.8,.2,1);
    touch-action: pan-y;
  }
  .check {
    flex: 0 0 auto; width: 24px; height: 24px; margin-top: 1px;
    display: grid; place-items: center;
    border: 2px solid var(--p); border-radius: 7px;
    color: var(--bg);
    transition: background-color 150ms ease, transform 120ms ease;
  }
  .check:active { transform: scale(.88); }
  .check[aria-pressed='true'] { background: var(--p); }
  .check :global(svg) { stroke-width: 3; }
  .body { flex: 1; min-width: 0; }
  .line1 { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .title { font-size: 16.5px; font-weight: 500; line-height: 1.35; overflow-wrap: anywhere; }
  .when { flex: 0 0 auto; color: var(--muted); font-family: var(--mono); font-size: 13px; font-variant-numeric: tabular-nums; }
  .no { font-family: var(--mono); font-size: 12px; color: var(--muted); opacity: .75; letter-spacing: .02em; }
  .when.late { color: var(--red); }
  .line2 { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin-top: 3px; color: var(--muted); font-size: 13px; font-weight: 500; }
  .line2:empty { display: none; }
  .lst { display: inline-flex; align-items: center; gap: 6px; }
  .lst::before { content: ''; width: 8px; height: 8px; border-radius: 2px; background: var(--c); }
  .ic { display: inline-flex; align-items: center; gap: 4px; }
  .ic :global(svg) { stroke-width: 2; }
  .done .title { color: var(--muted); text-decoration: line-through; text-decoration-color: var(--line); }
</style>
