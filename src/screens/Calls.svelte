<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { addDays, fromMin, minutesNow, toMin } from '../lib/date';
  import { relDay } from '../lib/i18n';
  import { instancesInRange, type Instance } from '../lib/recurrence';

  type Item = Instance & { from: number; to: number };

  const calls = $derived(store.tasks.filter((t) => t.kind === 'call'));
  const now = $derived(minutesNow(store.now));
  const dayLabel = (k: string) => relDay(store.lang, k, store.today, addDays(store.today, 1), addDays(store.today, -1));
  const host = (link: string) => { try { return new URL(link).host.replace(/^www\./, ''); } catch { return ''; } };

  function items(from: string, to: string): Item[] {
    return instancesInRange(calls, from, to)
      .map((i) => { const s = i.task.start ? toMin(i.task.start) : -1; return { ...i, from: s, to: s < 0 ? -1 : s + i.task.duration }; })
      .sort((a, b) => a.date.localeCompare(b.date) || a.from - b.from);
  }
  const isPast = (i: Item) => i.date < store.today || (i.date === store.today && i.to >= 0 && i.to <= now);
  const isLive = (i: Item) => i.date === store.today && i.from >= 0 && i.from <= now && now < i.to;

  const ahead = $derived(items(store.today, addDays(store.today, 30)).filter((i) => !isPast(i)));
  const live = $derived(ahead.filter(isLive));
  const hero = $derived(live[0] ?? ahead[0] ?? null);
  const rest = $derived(ahead.filter((i) => i !== hero));
  const groups = $derived.by(() => {
    const map = new Map<string, Item[]>();
    for (const i of rest) map.set(i.date, [...(map.get(i.date) ?? []), i]);
    return [...map.entries()];
  });
  const undated = $derived(calls.filter((t) => !t.date));
  const past = $derived(items(addDays(store.today, -14), store.today).filter(isPast).reverse().slice(0, 20));
  const todayCount = $derived(items(store.today, store.today).length);
  let showPast = $state(false);

  const when = (i: Item) => (i.from < 0 ? '' : `${fromMin(i.from)}–${fromMin(i.to)}`);
</script>

