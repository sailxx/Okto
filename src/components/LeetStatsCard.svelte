<script lang="ts">
  // Home card: LeetCode progress of the linked public profile — solved count by difficulty and an activity map like GitHub's.
  import Heatmap from './Heatmap.svelte';
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { cleanLeetUser, loadLeetStats, type LeetStats } from '../lib/leetstats';
  import { fmtShortDay } from '../lib/i18n';

  let { disabled = false }: { disabled?: boolean } = $props();
  const user = $derived(store.data.settings.leetcodeUser);
  let data = $state<LeetStats | null>(null);
  let status = $state<'idle' | 'loading' | 'error'>('idle');
  let sel = $state<string | null>(null);
  let draft = $state('');
  let bad = $state(false);

  async function load(force = false) {
    const u = user;
    data = null; sel = null;
    if (!u) { status = 'idle'; return; }
    status = 'loading';
    try { const d = await loadLeetStats(u, force); if (u === user) { data = d; status = 'idle'; } }
    catch { if (u === user) status = 'error'; }
  }
  $effect(() => { user; load(); });

  function link(e: Event) {
    e.preventDefault();
    const v = cleanLeetUser(draft);
    bad = !v;
    if (v) store.updateSettings({ leetcodeUser: v });
  }

  const year = $derived(data ? [...data.counts.values()].reduce((a, n) => a + n, 0) : 0);
</script>

<div class="lcs">
  {#if !user}
    <div class="hd"><span class="chip"><Icon name="code" size={15} /></span><span class="ttl">{store.t('bLeetStats')}</span></div>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <form class="link" onsubmit={link} onclick={(e) => e.stopPropagation()} onpointerdown={(e) => e.stopPropagation()}>
      <input type="text" bind:value={draft} {disabled} placeholder={store.t('lcUserPh')} autocapitalize="none" autocomplete="off" spellcheck="false" aria-invalid={bad} />
      <button type="submit" {disabled}>{store.t('ghLink')}</button>
    </form>
    <span class="meta">{bad ? store.t('lcBad') : store.t('lcStatHint')}</span>
  {:else if data}
    <span class="big">{sel ? `${fmtShortDay(store.lang, sel)} · ${data.counts.get(sel) ?? 0}` : store.t('lcYear')(year)}</span>
    <span class="meta">{user} · {data.solved} {store.t('lcSolved')}{data.total ? ` / ${data.total}` : ''}</span>
    <div class="map"><Heatmap counts={data.counts} label="LeetCode" bind:sel /></div>
  {:else if status === 'error'}
    <span class="meta">{store.t('ghFail')}</span>
    <button type="button" class="retry" {disabled} onclick={(e) => { e.stopPropagation(); load(true); }}>{store.t('ghRetry')}</button>
  {:else}
    <span class="meta">{store.t('ghLoading')}</span>
  {/if}
</div>

<style>
  .lcs { --hm-ink: #ffa116; --hm-bg: transparent; --hm-ghost: color-mix(in srgb, var(--t) 9%, transparent); --hm-dim: var(--td); --btn: var(--t); --btn-ink: var(--bg); width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  :global(.cell.acc) .lcs { --btn-ink: #1d1d1f; --hm-ink: #fff; --hm-ghost: rgb(255 255 255 / 20%); }
  .hd { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; }
  .chip { display: grid; place-items: center; flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%; background: color-mix(in srgb, var(--t) 8%, transparent); color: var(--td); }
  .chip :global(svg) { width: 15px; height: 15px; }
  .ttl { font-size: 12.5px; font-weight: 500; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .meta { font-size: 12px; color: var(--td); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .big { font-size: 16px; font-weight: 700; letter-spacing: -.01em; color: var(--t); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .map { flex: 1; min-height: 0; width: 100%; margin-top: 2px; overflow: hidden; }
  .meta { flex: none; }
  .link { display: flex; gap: 8px; width: 100%; max-width: 360px; margin-top: 6px; }
  .link input { flex: 1; min-width: 0; height: 38px; padding: 0 12px; border-radius: 12px; color: var(--t); background: color-mix(in srgb, var(--t) 8%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--t) 14%, transparent); }
  .link input::placeholder { color: var(--td); }
  .link input[aria-invalid='true'] { box-shadow: inset 0 0 0 1.5px #ff6b6b; }
  .link button, .retry { height: 38px; padding: 0 16px; border-radius: 12px; font-weight: 600; color: var(--btn-ink); background: var(--btn); }
  .retry { height: 32px; margin-top: 4px; }
  @container (max-height: 110px) { .map { display: none; } }
</style>
