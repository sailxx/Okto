<script lang="ts">
  import { store } from '../lib/store.svelte';
  import Icon from './Icon.svelte';

  // Keep the last message rendered while the toast fades out.
  let last = $state<typeof store.toastMsg>(null);
  $effect(() => { if (store.toastMsg) last = store.toastMsg; });
</script>

<!-- Styles live here, not in base/shell.css: the build may reorder those files,
     and a stray `top` next to `bottom` stretched the toast across the screen. -->
<div class="toast" class:visible={Boolean(store.toastMsg)} role="status" aria-live="polite">
  {#if last}
    {#key last.id}
      <div class="body" class:has-icon={last.icon} style:--ms="{last.ms}ms">
        {#if last.icon}<span class="badge" data-icon={last.icon}><Icon name={last.icon} size={16} /></span>{/if}
        <span class="text">{last.text}</span>
        {#if last.action}
          <button type="button" onclick={() => { last?.action?.(); store.toastMsg = null; }}>{last.label}</button>
        {/if}
        <i class="timer" aria-hidden="true"></i>
      </div>
    {/key}
  {/if}
</div>

<style>
  .toast {
    position: fixed; z-index: 30; left: 0; right: 0;
    bottom: calc(var(--tabbar) + env(safe-area-inset-bottom) + 96px);
    width: fit-content; max-width: min(440px, calc(100% - 32px)); margin-inline: auto;
    opacity: 0; transform: translateY(14px) scale(.94); pointer-events: none;
    transition: opacity 160ms ease, transform 200ms ease;
  }
  .toast.visible {
    opacity: 1; transform: none; pointer-events: auto;
    transition: opacity 200ms ease, transform 420ms cubic-bezier(.34, 1.56, .64, 1);
  }
  @media (min-width: 900px) {
    /* Centre over the page, not under the sidebar. */
    .toast { left: var(--side); bottom: 28px; max-width: min(440px, calc(100% - var(--side) - 32px)); }
  }

  .body {
    position: relative; overflow: hidden;
    display: flex; align-items: center; gap: 12px;
    min-height: 48px; padding: 8px 8px 8px 18px; border-radius: 16px;
    background: var(--ink); color: var(--bg);
    box-shadow: 0 1px 0 rgb(255 255 255 / 8%) inset, 0 14px 34px -12px rgb(0 0 0 / 55%), 0 3px 8px -2px rgb(0 0 0 / 25%);
    font-family: var(--sans); font-size: 15px; font-weight: 500; letter-spacing: -.005em;
  }
  .body.has-icon { padding-left: 10px; }
  .body:not(:has(button)) { padding-right: 18px; }

  .badge {
    display: grid; place-items: center; flex: 0 0 auto;
    width: 30px; height: 30px; border-radius: 50%;
    background: color-mix(in srgb, var(--bg) 16%, transparent);
    animation: badge-pop 480ms cubic-bezier(.34, 1.56, .64, 1) both;
  }
  .badge :global(svg) { stroke-width: 2.6; }
  .badge[data-icon='check'] :global(path) {
    stroke-dasharray: 24; stroke-dashoffset: 24;
    animation: draw 360ms 140ms cubic-bezier(.65, 0, .35, 1) forwards;
  }
  .text { min-width: 0; padding-block: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  button {
    flex: 0 0 auto; margin-left: 6px; padding: 0 14px; height: 34px; border-radius: 10px;
    color: var(--bg); font-family: var(--sans); font-size: 14px; font-weight: 600;
    background: color-mix(in srgb, var(--bg) 14%, transparent);
    transition: background-color 120ms ease, transform 120ms ease;
  }
  button:hover { background: color-mix(in srgb, var(--bg) 22%, transparent); }
  button:active { transform: scale(.95); }
  button:focus-visible { outline: 2px solid var(--bg); outline-offset: 2px; }

  /* Time left before the toast goes away (and undo with it). */
  .timer {
    position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
    background: color-mix(in srgb, var(--bg) 40%, transparent);
    transform-origin: left; animation: drain var(--ms) linear forwards;
  }

  @keyframes badge-pop { from { transform: scale(.4) rotate(-20deg); opacity: 0; } }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes drain { to { transform: scaleX(0); } }
</style>
