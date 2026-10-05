<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from '../lib/store.svelte';
  import { fromMin, minutesNow, toMin } from '../lib/date';
  import { fmtWeekdayShort } from '../lib/i18n';
  import { layoutDay } from '../lib/layout';
  import { instancesInRange, isDoneOn, type Instance } from '../lib/recurrence';
  import { buzz } from '../lib/alerts';
  import type { Task } from '../lib/model';

  let { days, tasks, onmove, onday }: {
    days: string[];
    tasks: Task[];
    onmove: (inst: Instance, patch: Partial<Task>) => void;
    onday?: (key: string) => void;
  } = $props();

  const H = 52; // px per hour
  const SNAP = 15;
  let scroller: HTMLDivElement;
  let cols: HTMLDivElement[] = $state([]);

  const insts = $derived(instancesInRange(tasks, days[0], days[days.length - 1]));
  const timed = $derived(insts.filter((i) => i.task.start));
  const allDay = $derived(insts.filter((i) => !i.task.start));
  const hasAllDay = $derived(allDay.length > 0);
  const nowMin = $derived(minutesNow(store.now));

  function dayItems(day: string) {
    const items = timed.filter((i) => i.date === day);
    const lay = layoutDay(items.map((i) => {
      const s = toMin(i.task.start!);
      return { id: i.task.id, start: s, end: s + Math.max(i.task.duration, 20) };
    }));
    return items.map((i) => ({ inst: i, ...lay[i.task.id] }));
  }

  /* ---------- drag & resize ---------- */
  type Drag = {
    inst: Instance; mode: 'move' | 'resize'; active: boolean; touch: boolean;
    x0: number; y0: number; start0: number; dur0: number; day0: number;
    day: number; start: number; dur: number; timer?: ReturnType<typeof setTimeout>;
  };
  let drag = $state<Drag | null>(null);
  let justDragged = false;

  function pointerDown(e: PointerEvent, inst: Instance, mode: 'move' | 'resize') {
    if (e.button !== 0) return;
    e.stopPropagation();
    const start = toMin(inst.task.start!);
    const d: Drag = {
      inst, mode, active: false, touch: e.pointerType !== 'mouse',
      x0: e.clientX, y0: e.clientY, start0: start, dur0: inst.task.duration,
      day0: days.indexOf(inst.date), day: days.indexOf(inst.date), start, dur: inst.task.duration,
    };
    if (d.touch) d.timer = setTimeout(() => { if (drag && drag.x0 === d.x0 && drag.y0 === d.y0) { drag.active = true; buzz(10); } }, 380);
    drag = d;
  }

  function pointerMove(e: PointerEvent) {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.active) {
      if (drag.touch) { if (Math.hypot(dx, dy) > 8) { clearTimeout(drag.timer); drag = null; } return; }
      if (Math.hypot(dx, dy) < 4) return;
      drag.active = true;
    }
    const deltaMin = Math.round((dy / H) * 60 / SNAP) * SNAP;
    if (drag.mode === 'resize') {
      drag.dur = Math.max(SNAP, Math.min(24 * 60 - drag.start0, drag.dur0 + deltaMin));
    } else {
      drag.start = Math.max(0, Math.min(24 * 60 - SNAP, drag.start0 + deltaMin));
      const idx = cols.findIndex((c) => { const r = c?.getBoundingClientRect(); return r && e.clientX >= r.left && e.clientX < r.right; });
      if (idx !== -1) drag.day = idx;
    }
  }

  function pointerUp() {
    if (!drag) return;
    clearTimeout(drag.timer);
    const d = drag;
    drag = null;
    if (!d.active) return;
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 0);
    const changed = d.mode === 'resize' ? d.dur !== d.dur0 : d.start !== d.start0 || d.day !== d.day0;
    if (!changed) return;
    onmove(d.inst, d.mode === 'resize' ? { duration: d.dur } : { date: days[d.day], start: fromMin(d.start) });
  }

  function openBlock(inst: Instance) {
    if (justDragged) return;
    store.openTask(inst.task, inst.date);
  }

  function createAt(e: MouseEvent, day: string) {
    if (justDragged || drag) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const min = Math.floor(((e.clientY - rect.top) / H) * 60 / 30) * 30;
    store.openNewTask({ date: day, start: fromMin(Math.min(min, 23 * 60 + 30)), duration: 60 });
  }

  onMount(() => {
    const today = days.includes(store.today);
    scroller.scrollTop = Math.max(0, ((today ? nowMin / 60 : 8) - 1.5) * H);
    // Long-press drag on touch must stop the page from scrolling.
    const stopScroll = (e: TouchEvent) => { if (drag?.active) e.preventDefault(); };
    scroller.addEventListener('touchmove', stopScroll, { passive: false });
    return () => scroller.removeEventListener('touchmove', stopScroll);
  });

  const hours = Array.from({ length: 24 }, (_, h) => h);
  const color = (t: Task) => store.colorOf(t);
