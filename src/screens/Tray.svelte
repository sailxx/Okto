<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { sync } from '../lib/sync.svelte';
  import { instancesInRange, isDoneOn } from '../lib/recurrence';
  import { overdue } from '../lib/stats';
  import { newTask, PRIORITY_COLORS, type Task } from '../lib/model';
  import { localDateTimeValue, scheduledTrayReminders, trayReminderBridge } from '../lib/trayReminders';
  const nativeTray = Boolean(trayReminderBridge());

  let title = $state('');
  let opened = $state<string | null>(null);
  let addingDetails = $state(false);
  type Schedule = { priority: Task['priority']; date: string; start: string; deadline: string };
  const emptySchedule = (date = ''): Schedule => ({ priority: 0, date, start: '', deadline: '' });
  let next = $state(emptySchedule());
  let edit = $state<{ id: string; schedule: Schedule } | null>(null);
  const tasks = $derived(store.tasks.filter((t) => t.kind === 'task'));
  const items = $derived([
    ...overdue(tasks, store.today).map((t) => ({ task: t, date: t.date!, late: true })),
    ...instancesInRange(tasks, store.today, store.today)
      .sort((a, b) => Number(isDoneOn(a.task, a.date)) - Number(isDoneOn(b.task, b.date)) || (a.task.start ?? '').localeCompare(b.task.start ?? ''))
      .map((i) => ({ ...i, late: false })),
  ]);
  const upcoming = $derived(tasks.filter((t) => !t.done && t.date && t.date > store.today)
    .sort((a, b) => a.date!.localeCompare(b.date!) || (a.start ?? '').localeCompare(b.start ?? ''))
    .map((task) => ({ task, date: task.date!, late: false })));
  const dayLabel = $derived(new Date(`${store.today}T12:00`).toLocaleDateString(store.lang, { weekday: 'short', day: 'numeric', month: 'short' }));
  const doneCount = $derived(items.filter((i) => isDoneOn(i.task, i.date)).length);

  $effect(() => {
    const bridge = trayReminderBridge();
    if (!bridge) return;
    const items = scheduledTrayReminders(store.tasks, store.today, store.lang, {
      reminder: store.t('reminderTitle'), deadline: store.t('deadlineReached'),
    });
    bridge.postMessage({ type: 'okto-tray-reminders', items });
  });

  function values(schedule: Schedule, task?: Task): Partial<Task> {
    const start = schedule.start || null;
    return {
      priority: schedule.priority,
      date: schedule.date || store.today,
      start,
      reminder: start ? task?.reminder ?? 0 : null,
      deadlineAt: schedule.deadline ? new Date(schedule.deadline).getTime() : undefined,
    };
  }

  function add(e: SubmitEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    store.saveTask(newTask({ title: text, listId: store.lists[0]?.id ?? '', ...values(next) }));
    title = '';
    addingDetails = false;
    next = emptySchedule();
  }

  function editSchedule(task: Task) {
    edit = { id: task.id, schedule: {
      priority: task.priority, date: task.date ?? store.today, start: task.start ?? '', deadline: localDateTimeValue(task.deadlineAt),
    } };
  }

  function saveSchedule(e: SubmitEvent, task: Task) {
    e.preventDefault();
    if (!edit || edit.id !== task.id) return;
    store.saveTask({ ...task, ...values(edit.schedule, task) });
    edit = null;
  }
</script>

