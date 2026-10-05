<script lang="ts">
  import { untrack, onMount } from 'svelte';
  import Sheet from './Sheet.svelte';
  import Icon from './Icon.svelte';
  import MiniMonth from './MiniMonth.svelte';
  import { store, type Scope } from '../lib/store.svelte';
  import { router } from '../lib/router.svelte';
  import { addDays, monthStart, toMin, fromMin } from '../lib/date';
  import { relDay } from '../lib/i18n';
  import { DURATIONS, PRIORITY_COLORS, REMINDERS, uid, type Freq, type Task } from '../lib/model';

  const ed = untrack(() => store.editor!);
  const original = $state.snapshot(ed.task) as Task;
  let draft = $state<Task>({ ...$state.snapshot(ed.task) as Task, date: ed.isNew ? original.date : ed.occurrence ?? original.date });

  type Panel = 'date' | 'time' | 'repeat' | 'reminder' | 'list' | 'priority' | null;
  let panel = $state<Panel>(null);
  let scopeFor = $state<'save' | 'delete' | null>(null);
  let month = $state(monthStart(draft.date ?? store.today));
  let titleEl: HTMLTextAreaElement;
  let newSub = $state('');

  const close = () => { store.editor = null; };
  const toggle = (p: Panel) => { panel = panel === p ? null : p; };

  onMount(() => { if (ed.isNew) setTimeout(() => titleEl?.focus(), 60); });

  /* ---------- labels ---------- */
  const dateLabel = $derived(draft.date ? relDay(store.lang, draft.date, store.today, addDays(store.today, 1), addDays(store.today, -1)) : store.t('noDate'));
  const timeLabel = $derived(draft.start ? `${draft.start}–${fromMin(toMin(draft.start) + draft.duration)}` : store.t('noTime'));
  const repeatLabels: Record<Freq, 'rDay' | 'rWeekday' | 'rWeek' | 'rMonth'> = { day: 'rDay', weekday: 'rWeekday', week: 'rWeek', month: 'rMonth' };
  const repeatLabel = $derived(draft.repeat ? store.t(repeatLabels[draft.repeat.freq]) + (draft.repeat.interval > 1 ? ` ×${draft.repeat.interval}` : '') : store.t('rNone'));
  const remLabel = (m: number | null) => (m === null ? store.t('remNone') : m === 0 ? store.t('remAt') : store.t('remBefore')(m));
  const list = $derived(store.lists.find((l) => l.id === draft.listId) ?? store.lists[0]);

  /* ---------- edits ---------- */
  function setDate(k: string | null) { draft.date = k; if (!k) { draft.repeat = null; } panel = null; }
  function setStart(v: string) { draft.start = v || null; if (!v) draft.reminder = null; }
  function setRepeat(freq: Freq | null) {
    draft.repeat = freq ? { freq, interval: draft.repeat?.freq === freq ? draft.repeat.interval : 1, until: draft.repeat?.until ?? null } : null;
    if (freq && !draft.date) draft.date = store.today;
  }
  function addSub() {
    const title = newSub.trim();
    if (!title) return;
    draft.subtasks.push({ id: uid(), title, done: false });
    newSub = '';
  }

  /* ---------- save / delete ---------- */
  const FIELDS: (keyof Task)[] = ['title', 'note', 'listId', 'priority', 'date', 'start', 'duration', 'subtasks', 'repeat', 'reminder'];
  function patch(): Partial<Task> {
    const out: Partial<Task> = {};
    const base = { ...original, date: ed.occurrence ?? original.date };
    for (const f of FIELDS) if (JSON.stringify(draft[f]) !== JSON.stringify(base[f])) (out as any)[f] = $state.snapshot(draft[f]);
    return out;
  }
  const isSeries = !ed.isNew && Boolean(original.repeat) && ed.occurrence !== null;

  function save(): string | null {
    draft.title = draft.title.trim();
    if (!draft.title) { titleEl?.focus(); store.toast(store.t('titleRequired')); return null; }
    if (ed.isNew) { store.saveTask(draft); return draft.id; }
    const p = patch();
    if (!Object.keys(p).length) return original.id;
    if (isSeries) { scopeFor = 'save'; return null; }
    store.saveTask({ ...original, ...p } as Task);
    return original.id;
  }
  function onSave() { if (save()) close(); }
  function onDelete() {
    if (isSeries) { scopeFor = 'delete'; return; }
    store.deleteTask(original);
    close();
  }
  function applyScope(scope: Scope) {
    if (scopeFor === 'save') store.editTask(original, ed.occurrence, patch(), scope);
    else store.deleteTask(original, ed.occurrence, scope);
    close();
  }
  function focusOnTask() {
    const id = save();
    if (!id) return;
    store.setDevice({ focusTask: id, focusMode: 'pomodoro' });
    close();
    router.go('focus');
  }
