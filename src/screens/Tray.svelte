<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { sync } from '../lib/sync.svelte';
  import { instancesInRange, isDoneOn } from '../lib/recurrence';
  import { overdue } from '../lib/stats';
  import { newTask, PRIORITY_COLORS } from '../lib/model';

  let title = $state('');
  const tasks = $derived(store.tasks.filter((t) => t.kind === 'task'));
  const items = $derived([
    ...overdue(tasks, store.today).map((t) => ({ task: t, date: t.date!, late: true })),
    ...instancesInRange(tasks, store.today, store.today)
      .sort((a, b) => Number(isDoneOn(a.task, a.date)) - Number(isDoneOn(b.task, b.date)) || (a.task.start ?? '').localeCompare(b.task.start ?? ''))
      .map((i) => ({ ...i, late: false })),
  ]);

  function add(e: SubmitEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    store.saveTask(newTask({ title: text, listId: store.lists[0]?.id ?? '', date: store.today }));
    title = '';
  }
</script>

<div class="tray">
  <form onsubmit={add}>
    <input bind:value={title} placeholder={store.t('newTask')} autocomplete="off" spellcheck="false" />
    <button type="submit" aria-label={store.t('newTask')} disabled={!title.trim()}><Icon name="plus" size={14} /></button>
  </form>

  {#if sync.state === 'signed-out'}
    <button type="button" class="signin" onclick={() => sync.signIn()}>{store.t('signIn')}</button>
  {/if}

  <div class="list">
    {#each items as i (i.task.id + i.date)}
      {@const done = isDoneOn(i.task, i.date)}
      <div class="row" class:done>
        <button type="button" class="check" style:--p={PRIORITY_COLORS[i.task.priority]} aria-pressed={done} aria-label={i.task.title} onclick={() => store.toggleDone(i.task, i.date)}>
          {#if done}<Icon name="check" size={14} />{/if}
        </button>
        <span class="name">{i.task.title}</span>
        {#if i.late}<span class="late">{store.t('overdue')}</span>{:else if i.task.start}<span class="time">{i.task.start}</span>{/if}
      </div>
    {:else}
      <p class="empty">{store.t('emptyToday')}</p>
    {/each}
  </div>
</div>

<style>
  :global(html), :global(body) { min-width: 0; background: transparent !important; }
  .tray { display: flex; flex-direction: column; height: 100vh; box-sizing: border-box; --ink: #fff; --muted: rgb(255 255 255 / 55%); --line: rgb(255 255 255 / 10%); --bg: #202020; background: transparent; color: var(--ink); font-family: var(--sans); overflow: hidden; }
  @media (prefers-color-scheme: light) { .tray { --ink: #1a1a1a; --muted: rgb(0 0 0 / 55%); --line: rgb(0 0 0 / 10%); --bg: #f3f3f3; } }
  form { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; padding: 14px 18px; border-bottom: 1px solid var(--line); }
  input { flex: 1; min-width: 0; height: 32px; padding: 0; border: 0; background: none; color: var(--ink); font: inherit; font-size: 16px; outline: none; }
  input::placeholder { color: var(--muted); }
  form button { display: grid; place-items: center; width: 24px; height: 24px; flex: 0 0 auto; border-radius: 50%; background: #4cc2ff; color: #06202e; }
  form button:disabled { background: var(--line); color: var(--muted); }
  .signin { margin: 10px 18px 0; height: 30px; border-radius: 6px; border: 1px solid var(--line); font-size: 13px; font-weight: 600; }
  .list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 0; scrollbar-width: thin; }
  .row { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 18px; }
  .check { width: 20px; height: 20px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 50%; border: 1.5px solid var(--p, var(--muted)); color: var(--bg); }
  .done .check { background: var(--p, var(--muted)); }
  .name { flex: 1; min-width: 0; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .done .name { color: var(--muted); text-decoration: line-through; }
  .time { color: var(--muted); font: 500 13px var(--mono); }
  .late { color: var(--red); font-size: 13px; font-weight: 600; }
  .empty { margin: 20px 0; text-align: center; color: var(--muted); font-size: 15px; }
</style>
