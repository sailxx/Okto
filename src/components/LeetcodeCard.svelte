<script lang="ts">
  // Home card: LeetCode streak and today's problem from the "LeetCode" plan list (plain tasks, so reminders and sync come for free).
  import Digits from './Digits.svelte';
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { activeDays, bestStreak, streak } from '../lib/stats';
  import { currentProblem, leetcodeTasks } from '../lib/leetcode';

  let { disabled = false, index = 0 }: { disabled?: boolean; index?: number } = $props();
  const plan = $derived(leetcodeTasks(store.tasks));
  const run = $derived(streak(plan, [], store.today));
  const best = $derived(bestStreak(activeDays(plan, [])));
  const solved = $derived(plan.filter((t) => t.done).length);
  const cur = $derived(currentProblem(plan));
  const SEGS = 8;
  const lit = $derived(plan.length ? Math.round((solved / plan.length) * SEGS) : 0);
</script>

<div class="lc">
  <div class="top">
    <span class="chip"><Icon name="flame" size={17} /></span>
    <span class="ttl">{store.t('bLeetcode')}</span>
  </div>

  {#if !plan.length}
    <span class="meta">{store.t('lcHint')}</span>
    <button type="button" class="add" {disabled}
      onclick={(e) => { e.stopPropagation(); store.toast(store.t('lcAdded')(store.addLeetcodePlan())); }}>{store.t('lcAdd')}</button>
  {:else}
    <span class="read"><Digits class="big" text={String(run)} delay={index * 90} /><em>{store.t('streakDays')(run)}</em></span>
    <span class="segs" aria-hidden="true">{#each Array(SEGS) as _, k}<i class:on={k < lit}></i>{/each}</span>
    <span class="meta">{store.t('lcProgress')(solved, plan.length)} · {store.t('bestStreak')(best)}</span>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="cur" onclick={(e) => e.stopPropagation()}>
      {#if cur}
        <button type="button" class="ck" aria-label={store.t('taskDone')} aria-pressed={cur.done} {disabled} onclick={() => store.toggleDone(cur, null)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ring" cx="12" cy="12" r="10" /></svg>
        </button>
        <button type="button" class="tn" {disabled} onclick={() => store.openTask(cur)}>{cur.title}</button>
      {:else}
        <span class="tn all">{store.t('lcAllDone')}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .lc { width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .top { display: flex; align-items: center; gap: 10px; max-width: 100%; }
  .chip { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; flex: 0 0 auto; background: var(--tg); color: var(--t); }
  .chip :global(svg) { stroke-width: 2; }
  .ttl { font-size: 14px; font-weight: 500; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .read { display: flex; align-items: baseline; gap: 8px; min-width: 0; margin-top: auto; }
  .read :global(.big) { font-size: clamp(30px, min(17cqi, 30cqh), 56px); font-weight: 700; letter-spacing: -.04em; line-height: .95; }
  .read em { font-style: normal; font-size: 14px; font-weight: 500; color: var(--td); white-space: nowrap; }
  .meta { font-size: 13px; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .segs { display: flex; gap: 4px; width: 100%; max-width: 160px; height: 4px; margin: 4px 0 2px; }
  .segs i { flex: 1; border-radius: 3px; background: var(--tg); transition: background-color 300ms ease; }
  .segs i.on { background: var(--t); }
  .add { height: 36px; margin-top: auto; padding: 0 16px; border-radius: 12px; font-weight: 600; background: #fff; color: #1d1d1f; }
  .cur { display: none; align-items: center; gap: 10px; width: 100%; min-height: 40px; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--tg); }
  @container (min-height: 170px) { .cur { display: flex; } }
  .ck { flex: 0 0 auto; width: 24px; height: 24px; padding: 0; color: var(--t); transition: transform 120ms ease; }
  .ck:active { transform: scale(.88); }
  .ck svg { display: block; width: 100%; height: 100%; overflow: visible; }
  .ring { fill: none; stroke: currentColor; stroke-width: 2.2; }
  .tn { flex: 1; min-width: 0; font-size: 15px; font-weight: 500; text-align: left; color: var(--t); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tn:hover:not(.all) { text-decoration: underline; text-decoration-color: var(--td); text-underline-offset: 3px; }
  .all { color: var(--td); }
  @container (max-height: 120px) { .ttl, .meta, .segs { display: none; } }
</style>
