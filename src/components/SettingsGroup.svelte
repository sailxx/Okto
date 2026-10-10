<script lang="ts" module>
  /* Which groups are open survives closing and reopening Settings. */
  const openIds = $state<Record<string, boolean>>({});
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  let { id, icon, title, summary = '', children }: { id: string; icon: string; title: string; summary?: string; children: Snippet } = $props();
  const open = $derived(openIds[id] === true);
</script>

<section class="sg" class:open>
  <button type="button" class="head" aria-expanded={open} aria-controls="sg-{id}" onclick={() => (openIds[id] = !open)}>
    <span class="chip"><Icon name={icon} size={17} /></span>
    <span class="txt"><b>{title}</b>{#if summary}<small>{summary}</small>{/if}</span>
    <span class="chev" aria-hidden="true"><Icon name="right" size={18} /></span>
  </button>
  <div class="body" id="sg-{id}" inert={!open}>
    <div class="inner">{@render children()}</div>
  </div>
</section>

<style>
  .sg { margin-bottom: 10px; border-radius: 20px; background: color-mix(in srgb, var(--soft) 78%, var(--bg)); box-shadow: inset 0 0 0 1px var(--line); overflow: hidden; }
  .head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; text-align: left; }
  .chip { display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%; background: color-mix(in srgb, var(--ink) 8%, transparent); color: var(--ink); }
  .chip :global(svg) { stroke-width: 2; }
  .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .txt b { font-size: 16px; font-weight: 600; }
  .txt small { color: var(--muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chev { color: var(--muted); display: grid; transition: transform 240ms var(--ease); }
  .open .chev { transform: rotate(90deg); }
  .body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 260ms var(--ease); }
  .open .body { grid-template-rows: 1fr; }
  .inner { min-height: 0; overflow: hidden; padding: 0 16px; }
  .open .inner { padding: 4px 16px 16px; }
  .inner :global(.sub:first-child) { margin-top: 2px; }
  @media (prefers-reduced-motion: reduce) { .body, .chev { transition: none; } }
</style>