{#snippet join(link: string, big = false)}
  {#if link}
    <a class="join" class:big href={link} target="_blank" rel="noopener noreferrer" onclick={(e) => e.stopPropagation()}>
      <Icon name="call" size={big ? 20 : 17} /><span>{store.t('join')}</span>
    </a>
  {/if}
{/snippet}

{#snippet row(i: Item, dim = false)}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="call" class:dim style:--c={store.colorOf(i.task)} onclick={() => store.openTask(i.task, i.date)}>
    <span class="time">
      {#if i.from >= 0}<b>{fromMin(i.from)}</b><small>{fromMin(i.to)}</small>{:else}<b>—</b>{/if}
    </span>
    <span class="body">
      <span class="title">{i.task.title || '—'}</span>
      <span class="meta">
        {#if store.listOf(i.task)}<span class="lst">{store.listOf(i.task)?.name}</span>{/if}
        {#if i.task.link}<span class="host"><Icon name="link" size={13} />{host(i.task.link)}</span>{/if}
        {#if i.task.repeat}<span class="ic"><Icon name="repeat" size={13} /></span>{/if}
        {#if !dim && i.date === store.today && i.from > now}<span class="soon">{store.t('callIn')(i.from - now)}</span>{/if}
      </span>
    </span>
    {#if !dim}{@render join(i.task.link)}{/if}
  </div>
{/snippet}

<div class="page wide">
  <div class="page-head">
    <div>
      <h1 class="page-title">{store.t('calls')}</h1>
      <p class="page-sub">{store.t('callsToday')(todayCount)}</p>
    </div>
    <button type="button" class="add-call" onclick={() => store.openNewCall()}><Icon name="plus" size={18} /><span>{store.t('newCall')}</span></button>
  </div>

  {#if hero}
    {@const on = isLive(hero)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <section class="hero" class:on style:--c={store.colorOf(hero.task)} onclick={() => store.openTask(hero.task, hero.date)}>
      <span class="label">
        {#if on}<i class="pulse" aria-hidden="true"></i>{store.t('callNow')} · {store.t('callLeft')(hero.to - now)}
        {:else}{store.t('callNext')} · {dayLabel(hero.date)}{#if hero.date === store.today && hero.from > now} · {store.t('callIn')(hero.from - now)}{/if}{/if}
      </span>
      <div class="hero-main">
        <span class="hero-time">{hero.from >= 0 ? fromMin(hero.from) : '--:--'}</span>
        <span class="hero-body">
          <b>{hero.task.title || '—'}</b>
          <small>{when(hero)}{#if hero.task.link}{' · '}{host(hero.task.link)}{/if}</small>
        </span>
      </div>
      {#if on}<span class="bar" aria-hidden="true"><i style:width="{((now - hero.from) / (hero.to - hero.from)) * 100}%"></i></span>{/if}
      {#if hero.task.link}{@render join(hero.task.link, true)}{/if}
    </section>
  {/if}

  {#if !hero && !undated.length}
    <div class="empty">
      <p class="hint">{store.t('callsEmpty')}</p>
      <p>{store.t('callsEmptyHint')}</p>
    </div>
  {/if}

  {#each groups as [day, list] (day)}
    <section class="group-sec">
      <h2 class="label">{dayLabel(day)}</h2>
      {#each list as i (i.task.id + i.date)}{@render row(i)}{/each}
    </section>
  {/each}

  {#if undated.length}
    <section class="group-sec">
      <h2 class="label">{store.t('fNoDate')}</h2>
      {#each undated as t (t.id)}{@render row({ task: t, date: '', from: -1, to: -1 })}{/each}
    </section>
  {/if}

  {#if past.length}
    <section class="group-sec">
      <button type="button" class="label past-toggle" aria-expanded={showPast} onclick={() => (showPast = !showPast)}>
        {store.t('callsPast')} · {past.length} <span aria-hidden="true">{showPast ? '▴' : '▾'}</span>
      </button>
      {#if showPast}
        {#each past as i (i.task.id + i.date)}
          <div class="past-row"><span class="pd">{dayLabel(i.date)}</span>{@render row(i, true)}</div>
        {/each}
      {/if}
    </section>
  {/if}
</div>

<style>
  .add-call {
    display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto;
    height: 44px; padding: 0 16px 0 12px; border-radius: var(--r-key);
    background: var(--primary); color: var(--on-primary); font-weight: 600; font-size: 15px;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 25%), 0 2px 0 var(--key-edge);
    transition: transform 90ms var(--ease), filter 150ms ease;
  }
  .add-call:hover { filter: brightness(1.08); }
  .add-call:active { transform: translateY(2px); }
  .add-call :global(svg) { stroke-width: 2.4; }

  /* The next (or current) call, as the display well */
  .hero {
    position: relative; display: flex; flex-direction: column; gap: 14px; margin-top: 20px; padding: 18px 20px;
    border-radius: 14px; background: var(--well); color: var(--well-ink); cursor: pointer;
    box-shadow: inset 0 0 0 1px var(--well-edge);
  }
  .hero.on { box-shadow: inset 0 0 0 2px var(--primary); }
  .hero .label { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--well-dim); }
  .pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--red); animation: pulse 1.4s ease-in-out infinite; }
  @keyframes pulse { 50% { opacity: .3; } }
  .hero-main { display: flex; align-items: flex-end; gap: 18px; min-width: 0; }
  .hero-time { font-family: var(--mono); font-size: clamp(44px, 11vw, 72px); font-weight: 700; letter-spacing: -.04em; line-height: .9; font-variant-numeric: tabular-nums; }
  .hero-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding-bottom: 4px; }
  .hero-body b { font-size: clamp(18px, 4.5vw, 24px); font-weight: 700; letter-spacing: -.015em; line-height: 1.2; overflow-wrap: anywhere; }
  .hero-body small { font-family: var(--mono); font-size: 12px; color: var(--well-dim); }
  .bar { display: block; height: 3px; border-radius: 2px; background: var(--well-ghost); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--primary); }
  .join {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px; flex: 0 0 auto;
    height: 38px; padding: 0 14px; border-radius: 10px;
    background: var(--primary); color: var(--on-primary); text-decoration: none; font-weight: 600; font-size: 14px;
    transition: filter 150ms ease;
  }
  .join:hover { filter: brightness(1.1); }
  .join.big { align-self: flex-start; height: 46px; padding: 0 20px; font-size: 16px; }

  .group-sec { display: flex; flex-direction: column; gap: 8px; margin-top: 24px; }
  .group-sec .label { margin: 0 0 2px 2px; }
  .call {
    position: relative; display: flex; align-items: center; gap: 16px; padding: 14px 16px 14px 20px;
    border-radius: 12px; background: var(--soft); box-shadow: inset 0 0 0 1px var(--line); cursor: pointer; overflow: hidden;
  }
  .call::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--c); }
  .call:hover { box-shadow: inset 0 0 0 1px var(--muted); }
  .call.dim { opacity: .6; }
  .time { display: flex; flex-direction: column; align-items: flex-start; flex: 0 0 56px; font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .time b { font-size: 19px; font-weight: 700; letter-spacing: -.02em; }
  .time small { font-size: 12px; color: var(--muted); }
  .body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
  .title { font-size: 18px; font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; color: var(--muted); font-size: 13px; font-weight: 500; }
  .lst { display: inline-flex; align-items: center; gap: 6px; }
  .lst::before { content: ''; width: 7px; height: 7px; border-radius: 2px; background: var(--c); }
  .host, .ic { display: inline-flex; align-items: center; gap: 4px; font-family: var(--mono); font-size: 12px; }
  .soon { color: var(--ink); font-family: var(--mono); font-size: 12px; }
  .past-toggle { align-self: flex-start; text-align: left; }
  .past-toggle:hover { color: var(--ink); }
  .past-row { display: flex; flex-direction: column; gap: 4px; }
  .pd { margin-left: 2px; font-family: var(--mono); font-size: 11px; color: var(--muted); }
  @media (max-width: 480px) {
    .call { flex-wrap: wrap; }
    .call .join { margin-left: 72px; }
  }
</style>
