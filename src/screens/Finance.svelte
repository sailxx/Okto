<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { byCategory, fmtMoney, monthTotals, ratio } from '../lib/life';

  let kind = $state<'expense' | 'income'>('expense');
  let amount = $state('');
  let category = $state('');
  let note = $state('');

  const s = $derived(store.data.settings);
  const cur = $derived(store.t('fCurrency'));
  const fmt = (n: number) => `${fmtMoney(n, store.lang)} ${cur}`;
  const totals = $derived(monthTotals(store.money, store.today));
  const cats = $derived(byCategory(store.money, store.today));
  const left = $derived(s.budget - totals.spent);
  const month = $derived(new Intl.DateTimeFormat(store.lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' }).format(store.now));
  const dayLabel = (k: string) => new Intl.DateTimeFormat(store.lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' }).format(new Date(`${k}T12:00:00`));
  const value = (v: string) => { const n = Number(v.replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

  function add(e: SubmitEvent) {
    e.preventDefault();
    const n = value(amount);
    if (n <= 0) return;
    store.addMoney({ kind, amount: n, category: kind === 'expense' ? category : '', note: note.trim(), date: store.today });
    amount = ''; note = '';
  }
</script>

<div class="page wide">
  <div class="page-head">
    <div>
      <h1 class="page-title">{store.t('navFinance')}</h1>
      <p class="page-sub">{month}</p>
    </div>
  </div>

  <section class="sum">
    <span class="lbl">{store.t('fSpent')}</span>
    <b class="amt">{fmt(totals.spent)}</b>
    {#if s.budget > 0}
      <div class="bar" class:over={left < 0}><i style:width="{ratio(totals.spent, s.budget) * 100}%"></i></div>
      <span class="lbl">{left >= 0 ? store.t('fLeft') : store.t('fOver')}: {fmt(Math.abs(left))} · {store.t('fOfBudget')(fmt(s.budget))}</span>
    {/if}
    <span class="lbl">{store.t('fEarned')}: {fmt(totals.earned)}</span>
    <label class="bud">
      <span>{store.t('fBudget')}</span>
      <input type="text" inputmode="decimal" placeholder={store.t('fBudgetOff')} value={s.budget || ''} onchange={(e) => store.updateSettings({ budget: Math.max(0, Math.round(value(e.currentTarget.value))) })} />
    </label>
  </section>

  <form class="add" onsubmit={add}>
    <div class="seg" role="tablist">
      <button type="button" role="tab" aria-selected={kind === 'expense'} onclick={() => (kind = 'expense')}>{store.t('fExpense')}</button>
      <button type="button" role="tab" aria-selected={kind === 'income'} onclick={() => (kind = 'income')}>{store.t('fIncome')}</button>
    </div>
    <div class="row">
      <input class="n" type="text" inputmode="decimal" placeholder={store.t('fAmount')} aria-label={store.t('fAmount')} bind:value={amount} />
      <input class="t" type="text" placeholder={store.t('fNote')} aria-label={store.t('fNote')} maxlength="200" bind:value={note} />
      <button class="go" type="submit" disabled={value(amount) <= 0}><Icon name="plus" size={18} /><span>{store.t('fAdd')}</span></button>
    </div>
    {#if kind === 'expense'}
      <div class="chips">
        {#each store.t('fCats') as c}
          <button type="button" class="chip" class:on={category === c} onclick={() => (category = category === c ? '' : c)}>{c}</button>
        {/each}
      </div>
    {/if}
  </form>

  {#if cats.length}
    <h3 class="sub">{store.t('fByCat')}</h3>
    <ul class="cats">
      {#each cats as [c, n]}
        <li><span>{c || '—'}</span><div class="bar"><i style:width="{ratio(n, cats[0][1]) * 100}%"></i></div><b>{fmt(n)}</b></li>
      {/each}
    </ul>
  {/if}

  <h3 class="sub">{store.t('fHistory')}</h3>
  {#if store.money.length}
    <ul class="hist">
      {#each store.money.slice(0, 60) as m (m.id)}
        <li>
          <span class="dt">{dayLabel(m.date)}</span>
          <span class="nm">{m.note || m.category || (m.kind === 'income' ? store.t('fIncome') : store.t('fExpense'))}{#if m.note && m.category}<small>{m.category}</small>{/if}</span>
          <b class:inc={m.kind === 'income'}>{m.kind === 'income' ? '+' : '−'}{fmt(m.amount)}</b>
          <button type="button" class="del" aria-label={store.t('remove')} onclick={() => store.deleteMoney(m)}><Icon name="trash" size={16} /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="empty">
      <p class="hint label">{store.t('fEmpty')}</p>
      <p>{store.t('fEmptyHint')}</p>
    </div>
  {/if}
</div>

<style>
  .sum { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; padding: 18px 20px; border-radius: 26px; color: #fff; background: linear-gradient(150deg, #f08f8a, #d9534f); box-shadow: inset 0 1px 0 rgb(255 255 255 / 25%), 0 20px 34px -22px rgb(0 0 0 / 50%); }
  .lbl { font-size: 14px; color: rgb(255 255 255 / 82%); }
  .amt { font: 700 clamp(34px, 9vw, 52px)/1 var(--mono); letter-spacing: -.04em; }
  .bar { height: 8px; border-radius: 99px; background: rgb(255 255 255 / 25%); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: inherit; background: #fff; transition: width 300ms var(--ease); }
  .bud { display: flex; align-items: center; gap: 10px; margin-top: 4px; font-size: 14px; color: rgb(255 255 255 / 82%); }
  .bud input { width: 9ch; height: 34px; padding: 0 12px; border: 0; outline: none; border-radius: 12px; background: rgb(255 255 255 / 22%); color: #fff; font: 600 14px var(--mono); }
  .bud input::placeholder { color: rgb(255 255 255 / 70%); }

  .add { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
  .seg { display: inline-flex; align-self: flex-start; padding: 3px; border-radius: 14px; background: color-mix(in srgb, var(--ink) 7%, transparent); }
  .seg button { height: 34px; padding: 0 16px; border-radius: 11px; font-size: 14px; font-weight: 500; color: var(--muted); }
  .seg button[aria-selected='true'] { background: var(--bg); color: var(--ink); font-weight: 600; box-shadow: 0 1px 3px rgb(0 0 0 / 14%); }
  .row { display: flex; flex-wrap: wrap; gap: 10px; }
  .row input { height: 46px; padding: 0 16px; border-radius: 18px; border: 0; outline: none; background: var(--glass-fill); box-shadow: var(--glass-edge); font: inherit; font-size: 16px; color: var(--ink); min-width: 0; }
  .row .n { flex: 0 1 140px; font-family: var(--mono); font-weight: 600; }
  .row .t { flex: 1 1 180px; }
  .go { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 16px 0 12px; border-radius: var(--r-key); background: var(--primary); color: var(--on-primary); font-weight: 600; font-size: 15px; }
  .go:disabled { opacity: .4; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { height: 32px; padding: 0 14px; border-radius: 99px; font-size: 14px; color: var(--muted); background: color-mix(in srgb, var(--ink) 7%, transparent); }
  .chip.on { background: var(--ink); color: var(--bg); }

  .sub { margin: 26px 0 10px; font-size: 14px; font-weight: 500; color: var(--muted); }
  ul { list-style: none; margin: 0; padding: 0; }
  .cats { display: flex; flex-direction: column; gap: 10px; }
  .cats li { display: grid; grid-template-columns: 96px 1fr auto; align-items: center; gap: 12px; font-size: 14px; }
  .cats .bar { background: color-mix(in srgb, #d9534f 14%, transparent); }
  .cats .bar i { background: #d9534f; }
  .cats b { font: 600 13px var(--mono); }
  .hist { display: flex; flex-direction: column; border-radius: 22px; background: var(--glass-fill); box-shadow: var(--glass-edge); overflow: hidden; }
  .hist li { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-top: 1px solid var(--line); }
  .hist li:first-child { border-top: 0; }
  .dt { flex: 0 0 56px; font: 500 12px var(--mono); color: var(--muted); }
  .nm { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow-wrap: anywhere; }
  .nm small { color: var(--muted); font-size: 12px; }
  .hist b { font: 600 14px var(--mono); white-space: nowrap; }
  .hist b.inc { color: #30a46c; }
  .del { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; color: var(--muted); }
  .del:hover { color: var(--ink); background: color-mix(in srgb, var(--ink) 8%, transparent); }
</style>
