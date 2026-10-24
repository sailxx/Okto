<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { addDays } from '../lib/date';
  import { habitStreak } from '../lib/life';
  import { COLORS } from '../lib/model';

  let name = $state('');
  let color = $state(COLORS[1]);
  const week = $derived(Array.from({ length: 7 }, (_, i) => addDays(store.today, i - 6)));
  const doneToday = $derived(store.habits.filter((h) => h.doneDates.includes(store.today)).length);
  const weekday = (k: string) => new Intl.DateTimeFormat(store.lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'narrow' }).format(new Date(`${k}T12:00:00`));

  function add(e: SubmitEvent) {
    e.preventDefault();
    store.addHabit(name, color);
    name = '';
  }
</script>

<div class="page wide">
  <div class="page-head">
    <div>
      <h1 class="page-title">{store.t('navHabits')}</h1>
      <p class="page-sub">{store.habits.length ? store.t('habitsOf')(doneToday, store.habits.length) : store.t('habitNone')}</p>
    </div>
  </div>

  <form class="add" onsubmit={add}>
    <input type="text" placeholder={store.t('habitPh')} maxlength="80" bind:value={name} aria-label={store.t('habitPh')} />
    <span class="dots">
      {#each COLORS.slice(0, 8) as c}
        <button type="button" class="sw" class:on={color === c} style:--c={c} aria-label={c} onclick={() => (color = c)}></button>
      {/each}
    </span>
    <button class="go" type="submit" disabled={!name.trim()}><Icon name="plus" size={18} /><span>{store.t('habitAdd')}</span></button>
  </form>

  {#if store.habits.length}
    <ul class="list">
      {#each store.habits as h (h.id)}
        {@const on = h.doneDates.includes(store.today)}
        <li style:--c={h.color}>
          <button type="button" class="tick" class:on aria-pressed={on} aria-label={store.t('habitDone')} onclick={() => store.toggleHabit(h, store.today)}><Icon name="check" size={20} /></button>
          <div class="body">
            <span class="hn">{h.name}</span>
            <span class="hm"><Icon name="flame" size={13} />{store.t('streakDays')(habitStreak(h, store.today))}</span>
          </div>
          <span class="wk" aria-label={store.t('habitWeek')}>
            {#each week as d}
              <button type="button" class="d" class:on={h.doneDates.includes(d)} class:today={d === store.today} title={d} onclick={() => store.toggleHabit(h, d)}>{weekday(d)}</button>
            {/each}
          </span>
          <button type="button" class="del" aria-label={store.t('remove')} onclick={() => store.deleteHabit(h)}><Icon name="trash" size={18} /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="empty">
      <p class="hint label">{store.t('habitsEmpty')}</p>
      <p>{store.t('habitsEmptyHint')}</p>
    </div>
  {/if}
</div>

<style>
  .add { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 18px 0 14px; }
  .add input[type='text'] { flex: 1 1 200px; min-width: 0; height: 46px; padding: 0 16px; border-radius: 18px; border: 0; outline: none; background: var(--glass-fill); box-shadow: var(--glass-edge); font: inherit; font-size: 16px; color: var(--ink); }
  .dots { display: flex; gap: 8px; }
  .sw { width: 22px; height: 22px; border-radius: 50%; background: var(--c); box-shadow: inset 0 0 0 2px var(--bg); transition: transform 120ms var(--ease); }
  .sw.on { outline: 2px solid var(--c); outline-offset: 2px; }
  .go { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 16px 0 12px; border-radius: var(--r-key); background: var(--primary); color: var(--on-primary); font-weight: 600; font-size: 15px; }
  .go:disabled { opacity: .4; }

  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  li { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 22px; background: var(--glass-fill); box-shadow: var(--glass-edge); flex-wrap: wrap; }
  .tick { display: grid; place-items: center; flex: 0 0 auto; width: 40px; height: 40px; border-radius: 50%; color: transparent; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c) 55%, var(--line)); transition: background 150ms ease, color 150ms ease, transform 120ms var(--ease); }
  .tick :global(svg) { stroke-width: 2.6; }
  .tick.on { background: var(--c); color: #fff; box-shadow: none; }
  .tick:active { transform: scale(.92); }
  .body { flex: 1 1 120px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .hn { font-weight: 600; font-size: 16px; overflow-wrap: anywhere; }
  .hm { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font-family: var(--mono); font-size: 11.5px; }
  .wk { display: flex; gap: 4px; }
  .d { width: 26px; height: 26px; border-radius: 50%; font: 600 11px var(--mono); color: var(--muted); background: color-mix(in srgb, var(--ink) 7%, transparent); }
  .d.on { background: var(--c); color: #fff; }
  .d.today:not(.on) { box-shadow: inset 0 0 0 1.5px var(--c); color: var(--ink); }
  .del { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: var(--muted); }
  .del:hover { color: var(--ink); background: color-mix(in srgb, var(--ink) 8%, transparent); }
</style>
