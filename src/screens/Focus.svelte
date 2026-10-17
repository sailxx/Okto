<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import CounterEditor from '../components/CounterEditor.svelte';
  import Sheet from '../components/Sheet.svelte';
  import Digits from '../components/Digits.svelte';
  import { store } from '../lib/store.svelte';
  import { POMO, STEPS, type Counter, type FocusMode, type PomoPreset } from '../lib/model';
  import { buzz, unlockAudio } from '../lib/alerts';
  import { locale } from '../lib/i18n';

  const LONG_PRESS = 650;
  const mode = $derived(store.device.focusMode);
  const isPomo = $derived(mode === 'pomodoro');
  const isSw = $derived(mode === 'stopwatch');
  const isTimer = $derived(mode === 'timer');
  const MODES: [FocusMode, string][] = [['counter', 'modeCounter'], ['pomodoro', ''], ['stopwatch', 'modeStopwatch'], ['timer', 'modeTimer']];
  const modeLabel = (m: FocusMode, key: string) => (m === 'pomodoro' ? 'Pomodoro' : store.t(key as 'modeCounter'));
  const counter = $derived(store.activeCounter());
  const fmt = $derived(new Intl.NumberFormat(locale(store.lang)));
  const counterName = (c: Counter) => c.name || store.t('counter');
  const linked = $derived(store.device.focusTask ? store.data.tasks[store.device.focusTask] : null);

  let editing = $state<{ id: string | null } | null>(null);
  /** Pomodoro preset or counter list, opened from a card row. */
  let picker = $state<'pomo' | 'counter' | null>(null);
  let countEl: HTMLButtonElement;
  let tickAnim = $state(false);

  /* ---------- time helpers ---------- */
  function mmss(ms: number) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  }

  /* ---------- stopwatch view: hundredths need a frame clock ---------- */
  let frame = $state(Date.now());
  const swRunning = $derived(Boolean(store.device.stopwatch.startedAt));
  $effect(() => {
    if (!isSw || !swRunning) return;
    let raf = 0;
    const loop = () => { frame = Date.now(); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  });
  /** Elapsed at a moment: the frame clock only adds smoothness, the app ticker keeps it right when frames pause. */
  const swAt = (t: number) => { const sw = store.device.stopwatch; return sw.elapsed + (sw.startedAt ? Math.max(0, t - sw.startedAt) : 0); };
  const swLive = $derived(swAt(Math.max(isSw ? frame : 0, store.now.getTime())));
  const laps = $derived(store.device.stopwatch.laps);
  const lastLap = $derived(laps.length ? laps[laps.length - 1] : 0);
  function fmtSw(ms: number) {
    const cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${h ? `${h}:` : ''}${p(m)}:${p(s)}.${p(cs)}`;
  }
  function lap() {
    if (!swRunning) return;
    store.setDevice({ stopwatch: { ...store.device.stopwatch, laps: [...laps, swAt(Date.now())].slice(-99) } });
    if (store.data.settings.vibrate) buzz(10);
  }
  function resetSw() { store.setDevice({ stopwatch: { elapsed: 0, startedAt: null, laps: [] } }); }

  /* ---------- timer view ---------- */
  const TIMER_PRESETS = [1, 3, 5, 10, 15, 30, 60];
  const tLeft = $derived.by(() => { void store.now; return store.timerLeft(); });
  const tRunning = $derived(Boolean(store.device.timer.endsAt));
  const tDur = $derived(store.device.timer.duration);
  const durLabel = (ms: number) => (ms % 60000 ? mmss(ms) : store.t('durMin')(ms / 60000));
  let customOpen = $state(false);
  let cMin = $state('5'), cSec = $state('0');
  function openCustom() { cMin = String(Math.floor(tDur / 60000)); cSec = String(Math.floor(tDur / 1000) % 60); customOpen = true; }
  function saveCustom() {
    const m = Math.max(0, Math.min(1439, parseInt(cMin, 10) || 0)), s = Math.max(0, Math.min(59, parseInt(cSec, 10) || 0));
    const ms = (m * 60 + s) * 1000;
    if (ms >= 1000) store.timerSet(ms);
    customOpen = false;
  }

  /* ---------- pomodoro view ---------- */
  const cfg = $derived(store.pomoCfg());
  const left = $derived.by(() => { void store.now; return store.pomoLeft(); });
  const total = $derived(store.phaseMs());
  const running = $derived(Boolean(store.device.pomo.endsAt));
  const phase = $derived(store.device.pomo.phase);
  const nextPhase = $derived(phase === 'work' ? (store.device.pomo.round % cfg.every === 0 ? 'long' : 'short') : 'work');

  $effect(() => {
    if (isPomo && running) document.title = `${mmss(left)} · ${store.t('phase')[phase]} — Okto`;
    else if (isTimer && tRunning) document.title = `${mmss(tLeft)} · ${store.t('modeTimer')} — Okto`;
    else if (isSw && swRunning) document.title = `${store.t('modeStopwatch')} — Okto`;
    else if (mode === 'counter' && counter.count) document.title = `${fmt.format(counter.count)} · ${counterName(counter)} — Okto`;
    else document.title = store.t('appTitle');
  });

  /* ---------- counter actions ---------- */
  function setCount(c: Counter, count: number, history = [...c.history, c.count].slice(-50)) {
    store.saveCounter({ ...$state.snapshot(c), count, history });
  }
  function changeCount(dir: 1 | -1) {
    const c = counter;
    if (store.device.locked && dir > 0) { store.toast(store.t('locked')); return; }
    const next = Math.max(0, c.count + dir * c.step);
    if (next === c.count) return;
    setCount(c, next);
    tickAnim = false; requestAnimationFrame(() => { tickAnim = true; });
    if (store.data.settings.vibrate) buzz(6);
    if (dir > 0 && c.count < c.target && next >= c.target) {
      store.alert(store.t('goalReachedTitle'), store.t('goalReachedBody')(counterName(c), fmt.format(c.target)));
    }
  }
  function resetCount() {
    if (counter.count === 0) return;
    setCount(counter, 0);
    if (store.data.settings.vibrate) buzz(30);
    store.toast(store.t('reset'));
  }
  function undo() {
    const c = counter;
    if (!c.history.length) return;
    const history = c.history.slice(0, -1);
    setCount(c, c.history[c.history.length - 1], history);
  }
  function toggleStopwatch() {
    const sw = store.device.stopwatch;
    store.setDevice({ stopwatch: sw.startedAt ? { ...sw, elapsed: swAt(Date.now()), startedAt: null } : { ...sw, startedAt: Date.now() } });
  }

  function primary() {
    if (isPomo) { if (running) store.pomoPause(); else store.pomoStart(); if (store.data.settings.vibrate) buzz(8); }
    else if (isSw) { toggleStopwatch(); if (store.data.settings.vibrate) buzz(8); }
    else if (isTimer) { if (tRunning) store.timerPause(); else store.timerStart(); if (store.data.settings.vibrate) buzz(8); }
    else changeCount(1);
  }
  function longAction() {
    if (isPomo) { store.pomoResetPhase(); if (store.data.settings.vibrate) buzz(30); }
    else if (isSw) { resetSw(); if (store.data.settings.vibrate) buzz(30); }
    else if (isTimer) { store.timerReset(); if (store.data.settings.vibrate) buzz(30); }
    else if (!store.device.locked) resetCount();
  }

  function setMode(m: FocusMode) { if (store.device.focusMode !== m) store.setDevice({ focusMode: m }); }
  function pickPreset(key: PomoPreset) {
    const p = store.data.settings.pomo;
    if (p.preset !== key) {
      store.updateSettings({ pomo: { ...p, preset: key } });
      store.setDevice({ pomo: { phase: 'work', round: 1, endsAt: null, remaining: null } });
    }
  }
  function pickCounter(id: string) {
    if (id === store.device.activeCounter) editing = { id };
    else store.setDevice({ activeCounter: id });
  }

  /* ---------- tap zone ---------- */
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let pressStart: { x: number; y: number } | null = null;
  let suppressClick = false;
  const isControl = (n: EventTarget | null) => n instanceof Element && n.closest('button, input, a, dialog, .frows') && !n.closest('.count');

  function down(e: PointerEvent) {
    if (e.button !== 0 || isControl(e.target)) return;
    pressStart = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => { pressStart = null; suppressClick = true; longAction(); }, LONG_PRESS);
  }
  function move(e: PointerEvent) {
    if (pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 12) { clearTimeout(pressTimer); pressStart = null; }
  }
  function up() { clearTimeout(pressTimer); pressStart = null; }
  function click(e: MouseEvent) {
    if (suppressClick) { suppressClick = false; return; }
    if (isControl(e.target)) return;
    unlockAudio();
    primary();
  }

  /* ---------- wake lock ---------- */
  const wakeSupported = 'wakeLock' in navigator;
  let wakeLock: WakeLockSentinel | null = null;
  let wakeWanted = $state(false);
  async function reacquire() {
    if (!wakeWanted || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch { wakeLock = null; }
  }
  async function toggleWake() {
    if (wakeWanted) {
      wakeWanted = false;
      await wakeLock?.release().catch(() => {});
      wakeLock = null;
      store.toast(store.t('wakeOff'));
    } else {
      wakeWanted = true;
      await reacquire();
      store.toast(wakeLock ? store.t('wakeOn') : store.t('wakeFail'));
      if (!wakeLock) wakeWanted = false;
    }
  }

  /* ---------- fit big number ---------- */
  async function fit() {
    await tick();
    if (!countEl) return;
    countEl.style.fontSize = '';
    const avail = countEl.clientWidth, natural = countEl.scrollWidth;
    if (avail > 0 && natural > avail) {
      const size = parseFloat(getComputedStyle(countEl).fontSize);
      countEl.style.fontSize = `${Math.max(28, (size * avail) / natural)}px`;
    }
  }
  const display = $derived(isPomo ? mmss(left) : isSw ? fmtSw(swLive) : isTimer ? mmss(tLeft) : fmt.format(counter.count));
  // Digits are tabular, so only a change in length (or mode) can change the width.
  $effect(() => { void display.length; void mode; fit(); });

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || e.repeat || (e.target as Element)?.matches?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      if ((k === 'z' || k === 'я') && !e.ctrlKey && !e.metaKey && mode === 'counter') { e.preventDefault(); undo(); return; }
      if ((k === 'l' || k === 'д') && !e.ctrlKey && !e.metaKey && isSw) { e.preventDefault(); lap(); return; }
      if (e.code === 'Space' || e.code === 'Enter') {
        if ((e.target as Element)?.matches?.('button, a')) return;
        e.preventDefault(); unlockAudio(); primary();
      }
    };
    const onVisible = () => { if (!document.hidden) reacquire(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisible);
    const ro = new ResizeObserver(fit);
    if (countEl) ro.observe(countEl);
    document.fonts?.ready.then(fit);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisible);
      ro.disconnect();
      wakeLock?.release().catch(() => {});
    };
  });

  const presets: PomoPreset[] = ['classic', 'short', 'deep', 'custom'];
  const presetCfg = (k: PomoPreset) => (k === 'custom' ? store.data.settings.pomo.custom : POMO[k]);
  const percent = $derived(Math.min(100, Math.floor((counter.count / counter.target) * 100)));
  const ratio = $derived(
    isPomo ? Math.min(1, Math.max(0, 1 - left / total))
      : isSw ? (swLive % 60000) / 60000
      : isTimer ? Math.min(1, Math.max(0, 1 - tLeft / Math.max(tDur, tLeft)))
      : Math.min(1, counter.count / counter.target),
  );
</script>

<div class="page focus-page">
  <div class="modes" role="tablist" style:--n={MODES.length} style:--i={MODES.findIndex(([m]) => m === mode)}>
    <span class="modes-thumb" aria-hidden="true"></span>
    {#each MODES as [m, key]}
      <button type="button" role="tab" aria-selected={mode === m} onclick={() => setMode(m)}>{modeLabel(m, key)}</button>
    {/each}
  </div>

  {#if isPomo && linked && !linked.deleted}
    <div class="linked" style:--c={store.colorOf(linked)}>
      <span class="ldot"></span><span class="ltitle">{linked.title}</span>
      <button type="button" aria-label={store.t('unlinkTask')} onclick={() => store.setDevice({ focusTask: null })}><Icon name="close" size={16} /></button>
    </div>
  {/if}

  <!-- The card is the tap zone: tap — main action, hold — reset. Its rows are controls of their own. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="zone"
    class:locked={mode === 'counter' && store.device.locked}
    class:sw={isSw}
    class:paused={(isPomo && !running && left < total) || (isSw && !swRunning && swLive > 0) || (isTimer && !tRunning && store.device.timer.remaining !== null)}
    onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onpointerleave={up}
    oncontextmenu={(e) => e.preventDefault()}
    onclick={click}
  >
    <div class="fcard">
      <div class="ftop">
        <span class="ftitle">{isPomo ? store.t('phase')[phase] : isSw ? store.t('modeStopwatch') : isTimer ? store.t('modeTimer') : counterName(counter)}</span>
        {#if isPomo}
          <span class="rdots" role="img" aria-label={store.t('round')(store.device.pomo.round, cfg.every)}>
            {#each Array(cfg.every) as _, k}<i class:done={k < store.device.pomo.round - 1} class:cur={k === store.device.pomo.round - 1}></i>{/each}
          </span>
        {:else}
          <span class="fmeta">
            {#if isSw}{laps.length ? store.t('laps')(laps.length) : store.t('noLaps')}
            {:else if isTimer}{store.t('timerFor')(durLabel(tDur))}
            {:else}{store.t('goalLine')(fmt.format(counter.target))}{#if counter.count >= counter.target} · {store.t('goalDone')}{/if}{/if}
          </span>
        {/if}
      </div>
      <button class="count" class:tick={tickAnim} type="button" bind:this={countEl}
        aria-label={isPomo ? `${store.t('phase')[phase]} ${display}` : isSw || isTimer ? `${store.t(isSw ? 'modeStopwatch' : 'modeTimer')} ${display}` : `${counterName(counter)}: ${counter.count}`}>
        <Digits text={display} />
      </button>
      <div class="fbar" aria-hidden="true"><i style:width="{ratio * 100}%"></i></div>

      <div class="frows">
        {#if isSw}
          <div class="flaps">
            <div class="frow"><span>{store.t('lap')} {laps.length + 1}</span><span class="fv"><b>{fmtSw(swLive - lastLap)}</b></span></div>
            {#each [...laps].reverse() as at, k (laps.length - k)}
              {@const n = laps.length - k}
              <div class="frow"><span>{store.t('lap')} {n}</span><span class="fv"><b>{fmtSw(at - (laps[n - 2] ?? 0))}</b><small>{fmtSw(at)}</small></span></div>
            {/each}
          </div>
        {:else if isTimer}
          <button type="button" class="frow" onclick={openCustom}><span>{store.t('rowTime')}</span><span class="fv"><b>{durLabel(tDur)}</b>{@render chev()}</span></button>
          <button type="button" class="frow" onclick={() => store.timerAdd(60000)}><span>{store.t('addMinute')}</span>{@render chev()}</button>
          {@render soundRow()}
        {:else if isPomo}
          {@const pc = presetCfg(store.data.settings.pomo.preset)}
          <button type="button" class="frow" onclick={() => (picker = 'pomo')}><span>{store.t('rowMode')}</span><span class="fv"><b>{store.t('pomo')[store.data.settings.pomo.preset]} {pc.work}/{pc.short}</b>{@render chev()}</span></button>
          <div class="frow"><span class="fdim">{store.t('next')(store.t('phase')[nextPhase], cfg[nextPhase])}</span></div>
          <button type="button" class="frow" onclick={() => store.pomoAdvance(false)}><span>{store.t('skip')}</span>{@render chev()}</button>
          {@render soundRow()}
        {:else}
          <button type="button" class="frow" onclick={() => (picker = 'counter')}><span>{store.t('counter')}</span><span class="fv"><b>{counterName(counter)}</b>{@render chev()}</span></button>
          <button type="button" class="frow" onclick={() => (editing = { id: counter.id })}><span>{store.t('goalLine')(fmt.format(counter.target))}</span><span class="fv"><b>{percent}%</b>{@render chev()}</span></button>
          <button type="button" class="frow" aria-label={store.t('stepLabel')(counter.step)}
            onclick={() => store.saveCounter({ ...$state.snapshot(counter), step: STEPS[(STEPS.indexOf(counter.step) + 1) % STEPS.length] })}>
            <span>{store.t('rowStep')}</span><span class="fv"><b>+{counter.step}</b>{@render chev()}</span>
          </button>
          <button type="button" class="frow" role="switch" aria-checked={store.device.locked} onclick={() => store.setDevice({ locked: !store.device.locked })}>
            <span>{store.t('lock')}</span><i class="tg" aria-hidden="true"></i>
          </button>
          <button type="button" class="frow" disabled={!counter.history.length} onclick={undo}><span>{store.t('undoLast')}</span>{@render chev()}</button>
        {/if}
        {#if wakeSupported}
          <button type="button" class="frow" role="switch" aria-checked={wakeWanted} onclick={toggleWake}><span>{store.t('wake')}</span><i class="tg" aria-hidden="true"></i></button>
        {/if}
      </div>
    </div>
  </div>

  <div class="fkeys">
    {#if isSw}
      {#if swRunning}
        <button type="button" class="key" title="{store.t('lap')} (L)" onclick={lap}>{store.t('lap')}</button>
      {:else}
        <button type="button" class="key" disabled={swLive === 0} onclick={resetSw}>{store.t('resetKey')}</button>
      {/if}
    {:else if isTimer}
      <button type="button" class="key" disabled={!tRunning && store.device.timer.remaining === null} onclick={() => store.timerReset()}>{store.t('resetKey')}</button>
    {:else if isPomo}
      <button type="button" class="key" title={store.t('pomoReset')} onclick={() => store.pomoResetPhase()}>{store.t('resetKey')}</button>
    {:else}
      <button type="button" class="key" aria-label={store.t('minus')} disabled={counter.count === 0} onclick={() => changeCount(-1)}>−{counter.step}</button>
    {/if}
    {#if mode === 'counter'}
      <button type="button" class="key pri" aria-label={store.t('stepLabel')(counter.step)} onclick={() => changeCount(1)}><Icon name="plus" size={18} />{counter.step}</button>
    {:else}
      {@const on = isSw ? swRunning : isTimer ? tRunning : running}
      <button type="button" class="key pri" onclick={() => { unlockAudio(); primary(); }}>
        {#if on}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5v13M15 5.5v13" stroke-width="3"/></svg>{:else}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>{/if}
        {on ? store.t('pause') : store.t('start')}
      </button>
    {/if}
  </div>
</div>

{#snippet chev()}<span class="chev" aria-hidden="true"><Icon name="right" size={16} /></span>{/snippet}

{#snippet soundRow()}
  <button type="button" class="frow" role="switch" aria-checked={store.data.settings.sound}
    onclick={() => { unlockAudio(); store.updateSettings({ sound: !store.data.settings.sound }); }}>
    <span>{store.t('sound')}</span><i class="tg" aria-hidden="true"></i>
  </button>
{/snippet}

{#if picker === 'pomo'}
  <Sheet title="Pomodoro" onclose={() => (picker = null)}>
    <div class="plist" role="listbox">
      {#each presets as key}
        <button type="button" class="tag" role="option" aria-selected={store.data.settings.pomo.preset === key} style:--c="var(--ink)" onclick={() => { pickPreset(key); picker = null; }}>
          {store.t('pomo')[key]}<small>{presetCfg(key).work}/{presetCfg(key).short}</small>
        </button>
      {/each}
    </div>
  </Sheet>
{/if}

{#if picker === 'counter'}
  <Sheet title={store.t('modeCounter')} onclose={() => (picker = null)}>
    <div class="plist" role="listbox">
      {#each store.counters as c (c.id)}
        <button type="button" class="tag" role="option" aria-selected={c.id === counter.id} style:--c={c.color} onclick={() => { pickCounter(c.id); picker = null; }}>
          {counterName(c)}<small>{fmt.format(c.target)}</small>
        </button>
      {/each}
      {#if store.counters.length < 20}
        <button type="button" class="tag add" onclick={() => { editing = { id: null }; picker = null; }}>+ {store.t('newCounter')}</button>
      {/if}
    </div>
  </Sheet>
{/if}

{#if customOpen}
  <Sheet title={store.t('rowTime')} onclose={() => (customOpen = false)}>
    <div class="plist" role="listbox">
      {#each TIMER_PRESETS as m}
        <button type="button" class="tag" role="option" aria-selected={tDur === m * 60000} style:--c="var(--ink)" onclick={() => { store.timerSet(m * 60000); customOpen = false; }}>{store.t('durMin')(m)}</button>
      {/each}
    </div>
    <p class="plabel">{store.t('customTime')}</p>
    <form method="dialog" onsubmit={saveCustom}>
      <div class="nums two">
        <label><span>{store.t('minutes')}</span><input type="number" min="0" max="1439" inputmode="numeric" bind:value={cMin} /></label>
        <label><span>{store.t('seconds')}</span><input type="number" min="0" max="59" inputmode="numeric" bind:value={cSec} /></label>
      </div>
      <button class="solid-btn set-time">{store.t('save')}</button>
    </form>
  </Sheet>
{/if}

{#if editing}
  <CounterEditor id={editing.id} onclose={() => (editing = null)} />
{/if}

<style>
  /* D5: one Home-style card — title, big value, thin bar, then settings-like rows. Two keys at the bottom. */
  .focus-page .zone { flex: 0 0 auto; display: block; min-height: 0; padding: 16px 0 0; }
  .fcard {
    border-radius: 24px; padding: 16px 18px 0; overflow: hidden;
    background: color-mix(in srgb, var(--soft) 78%, var(--bg));
    box-shadow: inset 0 0 0 1px var(--line), 0 1px 2px rgb(0 0 0 / 4%), 0 18px 34px -24px rgb(0 0 0 / 32%);
  }
  .ftop { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 22px; font-size: 14px; color: var(--muted); }
  .ftitle { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); font-size: 15px; font-weight: 600; }
  .fmeta { flex: none; }
  .rdots { display: inline-flex; gap: 5px; }
  .rdots i { width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1.3px var(--muted); }
  .rdots i.done, .rdots i.cur { background: var(--ink); box-shadow: none; }
  .rdots i.cur { width: 16px; border-radius: 4px; }
  .focus-page .fcard .count { margin: 10px 0 14px; font-family: var(--sans); font-size: clamp(56px, 17vw, 96px); font-weight: 650; letter-spacing: -.045em; text-align: left; }
  .focus-page :global(.count .digits), .focus-page :global(.count .live) { justify-self: start; }
  .fbar { height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--ink) 10%, transparent); overflow: hidden; }
  .fbar i { display: block; height: 100%; border-radius: 2px; background: var(--ink); }
  .frows { margin: 14px -18px 0; border-top: 1px solid var(--line); }
  .frow {
    display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 0 18px;
    color: var(--ink); font-size: 15px; text-align: left; font-variant-numeric: tabular-nums; cursor: default;
  }
  .frow + .frow, .flaps + .frow { border-top: 1px solid var(--line); }
  button.frow { cursor: pointer; transition: background-color 150ms ease; }
  button.frow:hover { background: color-mix(in srgb, var(--ink) 4%, transparent); }
  button.frow:disabled { opacity: .4; cursor: default; background: none; }
  .fv { display: inline-flex; align-items: center; gap: 8px; min-width: 0; color: var(--muted); }
  .fv b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); font-weight: 500; }
  .fv small { font-size: 12px; }
  .fdim { color: var(--muted); }
  .chev { display: grid; color: var(--muted); opacity: .7; }
  .flaps { max-height: 192px; overflow-y: auto; }
  /* Switch: the row is the control, this is its state. */
  .tg { position: relative; flex: none; width: 40px; height: 24px; border-radius: 12px; background: color-mix(in srgb, var(--ink) 16%, transparent); transition: background-color 150ms ease; }
  .tg::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: var(--bg); box-shadow: 0 1px 2px rgb(0 0 0 / 25%); transition: transform 180ms var(--ease); }
  [aria-checked='true'] .tg { background: var(--primary); }
  [aria-checked='true'] .tg::after { background: var(--on-primary); transform: translateX(16px); }
  .fkeys { margin-top: auto; display: grid; grid-template-columns: 1fr 2fr; gap: 10px; padding-top: 16px; }
  .fkeys .key {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 56px;
    font-family: var(--mono); font-size: 13px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
  }
  .fkeys .key.pri { --k-bg: var(--primary); --k-ink: var(--on-primary); }
  .fkeys .key:disabled { opacity: .35; cursor: default; transform: none; }
  .fkeys svg { width: 18px; height: 18px; }
  .plist { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .plabel { margin: 4px 0 10px; color: var(--muted); font-size: 13px; }
  .modes { margin-top: 6px; }
  .linked {
    display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
    max-width: 100%; margin-top: 12px; height: 34px; padding: 0 6px 0 12px;
    border-radius: 8px; background: color-mix(in srgb, var(--c) 14%, transparent);
    font-size: 14px; font-weight: 600;
  }
  .ldot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: var(--c); }
  .ltitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .linked button { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px; color: var(--muted); }
  .linked button:hover { background: var(--soft); color: var(--ink); }
  .nums.two { grid-template-columns: 1fr 1fr; margin-bottom: 16px; }
  .set-time { margin-top: 4px; }
</style>
