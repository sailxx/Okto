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
    <button type="submit" aria-label={store.t('newTask')} disabled={!title.trim()}><Icon name="plus" size={18} /></button>
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
  :global(body) { min-width: 0; }
  .tray { display: flex; flex-direction: column; gap: 10px; height: 100vh; padding: 12px; box-sizing: border-box; background: var(--bg); color: var(--ink); font-family: var(--sans); overflow: hidden; }
  form { display: flex; gap: 8px; flex: 0 0 auto; }
  input { flex: 1; min-width: 0; height: 40px; padding: 0 12px; border-radius: var(--r-key); border: 1px solid var(--line); background: var(--soft); color: var(--ink); font: inherit; font-size: 15px; outline: none; }
  input:focus { border-color: var(--primary); }
  form button { width: 40px; height: 40px; flex: 0 0 auto; display: grid; place-items: center; border-radius: var(--r-key); background: var(--primary); color: var(--on-primary); }
  form button:disabled { opacity: .4; }
  .signin { height: 36px; border-radius: var(--r-key); border: 1px solid var(--line); font-weight: 600; font-size: 14px; }
  .list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
  .row { display: flex; align-items: center; gap: 10px; min-height: 38px; padding: 0 4px; }
  .check { width: 20px; height: 20px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 50%; border: 2px solid var(--p, var(--muted)); color: var(--on-primary); }
  .done .check { background: var(--p, var(--muted)); }
  .name { flex: 1; min-width: 0; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .done .name { color: var(--muted); text-decoration: line-through; }
  .time { color: var(--muted); font: 500 12px var(--mono); }
  .late { color: var(--red); font-size: 12px; font-weight: 600; }
  .empty { margin: 24px 0; text-align: center; color: var(--muted); font-size: 14px; }
</style>
