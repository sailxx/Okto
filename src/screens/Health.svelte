<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { addDays } from '../lib/date';
  import { ratio } from '../lib/life';

  const day = $derived(store.healthOf(store.today));
  const s = $derived(store.data.settings);
  const week = $derived(Array.from({ length: 7 }, (_, i) => addDays(store.today, i - 6)).map((k) => ({ k, h: store.healthOf(k) })));
  const avgSleep = $derived.by(() => { const l = week.filter((x) => x.h.sleep > 0); return l.length ? Math.round(l.reduce((a, x) => a + x.h.sleep, 0) / l.length * 10) / 10 : 0; });
  const weekday = (k: string) => new Intl.DateTimeFormat(store.lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' }).format(new Date(`${k}T12:00:00`));

  /** Empty or invalid input clears the value. */
  const num = (v: string) => { const n = Number(v.replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : 0; };
</script>

<div class="page wide">
  <div class="page-head">
    <div>
      <h1 class="page-title">{store.t('navHealth')}</h1>
      <p class="page-sub">{store.t('hToday')}</p>
    </div>
  </div>

  <div class="grid">
    <section class="card water" style:--c="#0090ff">
      <h2><Icon name="drop" size={18} />{store.t('hWater')}</h2>
      <div class="big"><b>{day.water}</b><em>/ {s.waterGoal} {store.t('hGlasses')}</em></div>
      <div class="bar"><i style:width="{ratio(day.water, s.waterGoal) * 100}%"></i></div>
      <div class="btns">
        <button type="button" class="r" aria-label={store.t('hMinus')} disabled={!day.water} onclick={() => store.setHealth(store.today, { water: day.water - 1 })}><Icon name="minus" size={20} /></button>
        <button type="button" class="r p" aria-label={store.t('hPlus')} onclick={() => store.setHealth(store.today, { water: Math.min(99, day.water + 1) })}><Icon name="plus" size={20} /></button>
      </div>
    </section>

    <section class="card" style:--c="#8e4ec6">
      <h2><Icon name="moon" size={18} />{store.t('hSleep')}</h2>
      <div class="big"><input type="text" inputmode="decimal" placeholder="0" aria-label={store.t('hSleepPh')} value={day.sleep || ''} onchange={(e) => store.setHealth(store.today, { sleep: num(e.currentTarget.value) })} /><em>{store.t('hHours')} · {s.sleepGoal}</em></div>
      <div class="bar"><i style:width="{ratio(day.sleep, s.sleepGoal) * 100}%"></i></div>
      <p class="note">{avgSleep ? `${avgSleep} ${store.t('hHours')} · ${store.t('hWeekAvg')}` : ''}</p>
    </section>

    <section class="card" style:--c="#30a46c">
      <h2><Icon name="scale" size={18} />{store.t('hWeight')}</h2>
      <div class="big"><input type="text" inputmode="decimal" placeholder="0" aria-label={store.t('hWeightPh')} value={day.weight || ''} onchange={(e) => store.setHealth(store.today, { weight: num(e.currentTarget.value) })} /><em>{store.t('hKg')}</em></div>
    </section>
  </div>

  <h3 class="sub">{store.t('hLast7')}</h3>
  <div class="week">
    {#each week as { k, h }}
      <div class="col" class:today={k === store.today}>
        <span class="v">{h.water || ''}</span>
        <span class="tube"><i style:height="{ratio(h.water, s.waterGoal) * 100}%"></i></span>
        <span class="dn">{weekday(k)}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 18px; }
  .card { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; border-radius: 24px; background: var(--glass-fill); box-shadow: var(--glass-edge); }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; font-weight: 500; color: var(--muted); }
  h2 :global(svg) { color: var(--c); }
  .big { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
  .big b, .big input { font: 700 44px/1 var(--mono); letter-spacing: -.04em; color: var(--ink); }
  .big input { width: 3.2ch; min-width: 0; border: 0; background: none; outline: none; padding: 0; }
  .big input::placeholder { color: var(--muted); opacity: .5; }
  .big em { font-style: normal; color: var(--muted); font-size: 14px; }
  .bar { height: 8px; border-radius: 99px; background: color-mix(in srgb, var(--c) 16%, transparent); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: inherit; background: var(--c); transition: width 300ms var(--ease); }
  .btns { display: flex; gap: 10px; }
  .r { display: grid; place-items: center; width: 48px; height: 44px; border-radius: 16px; background: color-mix(in srgb, var(--ink) 8%, transparent); }
  .r.p { background: var(--c); color: #fff; }
  .r:disabled { opacity: .35; }
  .note { margin: 0; min-height: 1.2em; color: var(--muted); font-size: 13px; }
  .sub { margin: 26px 0 10px; font-size: 14px; font-weight: 500; color: var(--muted); }
  .week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; align-items: end; }
  .col { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .tube { display: flex; align-items: flex-end; width: 100%; max-width: 38px; height: 90px; border-radius: 12px; background: color-mix(in srgb, #0090ff 12%, transparent); overflow: hidden; }
  .tube i { display: block; width: 100%; background: #0090ff; border-radius: 12px; }
  .v { font: 600 12px var(--mono); color: var(--muted); min-height: 1em; }
  .dn { font: 500 11px var(--mono); color: var(--muted); text-transform: uppercase; }
  .today .dn { color: var(--ink); font-weight: 700; }
</style>
