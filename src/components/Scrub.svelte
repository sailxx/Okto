<script lang="ts">
  // Interactive single-series bars inside a display well. Hover, touch-drag or arrow keys
  // pick a day; the parent shows that day's value in its big digits (bindable `sel`).
  import { store } from '../lib/store.svelte';
  import { fmtWeekdayNarrow } from '../lib/i18n';
  import { fromKey } from '../lib/date';

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
    {@const r = values[i] ? Math.max(0.06, values[i] / max) : 0}
    <div class="col" class:today={d === store.today} class:on={sel === i} style:--r={r}>
      <div class="track">
        <i></i>
        {#if values[i]}<b>{values[i]}</b>{/if}
      </div>
      <span class="day">{fromKey(d).getDate()}</span>
      <span class="wd">{fmtWeekdayNarrow(store.lang, d)}</span>
    </div>
  {/each}
</div>

<style>
  .scrub {
    display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 3px;
    height: 100%; min-height: 72px; cursor: crosshair; touch-action: pan-y;
    border-radius: 4px; outline-offset: 4px;
  }
  .col { display: flex; flex-direction: column; align-items: center; min-width: 0; }
  /* The bar leaves room above it for its value. */
  .track { position: relative; flex: 1; width: 100%; min-height: 0; border-bottom: 1px solid var(--well-ghost); }
  .track i {
    position: absolute; left: 50%; bottom: 0; transform: translateX(-50%);
    width: 100%; max-width: 22px; height: calc((100% - 15px) * var(--r)); border-radius: 2px 2px 0 0;
    background: color-mix(in srgb, var(--well-ink) 45%, transparent);
    transition: background-color 120ms ease;
  }
  .track b {
    position: absolute; left: -2px; right: -2px; bottom: calc((100% - 15px) * var(--r) + 2px);
    font-family: var(--mono); font-size: 11px; font-weight: 600; line-height: 13px; text-align: center;
    font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--well-dim);
  }
  .col.today i, .col.on i { background: var(--well-ink); }
  .col.on i { outline: 1px solid var(--well-ink); outline-offset: 2px; }
  .col.today b, .col.on b { color: var(--well-ink); }
  .day, .wd { font-family: var(--mono); line-height: 1; font-variant-numeric: tabular-nums; color: var(--well-dim); }
  .day { margin-top: 5px; font-size: 11px; font-weight: 600; }
  .wd { margin-top: 3px; font-size: 9px; letter-spacing: .04em; text-transform: uppercase; opacity: .8; }
  .col.today .day, .col.on .day, .col.today .wd, .col.on .wd { color: var(--well-ink); opacity: 1; }
  .col.today .day { text-decoration: underline; text-underline-offset: 3px; }
</style>