</script>

<svelte:window onpointermove={pointerMove} onpointerup={pointerUp} onpointercancel={pointerUp} />

<div class="tg" style:--cols={days.length} style:--h="{H}px">
  {#if days.length > 1}
    <div class="tg-head">
      <span class="gutter"></span>
      {#each days as d}
        <button type="button" class="dh" class:today={d === store.today} onclick={() => onday?.(d)}>
          <span>{fmtWeekdayShort(store.lang, d)}</span><b>{Number(d.slice(8))}</b>
        </button>
      {/each}
    </div>
  {/if}

  {#if hasAllDay}
    <div class="allday">
      <span class="gutter lbl">{store.t('allDay')}</span>
      {#each days as d}
        <div class="ad-col">
          {#each allDay.filter((i) => i.date === d) as i (i.task.id)}
            <button type="button" class="ad" class:done={isDoneOn(i.task, i.date)} style:--c={color(i.task)} onclick={() => openBlock(i)}>{i.task.title}</button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}

  <div class="scroll" bind:this={scroller}>
    <div class="grid" style:height="{24 * H}px">
      <div class="gutter hours">
        {#each hours as h}{#if h}<span style:top="{h * H}px">{String(h).padStart(2, '0')}:00</span>{/if}{/each}
      </div>
      {#each days as d, di (d)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="col" class:today={d === store.today} bind:this={cols[di]} onclick={(e) => createAt(e, d)}>
          {#each dayItems(d) as b (b.inst.task.id)}
            {@const moving = drag?.active && drag.inst.task.id === b.inst.task.id && drag.inst.date === d}
            {#if !moving}
              {@const start = toMin(b.inst.task.start!)}
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
              <div
                class="ev" class:done={isDoneOn(b.inst.task, b.inst.date)}
                style:--c={color(b.inst.task)}
                style:top="{(start / 60) * H}px"
                style:height="{Math.max((b.inst.task.duration / 60) * H - 2, 20)}px"
                style:left="calc({(b.col / b.cols) * 100}% + 1px)"
                style:width="calc({100 / b.cols}% - 3px)"
                onpointerdown={(e) => pointerDown(e, b.inst, 'move')}
                onclick={(e) => { e.stopPropagation(); openBlock(b.inst); }}
              >
                <b>{b.inst.task.title}</b>
                {#if b.inst.task.duration >= 40}<span>{b.inst.task.start}–{fromMin(start + b.inst.task.duration)}</span>{/if}
                <i class="grip" onpointerdown={(e) => pointerDown(e, b.inst, 'resize')}></i>
              </div>
            {/if}
          {/each}
          {#if drag?.active && days[drag.day] === d}
            <div class="ev ghost" style:--c={color(drag.inst.task)}
              style:top="{((drag.mode === 'resize' ? drag.start0 : drag.start) / 60) * H}px"
              style:height="{Math.max((drag.dur / 60) * H - 2, 20)}px" style:left="1px" style:width="calc(100% - 3px)">
              <b>{drag.inst.task.title}</b>
              <span>{fromMin(drag.mode === 'resize' ? drag.start0 : drag.start)}–{fromMin((drag.mode === 'resize' ? drag.start0 : drag.start) + drag.dur)}</span>
            </div>
          {/if}
          {#if d === store.today}
            <div class="now" style:top="{(nowMin / 60) * H}px"><i></i></div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .tg { --gut: 52px; display: flex; flex-direction: column; min-height: 0; flex: 1; }
  .tg-head, .allday { display: grid; grid-template-columns: var(--gut) repeat(var(--cols), 1fr); }
  .tg-head { border-bottom: 1px solid var(--line); padding-bottom: 6px; }
  .dh { display: flex; align-items: center; justify-content: center; gap: 6px; height: 40px; border-radius: 10px; font-size: 14px; font-weight: 500; color: var(--muted); }
  .dh b { display: grid; place-items: center; min-width: 30px; height: 30px; padding: 0 4px; border-radius: 99px; color: var(--ink); font-size: 17px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .dh.today b { background: var(--accent); color: var(--on-accent); }
  .dh:hover { background: var(--soft); }
  .allday { border-bottom: 1px solid var(--line); padding: 4px 0; }
  .lbl { align-self: center; color: var(--muted); font-size: 11px; font-weight: 600; text-align: right; padding-right: 8px; line-height: 1.1; }
  .ad-col { display: flex; flex-direction: column; gap: 2px; padding: 0 2px; min-width: 0; }
  .ad {
    height: 22px; padding: 0 6px; border-radius: 6px; text-align: left;
    background: color-mix(in srgb, var(--c) 18%, var(--bg)); color: var(--ink);
    font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    box-shadow: inset 3px 0 0 var(--c);
  }
  .ad.done { opacity: .5; text-decoration: line-through; }

  .scroll { flex: 1; overflow-y: auto; overscroll-behavior: contain; min-height: 0; }
  .grid {
    position: relative; display: grid; grid-template-columns: var(--gut) repeat(var(--cols), 1fr);
    background: repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px var(--h)) var(--gut) 0 / calc(100% - var(--gut)) 100% no-repeat;
    margin-top: 8px;
  }
  .hours { position: relative; }
  .hours span { position: absolute; right: 8px; transform: translateY(-50%); color: var(--muted); font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .col { position: relative; border-left: 1px solid var(--line); cursor: copy; min-width: 0; }
  .ev {
    position: absolute; z-index: 1; overflow: hidden;
    display: flex; flex-direction: column; gap: 1px;
    padding: 3px 6px 3px 8px; border-radius: 6px;
    background: color-mix(in srgb, var(--c) 16%, var(--bg));
    box-shadow: inset 3px 0 0 var(--c);
    color: var(--ink); font-size: 12px; line-height: 1.25; cursor: pointer;
    touch-action: auto; user-select: none; -webkit-user-select: none;
  }
  .ev b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ev span { color: color-mix(in srgb, var(--c) 70%, var(--ink)); font-weight: 500; font-variant-numeric: tabular-nums; }
  .ev.done { opacity: .5; }
  .ev.done b { text-decoration: line-through; }
  .ev.ghost { z-index: 3; box-shadow: inset 3px 0 0 var(--c), 0 8px 20px -8px rgb(0 0 0 / 40%); background: color-mix(in srgb, var(--c) 28%, var(--bg)); cursor: grabbing; }
  .grip { position: absolute; left: 0; right: 0; bottom: 0; height: 8px; cursor: ns-resize; }
  .now { position: absolute; z-index: 2; left: -1px; right: 0; height: 2px; margin-top: -1px; background: var(--red); pointer-events: none; }
  .now i { position: absolute; left: -5px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: var(--red); }
</style>
