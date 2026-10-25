<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { sync } from '../lib/sync.svelte';
  import { instancesInRange, isDoneOn } from '../lib/recurrence';
  import { overdue } from '../lib/stats';
  import { newTask, PRIORITY_COLORS } from '../lib/model';

  let title = $state('');
  let opened = $state<string | null>(null);
  const tasks = $derived(store.tasks.filter((t) => t.kind === 'task'));
  const items = $derived([
    ...overdue(tasks, store.today).map((t) => ({ task: t, date: t.date!, late: true })),
    ...instancesInRange(tasks, store.today, store.today)
      .sort((a, b) => Number(isDoneOn(a.task, a.date)) - Number(isDoneOn(b.task, b.date)) || (a.task.start ?? '').localeCompare(b.task.start ?? ''))
      .map((i) => ({ ...i, late: false })),
  ]);
  const dayLabel = $derived(new Date().toLocaleDateString(store.lang, { weekday: 'short', day: 'numeric', month: 'short' }));
  const doneCount = $derived(items.filter((i) => isDoneOn(i.task, i.date)).length);

  function add(e: SubmitEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    store.saveTask(newTask({ title: text, listId: store.lists[0]?.id ?? '', date: store.today }));
    title = '';
  }
</script>

<div class="tray">
  <header>
    <span class="t-day">{dayLabel}</span>
    <span class="t-count">{doneCount}<i>/</i>{items.length}</span>
  </header>

  <form onsubmit={add}>
    <input bind:value={title} placeholder={store.t('newTask')} autocomplete="off" spellcheck="false" />
    <button type="submit" aria-label={store.t('newTask')} disabled={!title.trim()}><Icon name="plus" size={16} /></button>
  </form>

  {#if sync.state === 'signed-out'}
    <button type="button" class="t-signin" onclick={() => sync.signIn()}>{store.t('signIn')}</button>
  {/if}

  <div class="t-list">
    {#each items as i (i.task.id + i.date)}
      {@const done = isDoneOn(i.task, i.date)}
      {@const key = i.task.id + i.date}
      {@const open = opened === key}
      <div class="t-row" class:done class:open>
        <button type="button" class="t-check" style:--p={PRIORITY_COLORS[i.task.priority]} aria-pressed={done} aria-label={i.task.title} onclick={() => store.toggleDone(i.task, i.date)}>
          {#if done}<Icon name="check" size={14} />{/if}
        </button>
        <button type="button" class="t-body" aria-expanded={open} onclick={() => (opened = open ? null : key)}>
          <span class="t-ttl">{i.task.title}</span>
          {#if open}
            {#if i.task.note}<span class="t-note">{i.task.note}</span>{/if}
            {#each i.task.subtasks as s (s.id)}<span class="t-sub" class:sdone={s.done}><b>{s.done ? '✓' : ''}</b>{s.title}</span>{/each}
          {/if}
        </button>
        {#if i.late}<span class="t-tag late">{store.t('overdue')}</span>{:else if i.task.start}<span class="t-tag">{i.task.start}</span>{/if}
      </div>
    {:else}
      <p class="t-empty">{store.t('emptyToday')}</p>
    {/each}
  </div>
</div>

<style>
  :global(html), :global(body) { min-width: 0; background: transparent !important; }
  .tray {
    --ink: #fff; --muted: rgb(255 255 255 / 56%); --line: rgb(255 255 255 / 9%); --well: rgb(255 255 255 / 7%); --well-edge: rgb(255 255 255 / 10%);
    --bg: #202020; --on-key: #141414; --gutter: 18px;
    display: flex; flex-direction: column; height: 100vh; box-sizing: border-box; overflow: hidden;
    background: rgb(32 32 32 / 72%); color: var(--ink); font-family: var(--sans);
  }
  @media (prefers-color-scheme: light) {
    .tray { --ink: #1a1a1a; --muted: rgb(0 0 0 / 56%); --line: rgb(0 0 0 / 9%); --well: rgb(0 0 0 / 5%); --well-edge: rgb(0 0 0 / 9%); --bg: #f3f3f3; --on-key: #fff; background: rgb(243 243 243 / 72%); }
  }

  header { display: flex; align-items: baseline; justify-content: space-between; padding: 18px var(--gutter) 10px; font-family: var(--mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .t-day { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .t-count { color: var(--ink); font-weight: 600; }
  .t-count i { font-style: normal; color: var(--muted); margin: 0 1px; }

  form { display: flex; align-items: center; gap: 8px; height: 44px; margin: 0 var(--gutter) 6px; padding: 0 6px 0 14px; border-radius: 12px; background: var(--well); box-shadow: inset 0 0 0 1px var(--well-edge); }
  form:focus-within { box-shadow: inset 0 0 0 1px var(--muted); }
  input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; background: none; color: var(--ink); font: inherit; font-size: 16px; outline: none; }
  input::placeholder { color: var(--muted); }
  form button { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 auto; border-radius: 9px; background: var(--ink); color: var(--on-key); transition: opacity 150ms ease, transform 90ms ease; }
  form button:active { transform: scale(.94); }
  form button:disabled { opacity: .25; }

  .t-signin { margin: 4px var(--gutter) 0; height: 36px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--well-edge); font-size: 14px; font-weight: 600; }

  .t-list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 0 12px; scrollbar-width: thin; scrollbar-color: var(--well-edge) transparent; }
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
