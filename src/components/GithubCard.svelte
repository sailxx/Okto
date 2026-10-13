<script lang="ts">
  // Home card: GitHub contribution graph of the linked public profile (read-only, drawn with the activity map).
  import Heatmap from './Heatmap.svelte';
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { cleanLogin, loadContributions, type Contributions } from '../lib/github';
  import { fmtShortDay } from '../lib/i18n';

  /** `look`: the card's colour — the default dark one, a custom tint, or plain (theme surface). */
  let { disabled = false, look = 'dark' }: { disabled?: boolean; look?: 'dark' | 'tint' | 'plain' } = $props();
  const user = $derived(store.data.settings.github);
  let data = $state<Contributions | null>(null);
  let status = $state<'idle' | 'loading' | 'error'>('idle');
  let sel = $state<string | null>(null);
  let draft = $state('');
  let bad = $state(false);

  async function load(force = false) {
    const u = user;
    data = null; sel = null;
    if (!u) { status = 'idle'; return; }
    status = 'loading';
    try { const d = await loadContributions(u, force); if (u === user) { data = d; status = 'idle'; } }
    catch { if (u === user) status = 'error'; }
  }
  $effect(() => { user; load(); });

  function link(e: Event) {
    e.preventDefault();
    const v = cleanLogin(draft);
    bad = !v;
    if (v) store.updateSettings({ github: v });
  }
</script>

<div class="gh {look}">
  <div class="top">
    <span class="chip"><Icon name="github" size={17} /></span>
    <span class="ttl">{user || store.t('bGithub')}</span>
  </div>

  {#if !user}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <form class="link" onsubmit={link} onclick={(e) => e.stopPropagation()} onpointerdown={(e) => e.stopPropagation()}>
      <input type="text" bind:value={draft} {disabled} placeholder={store.t('ghUserPh')} autocapitalize="none" autocomplete="off" spellcheck="false" aria-invalid={bad} />
      <button type="submit" {disabled}>{store.t('ghLink')}</button>
    </form>
    <span class="meta">{bad ? store.t('ghBad') : store.t('ghHint')}</span>
  {:else if data}
    <span class="meta">{sel ? `${fmtShortDay(store.lang, sel)} · ${data.counts.get(sel) ?? 0}` : store.t('ghTotal')(data.total)}</span>
    <div class="map"><Heatmap counts={data.counts} label={store.t('bGithub')} bind:sel /></div>
  {:else if status === 'error'}
    <span class="meta">{store.t('ghFail')}</span>
    <button type="button" class="retry" {disabled} onclick={(e) => { e.stopPropagation(); load(true); }}>{store.t('ghRetry')}</button>
  {:else}
    <span class="meta">{store.t('ghLoading')}</span>
  {/if}
</div>

<style>
  .dark { --hm-ink: #3fb950; --hm-ghost: rgb(255 255 255 / 7%); --hm-dim: rgb(255 255 255 / 62%); --hm-bg: #0d1117; --btn: #3fb950; --btn-ink: #0d1117; }
  .tint { --hm-ink: #fff; --hm-ghost: rgb(255 255 255 / 20%); --hm-dim: rgb(255 255 255 / 78%); --hm-bg: transparent; --btn: #fff; --btn-ink: #1d1d1f; }
  .plain { --btn: var(--ink); --btn-ink: var(--bg); }
  .gh { width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .top { display: flex; align-items: center; gap: 10px; max-width: 100%; }
  .chip { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; flex: 0 0 auto; background: var(--tg); color: var(--t); }
  .chip :global(svg) { stroke-width: 2; }
  .ttl { font-size: 14px; font-weight: 500; color: var(--td); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .meta { font-size: 13px; color: var(--td); max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .top + .meta:not(:last-child) { white-space: nowrap; }
  .map { flex: 1; min-height: 0; width: 100%; margin-top: 4px; }
  .link { display: flex; gap: 8px; width: 100%; max-width: 360px; margin-top: 6px; }
  .link input { flex: 1; min-width: 0; height: 38px; padding: 0 12px; border-radius: 12px; color: var(--t); background: color-mix(in srgb, var(--t) 10%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--t) 16%, transparent); }
  .link input::placeholder { color: var(--td); }
  .link input[aria-invalid='true'] { box-shadow: inset 0 0 0 1.5px #ff6b6b; }
  .link button, .retry { height: 38px; padding: 0 16px; border-radius: 12px; font-weight: 600; color: var(--btn-ink); background: var(--btn); }
  .retry { height: 32px; margin-top: 4px; }
</style>
