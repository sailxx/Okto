<script lang="ts">
  // Interactive single-series bars inside a display well. Hover, touch-drag or arrow keys
  // pick a day; the parent shows that day's value in its big digits (bindable `sel`).
  import { store } from '../lib/store.svelte';
  import { fmtWeekdayNarrow } from '../lib/i18n';

  let { days, values, sel = $bindable(null), label }: {
    days: string[]; values: number[]; sel?: number | null; label: string;
  } = $props();

  const max = $derived(Math.max(1, ...values));
  let box: HTMLDivElement;

  function pick(clientX: number) {
    const r = box.getBoundingClientRect();
    const i = Math.floor(((clientX - r.left) / r.width) * days.length);
    sel = Math.max(0, Math.min(days.length - 1, i));
  }
  function key(e: KeyboardEvent) {
    const last = days.length - 1;
    if (e.key === 'ArrowLeft') sel = Math.max(0, (sel ?? last + 1) - 1);
    else if (e.key === 'ArrowRight') sel = Math.min(last, (sel ?? last - 1) + 1);
    else if (e.key === 'Escape') sel = null;
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_click_events_have_key_events -->
<div
  class="scrub" bind:this={box} tabindex="0" role="slider" aria-label={label}
  aria-valuemin={0} aria-valuemax={days.length - 1} aria-valuenow={sel ?? days.length - 1}
  aria-valuetext="{days[sel ?? days.length - 1]}: {values[sel ?? days.length - 1]}"
  style:--n={days.length}
  onpointermove={(e) => pick(e.clientX)}
  onpointerdown={(e) => { e.stopPropagation(); pick(e.clientX); }}
  onpointerleave={(e) => { if (e.pointerType === 'mouse') sel = null; }}
  onclick={(e) => e.stopPropagation()}
  onkeydown={key}
  onblur={() => (sel = null)}
>
  {#each days as d, i (d)}
    <div class="col" class:today={d === store.today} class:on={sel === i}>
      <i style:height="{values[i] ? Math.max(6, (values[i] / max) * 100) : 0}%"></i>
      <span>{fmtWeekdayNarrow(store.lang, d)}</span>
    </div>
  {/each}
</div>

<style>
  .scrub {
    display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 3px;
    height: 100%; min-height: 64px; cursor: crosshair; touch-action: pan-y;
    border-radius: 4px; outline-offset: 4px;
  }
  .col { position: relative; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; min-width: 0; }
  .col i {
    width: 100%; max-width: 22px; border-radius: 2px 2px 0 0;
    background: color-mix(in srgb, var(--well-ink) 28%, transparent);
    box-shadow: 0 1px 0 var(--well-ghost);
    transition: background-color 120ms ease;
  }
  .col.today i { background: var(--well-ink); }
  .col.on i { background: var(--well-ink); outline: 1px solid var(--well-ink); outline-offset: 2px; }
  .col::after { content: ''; position: absolute; left: 0; right: 0; bottom: 18px; height: 1px; background: var(--well-ghost); }
  .col span { height: 14px; font-family: var(--mono); font-size: 10px; letter-spacing: .04em; color: var(--well-dim); text-transform: uppercase; }
  .col.today span, .col.on span { color: var(--well-ink); }
</style>
