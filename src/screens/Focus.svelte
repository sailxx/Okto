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
  let countEl: HTMLButtonElement;
  let tickAnim = $state(false);

  /* ---------- time helpers ---------- */
  function mmss(ms: number) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  }
  const swMs = $derived.by(() => {
    const sw = store.device.stopwatch;
    return sw.elapsed + (sw.startedAt ? store.now.getTime() - sw.startedAt : 0);
  });

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
  const isControl = (n: EventTarget | null) => n instanceof Element && n.closest('button, input, a, dialog') && !n.closest('.count');

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

  <section class="heading">
    <button class="name" type="button" onclick={() => (mode === 'counter' ? (editing = { id: counter.id }) : isTimer ? openCustom() : null)}>
      {isPomo ? store.t('phase')[phase] : isSw ? store.t('modeStopwatch') : isTimer ? store.t('modeTimer') : counterName(counter)}
    </button>
    <p class="meta">
      {#if isSw}
        {laps.length ? store.t('laps')(laps.length) : store.t('noLaps')}
      {:else if isTimer}
        {store.t('timerFor')(durLabel(tDur))}
      {:else if isPomo}
        {store.t('round')(store.device.pomo.round, cfg.every)} · {store.t('todayFocuses')(store.pomoToday())}
      {:else}
        {store.t('goalLine')(fmt.format(counter.target))}{#if counter.count >= counter.target} · <b>{store.t('goalDone')}</b>{/if}
      {/if}
    </p>
  </section>

  {#if isPomo && linked && !linked.deleted}
    <div class="linked" style:--c={store.colorOf(linked)}>
      <span class="ldot"></span><span class="ltitle">{linked.title}</span>
      <button type="button" aria-label={store.t('unlinkTask')} onclick={() => store.setDevice({ focusTask: null })}><Icon name="close" size={16} /></button>
    </div>
  {/if}

  {#if !isSw}
  <div class="tags" role="listbox">
    {#if isTimer}
      {#each TIMER_PRESETS as m}
        <button type="button" class="tag" role="option" aria-selected={tDur === m * 60000} style:--c="var(--ink)" onclick={() => store.timerSet(m * 60000)}>{store.t('durMin')(m)}</button>
      {/each}
      <button type="button" class="tag add" role="option" aria-selected={!TIMER_PRESETS.some((m) => m * 60000 === tDur)} onclick={openCustom}>{store.t('customTime')}</button>
    {:else if isPomo}
      {#each presets as key}
        <button type="button" class="tag" role="option" aria-selected={store.data.settings.pomo.preset === key} style:--c="var(--ink)" onclick={() => pickPreset(key)}>
          {store.t('pomo')[key]}<small>{presetCfg(key).work}/{presetCfg(key).short}</small>
        </button>
      {/each}
    {:else}
      {#each store.counters as c (c.id)}
        <button type="button" class="tag" role="option" aria-selected={c.id === counter.id} style:--c={c.color} onclick={() => pickCounter(c.id)}>
          {counterName(c)}<small>{fmt.format(c.target)}</small>
        </button>
      {/each}
      {#if store.counters.length < 20}
        <button type="button" class="tag add" onclick={() => (editing = { id: null })}>+ {store.t('add')}</button>
      {/if}
    {/if}
  </div>
  {/if}

  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="zone"
    class:locked={mode === 'counter' && store.device.locked}
    class:paused={(isPomo && !running && left < total) || (isSw && !swRunning && swLive > 0) || (isTimer && !tRunning && store.device.timer.remaining !== null)}
    onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onpointerleave={up}
    oncontextmenu={(e) => e.preventDefault()}
    onclick={click}
  >
    <div class="block well">
      <button class="count" class:tick={tickAnim} type="button" bind:this={countEl}
        aria-label={isPomo ? `${store.t('phase')[phase]} ${display}` : isSw || isTimer ? `${store.t(isSw ? 'modeStopwatch' : 'modeTimer')} ${display}` : `${counterName(counter)}: ${counter.count}`}>
        <Digits text={display} />
      </button>
      <div class="progress" aria-hidden="true">
        {#each Array(24) as _, s}<span class:on={s < Math.round(ratio * 24)}></span>{/each}
      </div>
      <div class="progress-line">
        {#if isSw}
          <span>{store.t('lap')} {laps.length + 1} · {fmtSw(swLive - lastLap)}</span>
          <span>{store.t('laps')(laps.length)}</span>
        {:else if isTimer}
          <span>{mmss(tLeft)} {store.t('timerLeft')}</span>
          <span>{store.t('timerOf')(durLabel(tDur))}</span>
        {:else if isPomo}
          <span>{store.t('next')(store.t('phase')[nextPhase], cfg[nextPhase])}</span>
          <span>{cfg[phase]} {store.t('min')}</span>
        {:else}
          <span>{store.t('of')(fmt.format(counter.count), fmt.format(counter.target))}{#if swMs > 0 || store.device.stopwatch.startedAt} · {mmss(swMs)}{/if}</span>
          <span>{percent}%</span>
        {/if}
      </div>
      {#if isSw && laps.length}
        <ol class="laps" aria-label={store.t('laps')(laps.length)}>
          {#each [...laps].reverse() as at, k (laps.length - k)}
            {@const n = laps.length - k}
            <li><span>{store.t('lap')} {n}</span><b>{fmtSw(at - (laps[n - 2] ?? 0))}</b><small>{fmtSw(at)}</small></li>
          {/each}
        </ol>
      {/if}
    </div>
  </div>

  <footer class="bottom">
    <p class="hint">{isSw ? store.t('hintStopwatch') : isTimer ? store.t('hintTimer') : isPomo ? store.t('hintPomo') : store.device.locked ? store.t('hintLocked') : store.t('hintCounter')}</p>

    {#if isSw}
      <div class="circles">
        <button class="circle" type="button" aria-label={store.t('reset')} title={store.t('reset')} disabled={!swRunning && swLive === 0} onclick={resetSw}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5"/><path d="M3.5 3.5v5h5"/></svg>
        </button>
        <button class="circle big" type="button" aria-label={swRunning ? store.t('pause') : store.t('start')} onclick={() => primary()}>
          {#if swRunning}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5v13M15 5.5v13" stroke-width="3"/></svg>{:else}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>{/if}
        </button>
        <button class="circle" type="button" aria-label="{store.t('lap')} (L)" title="{store.t('lap')} (L)" disabled={!swRunning} onclick={lap}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4M6 4h11l-2 4 2 4H6"/></svg>
        </button>
        {#if wakeSupported}{@render wake()}{/if}
      </div>
    {:else if isTimer}
      <div class="circles">
        <button class="circle" type="button" aria-label={store.t('reset')} title={store.t('reset')} disabled={!tRunning && store.device.timer.remaining === null} onclick={() => store.timerReset()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5"/><path d="M3.5 3.5v5h5"/></svg>
        </button>
        <button class="circle big" type="button" aria-label={tRunning ? store.t('pause') : store.t('start')} onclick={() => { unlockAudio(); primary(); }}>
          {#if tRunning}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5v13M15 5.5v13" stroke-width="3"/></svg>{:else}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>{/if}
        </button>
        <button class="circle text" type="button" aria-label={store.t('addMinute')} title={store.t('addMinute')} onclick={() => store.timerAdd(60000)}>+1</button>
        {@render sound()}
        {#if wakeSupported}{@render wake()}{/if}
      </div>
    {:else if isPomo}
      <div class="circles" class:running>
        <button class="circle" type="button" aria-label={store.t('pomoReset')} title={store.t('pomoReset')} onclick={() => store.pomoResetPhase()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5"/><path d="M3.5 3.5v5h5"/></svg>
        </button>
        <button class="circle big" type="button" aria-label={running ? store.t('pause') : store.t('start')} onclick={() => { unlockAudio(); primary(); }}>
          {#if running}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5v13M15 5.5v13" stroke-width="3"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>
          {/if}
        </button>
        <button class="circle" type="button" aria-label={store.t('skip')} title={store.t('skip')} onclick={() => store.pomoAdvance(false)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 5.5v13l9-6.5z"/><path d="M18.5 5.5v13"/></svg>
        </button>
        <button class="circle sound" type="button" aria-pressed={store.data.settings.sound} aria-label={store.t('sound')} title={store.t('sound')}
          onclick={() => { unlockAudio(); store.updateSettings({ sound: !store.data.settings.sound }); }}>
          {#if store.data.settings.sound}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>
          {/if}
        </button>
        {#if wakeSupported}{@render wake()}{/if}
      </div>
    {:else}
      <div class="circles">
        <button class="circle" type="button" aria-pressed={store.device.locked} aria-label={store.device.locked ? store.t('unlock') : store.t('lock')}
          title={store.device.locked ? store.t('unlock') : store.t('lock')} onclick={() => store.setDevice({ locked: !store.device.locked })}>
          {#if store.device.locked}
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>
          {:else}
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2"/></svg>
          {/if}
        </button>
        <button class="circle" type="button" aria-label={store.t('undo')} title={store.t('undo')} disabled={!counter.history.length} onclick={undo}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>
        </button>
        <button class="circle" type="button" aria-label={store.t('minus')} title={store.t('minus')} disabled={counter.count === 0} onclick={() => changeCount(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>
        </button>
        <button class="circle text" type="button" aria-label={store.t('stepLabel')(counter.step)}
          onclick={() => store.saveCounter({ ...$state.snapshot(counter), step: STEPS[(STEPS.indexOf(counter.step) + 1) % STEPS.length] })}>+{counter.step}</button>
        <button class="circle" type="button" aria-pressed={Boolean(store.device.stopwatch.startedAt)} aria-label={store.t('stopwatch')} title={store.t('stopwatch')} onclick={toggleStopwatch}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V10M10 3h4"/></svg>
        </button>
        {#if wakeSupported}{@render wake()}{/if}
      </div>
    {/if}
  </footer>
</div>

{#snippet sound()}
  <button class="circle sound" type="button" aria-pressed={store.data.settings.sound} aria-label={store.t('sound')} title={store.t('sound')}
    onclick={() => { unlockAudio(); store.updateSettings({ sound: !store.data.settings.sound }); }}>
    {#if store.data.settings.sound}
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>
    {:else}
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>
    {/if}
  </button>
{/snippet}

{#snippet wake()}
  <button class="circle" type="button" aria-pressed={wakeWanted} aria-label={store.t('wake')} title={store.t('wake')} onclick={toggleWake}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/><path d="M10 9.5l1.5 1.5 3-3"/></svg>
  </button>
{/snippet}

{#if customOpen}
  <Sheet title={store.t('customTime')} onclose={() => (customOpen = false)}>
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
  .laps { list-style: none; margin: 14px 0 0; padding: 10px 0 0; max-height: 168px; overflow-y: auto; border-top: 1px solid var(--well-ghost); font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .laps li { display: grid; grid-template-columns: 1fr auto auto; align-items: baseline; gap: 16px; padding: 5px 2px; color: var(--well-dim); font-size: 13px; }
  .laps b { color: var(--well-ink); font-size: 15px; font-weight: 600; }
  .laps small { min-width: 86px; text-align: right; font-size: 12px; }
  .nums.two { grid-template-columns: 1fr 1fr; margin-bottom: 16px; }
  .set-time { margin-top: 4px; }
  .circle.sound[aria-pressed='true'] { --k-bg: var(--key); --k-ink: var(--key-ink); transform: none; box-shadow: inset 0 1px 0 var(--key-hi), 0 1px 0 var(--key-edge), 0 2px 3px -1px rgb(0 0 0 / 22%); }
</style>