</script>

<Sheet title={ed.isNew ? store.t('newTask') : store.t('task')} onclose={close}>
  {#snippet head()}
    <button class="icon-btn" type="button" aria-label={store.t('focusOn')} title={store.t('focusOn')} onclick={focusOnTask}><Icon name="tomato" /></button>
  {/snippet}

  <div class="ed">
    <div class="title-row">
      <button type="button" class="check" style:--p={PRIORITY_COLORS[draft.priority]} aria-hidden="true" tabindex="-1"></button>
      <textarea
        class="title" rows="1" maxlength="200" placeholder={store.t('title')}
        bind:value={draft.title} bind:this={titleEl}
        onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSave(); } }}
      ></textarea>
    </div>
    <textarea class="note" rows="2" maxlength="4000" placeholder={store.t('note')} bind:value={draft.note}></textarea>

    <div class="chips">
      <button type="button" class="chip" class:on={panel === 'date'} class:set={draft.date} onclick={() => toggle('date')}><Icon name="calendar" size={18} />{dateLabel}</button>
      <button type="button" class="chip" class:on={panel === 'time'} class:set={draft.start} onclick={() => toggle('time')}><Icon name="clock" size={18} />{timeLabel}</button>
      <button type="button" class="chip" class:on={panel === 'repeat'} class:set={draft.repeat} onclick={() => toggle('repeat')}><Icon name="repeat" size={18} />{repeatLabel}</button>
      {#if draft.start}
        <button type="button" class="chip" class:on={panel === 'reminder'} class:set={draft.reminder !== null} onclick={() => toggle('reminder')}><Icon name="bell" size={18} />{remLabel(draft.reminder)}</button>
      {/if}
      <button type="button" class="chip" class:on={panel === 'list'} onclick={() => toggle('list')}><span class="dot" style:--c={list?.color}></span>{list?.name}</button>
      <button type="button" class="chip" class:on={panel === 'priority'} class:set={draft.priority} style:--p={PRIORITY_COLORS[draft.priority]} onclick={() => toggle('priority')}><Icon name="flag" size={18} />{store.t('prio')[draft.priority]}</button>
    </div>

    {#if panel === 'date'}
      <div class="panel">
        <div class="quick">
          <button type="button" class="tag plain" onclick={() => setDate(store.today)}>{store.t('today')}</button>
          <button type="button" class="tag plain" onclick={() => setDate(addDays(store.today, 1))}>{store.t('tomorrow')}</button>
          <button type="button" class="tag plain" onclick={() => setDate(addDays(store.today, 7))}>+7</button>
          <button type="button" class="tag plain" onclick={() => setDate(null)}>{store.t('noDate')}</button>
        </div>
        <MiniMonth value={draft.date} bind:month onpick={(k) => setDate(k)} />
      </div>
    {:else if panel === 'time'}
      <div class="panel">
        <div class="time-row">
          <label class="field inline"><span>{store.t('time')}</span><input type="time" step="300" value={draft.start ?? ''} onchange={(e) => setStart(e.currentTarget.value)} /></label>
          {#if draft.start}<button type="button" class="text-btn" onclick={() => setStart('')}>{store.t('clear')}</button>{/if}
        </div>
        {#if draft.start}
          <span class="label">{store.t('duration')}</span>
          <div class="quick">
            {#each DURATIONS as d}
              <button type="button" class="tag plain" aria-pressed={draft.duration === d} onclick={() => (draft.duration = d)}>{store.t('durMin')(d)}</button>
            {/each}
          </div>
        {/if}
      </div>
    {:else if panel === 'repeat'}
      <div class="panel">
        <div class="quick">
          <button type="button" class="tag plain" aria-pressed={!draft.repeat} onclick={() => setRepeat(null)}>{store.t('rNone')}</button>
          {#each Object.entries(repeatLabels) as [f, l]}
            <button type="button" class="tag plain" aria-pressed={draft.repeat?.freq === f} onclick={() => setRepeat(f as Freq)}>{store.t(l)}</button>
          {/each}
        </div>
        {#if draft.repeat}
          <div class="rep-opts">
            {#if draft.repeat.freq !== 'weekday'}
              <label class="field inline"><span>{store.t('every2')}</span><input type="number" min="1" max="99" value={draft.repeat.interval}
                onchange={(e) => { const v = parseInt(e.currentTarget.value, 10); if (draft.repeat) draft.repeat.interval = v >= 1 && v <= 99 ? v : 1; }} /></label>
            {/if}
            <label class="field inline"><span>{store.t('repeatUntil')}</span><input type="date" value={draft.repeat.until ?? ''} min={draft.date ?? undefined}
              onchange={(e) => { if (draft.repeat) draft.repeat.until = e.currentTarget.value || null; }} /></label>
          </div>
        {/if}
      </div>
    {:else if panel === 'reminder'}
      <div class="panel quick">
        <button type="button" class="tag plain" aria-pressed={draft.reminder === null} onclick={() => (draft.reminder = null)}>{store.t('remNone')}</button>
        {#each REMINDERS as m}
          <button type="button" class="tag plain" aria-pressed={draft.reminder === m} onclick={() => (draft.reminder = m)}>{remLabel(m)}</button>
        {/each}
      </div>
    {:else if panel === 'list'}
      <div class="panel quick">
        {#each store.lists as l (l.id)}
          <button type="button" class="tag" style:--c={l.color} aria-pressed={draft.listId === l.id} onclick={() => { draft.listId = l.id; panel = null; }}>{l.name}</button>
        {/each}
      </div>
    {:else if panel === 'priority'}
      <div class="panel quick">
        {#each [0, 1, 2, 3] as p}
          <button type="button" class="tag" style:--c={PRIORITY_COLORS[p]} aria-pressed={draft.priority === p} onclick={() => { draft.priority = p as Task['priority']; panel = null; }}>{store.t('prio')[p]}</button>
        {/each}
      </div>
    {/if}

    <div class="subs">
      <span class="label">{store.t('subtasks')}</span>
      {#each draft.subtasks as s, i (s.id)}
        <div class="sub-row">
          <button type="button" class="check sm" aria-pressed={s.done} aria-label={store.t('taskDone')} onclick={() => (s.done = !s.done)}>{#if s.done}<Icon name="check" size={13} />{/if}</button>
          <input type="text" maxlength="200" bind:value={s.title} class:done={s.done} />
          <button type="button" class="icon-btn xs" aria-label={store.t('delete')} onclick={() => draft.subtasks.splice(i, 1)}><Icon name="close" size={16} /></button>
        </div>
      {/each}
      <div class="sub-row add">
        <span class="plus"><Icon name="plus" size={16} /></span>
        <input type="text" maxlength="200" placeholder={store.t('addSubtask')} bind:value={newSub}
          onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }} onblur={addSub} />
      </div>
    </div>

    {#if draft.focusMinutes}
      <p class="focus-total"><Icon name="tomato" size={16} />{store.t('durMin')(draft.focusMinutes)}</p>
    {/if}

    {#if scopeFor}
      <div class="scope">
        <p>{store.t('scopeTitle')}</p>
        <button type="button" class="line-btn" onclick={() => applyScope('one')}>{store.t('scopeOne')}</button>
        <button type="button" class="line-btn" onclick={() => applyScope('future')}>{store.t('scopeFuture')}</button>
        <button type="button" class="line-btn" class:danger={scopeFor === 'delete'} onclick={() => applyScope('all')}>{store.t('scopeAll')}</button>
      </div>
    {:else}
      <div class="row-btns" class:single={ed.isNew}>
        {#if !ed.isNew}<button class="line-btn danger" type="button" onclick={onDelete}>{store.t('delete')}</button>{/if}
        <button class="solid-btn" type="button" onclick={onSave}>{store.t('save')}</button>
      </div>
    {/if}
  </div>
</Sheet>

<style>
  .ed { display: flex; flex-direction: column; gap: 12px; }
  .title-row { display: flex; align-items: flex-start; gap: 12px; }
  .check {
    flex: 0 0 auto; width: 24px; height: 24px; margin-top: 6px;
    display: grid; place-items: center;
    border: 2px solid var(--p, var(--ink)); border-radius: 7px; color: var(--bg);
  }
  .check.sm { width: 20px; height: 20px; margin-top: 0; --p: var(--muted); }
  .check[aria-pressed='true'] { background: var(--p, var(--ink)); }
  .check :global(svg) { stroke-width: 3; }
  textarea { width: 100%; border: 0; background: none; resize: none; outline: none; padding: 0; }
  .title { font-family: var(--sans); font-size: 23px; font-weight: 700; letter-spacing: -.02em; line-height: 1.3; field-sizing: content; min-height: 34px; }
  .note { font-size: 16px; color: var(--muted); field-sizing: content; min-height: 44px; padding-left: 36px; }
  .title::placeholder, .note::placeholder { color: var(--muted); opacity: .7; }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    display: inline-flex; align-items: center; gap: 7px;
    height: 36px; padding: 0 12px; border-radius: 8px;
    background: var(--soft); color: var(--muted);
    font-size: 14px; font-weight: 600; white-space: nowrap;
    border: 1.5px solid transparent;
    transition: border-color 150ms ease, color 150ms ease;
  }
  .chip.set { color: var(--ink); }
  .chip.on { border-color: var(--ink); color: var(--ink); }
  .chip :global(svg) { stroke-width: 2; }
  .chip.set[style] :global(svg) { color: var(--p); }
  .dot { width: 10px; height: 10px; border-radius: 2px; background: var(--c); }

  .panel { padding: 14px; border-radius: var(--r-well); background: var(--soft); box-shadow: inset 0 1px 2px rgb(0 0 0 / 10%); }
  .panel.quick, .quick { display: flex; flex-wrap: wrap; gap: 8px; }
  .panel .quick { margin-bottom: 12px; }
  .panel .tag { background: var(--bg); }
  .tag.plain::before { display: none; }
  .tag.plain { padding: 0 14px; }
  .time-row { display: flex; align-items: flex-end; gap: 10px; margin-bottom: 12px; }
  .rep-opts { display: flex; gap: 10px; flex-wrap: wrap; }
  .field.inline { margin: 0; flex: 1; min-width: 130px; }
  .field.inline input { background: var(--bg); height: 46px; font-size: 16px; }

  .subs .label { margin-bottom: 4px; }
  .sub-row { display: flex; align-items: center; gap: 12px; min-height: 42px; border-bottom: 1px solid var(--line); }
  .sub-row input { flex: 1; min-width: 0; height: 40px; border: 0; background: none; outline: none; font-size: 16px; }
  .sub-row input.done { color: var(--muted); text-decoration: line-through; }
  .sub-row.add { border-bottom: 0; color: var(--muted); }
  .plus { width: 20px; display: grid; place-items: center; }
  .icon-btn.xs { width: 32px; height: 32px; color: var(--muted); }

  .focus-total { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--muted); font-size: 14px; font-weight: 600; }
  .scope { display: grid; gap: 8px; }
  .scope p { margin: 0 2px 4px; color: var(--muted); font-size: 15px; font-weight: 500; }
  .row-btns { margin-top: 6px; }
</style>