{#snippet fields(schedule: Schedule)}
  <div class="t-fields">
    <label><span>{store.t('date')}</span><input type="date" bind:value={schedule.date} required /></label>
    <label><span>{store.t('time')}</span><input type="time" bind:value={schedule.start} /></label>
    <label><span>{store.t('priority')}</span>
      <select bind:value={schedule.priority}>
        {#each store.t('prio') as label, index}<option value={index}>{label}</option>{/each}
      </select>
    </label>
    <label><span>{store.t('deadline')}</span><input type="datetime-local" bind:value={schedule.deadline} /></label>
  </div>
{/snippet}

<div class="tray">
  <header>
    <span class="t-day">{dayLabel}</span>
    <span class="t-count">{doneCount}<i>/</i>{items.length}</span>
  </header>

  <div class="t-list">
    <form class="t-add" onsubmit={add}>
      <div class="t-compose">
        <input class="t-input" aria-label={store.t('newTask')} bind:value={title} placeholder={store.t('newTask')} maxlength={200} autocomplete="off" spellcheck="false" />
        <button type="button" class="t-options" aria-label={store.t('settings')} aria-expanded={addingDetails} onclick={() => { if (!next.date) next.date = store.today; addingDetails = !addingDetails; }}>
          <Icon name="settings" size={18} />
        </button>
        <button type="submit" class="t-primary" aria-label={store.t('newTask')} disabled={!title.trim()}><Icon name="plus" size={16} /></button>
      </div>
      {#if addingDetails}{@render fields(next)}{/if}
    </form>

    {#if sync.authReady && !sync.user && sync.state !== 'off'}
      {#if nativeTray}
        <a class="t-signin" href={location.href} target="_blank" rel="noopener noreferrer">{store.t('signInBrowser')}</a>
      {:else}
        <button type="button" class="t-signin" disabled={sync.signingIn} onclick={() => sync.signIn()}>{sync.signingIn ? store.t('signingIn') : store.t('signIn')}</button>
      {/if}
    {/if}

    {#if !items.length && !upcoming.length}<p class="t-empty">{store.t('emptyToday')}</p>{/if}
    {#each [...items, ...upcoming] as i (i.task.id + i.date)}
      {@const done = isDoneOn(i.task, i.date)}
      {@const key = i.task.id + i.date}
      {@const open = opened === key}
      {#if i === upcoming[0]}<h2 class="t-upcoming">{store.t('upcomingTasks')}</h2>{/if}
      <div class="t-row" class:done class:open>
        <button type="button" class="t-check" style:--p={PRIORITY_COLORS[i.task.priority]} aria-pressed={done} aria-label={i.task.title} onclick={() => store.toggleDone(i.task, i.date)}>
          {#if done}<Icon name="check" size={14} />{/if}
        </button>
        <button type="button" class="t-body" aria-expanded={open} onclick={() => { opened = open ? null : key; edit = null; }}>
          <span class="t-ttl">{i.task.title}</span>
          {#if open}
            {#if i.task.note}<span class="t-note">{i.task.note}</span>{/if}
            {#if i.task.priority}<span class="t-note">{store.t('prio')[i.task.priority]}</span>{/if}
            {#if i.task.deadlineAt !== undefined}
              <span class="t-note">{store.t('deadline')} · {new Date(i.task.deadlineAt).toLocaleString(store.lang, { dateStyle: 'short', timeStyle: 'short' })}</span>
            {/if}
            {#each i.task.subtasks as s (s.id)}<span class="t-sub" class:sdone={s.done}><b>{s.done ? '✓' : ''}</b>{s.title}</span>{/each}
          {/if}
        </button>
        {#if i.late}
          <span class="t-tag late">{store.t('overdue')}</span>
        {:else if i.date > store.today}
          <span class="t-tag">{new Date(`${i.date}T12:00`).toLocaleDateString(store.lang, { month: 'short', day: 'numeric' })}{i.task.start ? ` · ${i.task.start}` : ''}</span>
        {:else if i.task.start}
          <span class="t-tag">{i.task.start}</span>
        {/if}
        {#if open}
          {#if edit?.id === i.task.id}
            <form class="t-edit" onsubmit={(e) => saveSchedule(e, i.task)}>
              {@render fields(edit.schedule)}
              <button class="t-action" type="submit">{store.t('save')}</button>
              <button class="t-action" type="button" onclick={() => { edit = null; }}>{store.t('close')}</button>
            </form>
          {:else}
            <button class="t-edit t-action" type="button" onclick={() => editSchedule(i.task)}>{store.t('edit')}</button>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  :global(html), :global(body) { min-width: 0; background: transparent !important; }
  .tray {
    --ink: #fff; --muted: rgb(255 255 255 / 56%); --line: rgb(255 255 255 / 9%); --well: rgb(255 255 255 / 7%); --well-edge: rgb(255 255 255 / 10%);
    --bg: #202020; --on-key: #141414; --gutter: 18px;
    display: flex; flex-direction: column; height: 100vh; box-sizing: border-box; overflow: hidden;
    background: rgb(32 32 32 / 92%); color: var(--ink); font-family: var(--sans);
  }
  @media (prefers-color-scheme: light) {
    .tray { --ink: #1a1a1a; --muted: rgb(0 0 0 / 56%); --line: rgb(0 0 0 / 9%); --well: rgb(0 0 0 / 5%); --well-edge: rgb(0 0 0 / 9%); --bg: #f3f3f3; --on-key: #fff; background: rgb(243 243 243 / 92%); }
  }

  header { display: flex; align-items: baseline; justify-content: space-between; padding: 18px var(--gutter) 10px; font-family: var(--mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .t-day { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .t-count { color: var(--ink); font-weight: 600; }
  .t-count i { font-style: normal; color: var(--muted); margin: 0 1px; }

  .t-add { margin: 0 var(--gutter) 6px; }
  .t-compose { display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 6px 0 14px; border-radius: 12px; background: var(--well); box-shadow: inset 0 0 0 1px var(--well-edge); }
  .t-compose:focus-within { box-shadow: inset 0 0 0 1px var(--muted); }
  .t-input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; background: none; color: var(--ink); font: inherit; font-size: 16px; outline: none; }
  .t-input::placeholder { color: var(--muted); }
  .t-options, .t-primary { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 auto; border-radius: 9px; }
  .t-primary { background: var(--ink); color: var(--on-key); }
  .t-primary:disabled { opacity: .25; }
  .t-options:hover, .t-options[aria-expanded="true"] { background: var(--well); }
  .t-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 10px 0; }
  .t-fields label { display: grid; gap: 4px; min-width: 0; color: var(--muted); font-size: 12px; }
  .t-fields label:last-child { grid-column: 1 / -1; }
  .t-fields input, .t-fields select { box-sizing: border-box; width: 100%; min-width: 0; height: 34px; padding: 0 7px; border: 1px solid var(--well-edge); border-radius: 8px; background: var(--bg); color: var(--ink); font: inherit; font-size: 13px; color-scheme: light dark; }
  .t-edit { grid-column: 2 / -1; justify-self: stretch; }
  .t-action { justify-self: start; min-height: 28px; padding: 0 8px; margin-top: 4px; border-radius: 7px; background: var(--well); font-size: 13px; }
  .t-upcoming { margin: 12px var(--gutter) 0; color: var(--muted); font-size: 13px; font-weight: 600; }

  .t-signin { display: grid; place-items: center; width: calc(100% - 2 * var(--gutter)); margin: 4px var(--gutter) 0; height: 36px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--well-edge); font-size: 14px; font-weight: 600; color: inherit; text-decoration: none; }
  .t-signin:global([hidden]) { display: none; }
  .t-list :global(a:has(+ .t-signin)) { display: block; width: fit-content; margin: 0 auto; }

  .t-list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 0 12px; scrollbar-width: none; }
  .t-row { position: relative; display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; column-gap: 12px; align-items: start; padding: 11px var(--gutter); }
  .t-row + .t-row::before { content: ''; position: absolute; top: 0; left: calc(var(--gutter) + 34px); right: var(--gutter); height: 1px; background: var(--line); }
  .t-row:hover { background: var(--well); }

  .t-check { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; border: 1.5px solid var(--p, var(--muted)); color: var(--bg); transition: background-color 150ms ease; }
  .done .t-check { background: var(--p, var(--muted)); }
  .t-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 0; text-align: left; }
  .t-ttl { font-size: 16px; font-weight: 500; line-height: 22px; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .open .t-ttl { display: block; line-clamp: unset; }
  .done .t-ttl { color: var(--muted); text-decoration: line-through; text-decoration-thickness: 1px; }
  .t-note, .t-sub { color: var(--muted); font-size: 14px; line-height: 20px; white-space: pre-wrap; overflow-wrap: anywhere; }
  .t-sub { display: grid; grid-template-columns: 14px 1fr; gap: 8px; }
  .t-sub b { font-weight: 600; font-size: 12px; }
  .sdone { text-decoration: line-through; }

  .t-tag { height: 22px; display: inline-flex; align-items: center; font: 500 12px var(--mono); letter-spacing: .04em; color: var(--muted); }
  .t-tag.late { color: var(--red); font-family: var(--sans); font-weight: 600; font-size: 12px; letter-spacing: 0; }

  .t-empty { margin: 36px var(--gutter); text-align: center; color: var(--muted); font-size: 15px; }
</style>
