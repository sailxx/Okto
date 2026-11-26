<script lang="ts">
  import { glassGlide } from '../lib/glassGlide';
  import { onMount, tick } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import CounterEditor from '../components/CounterEditor.svelte';
  import Sheet from '../components/Sheet.svelte';
  import Digits from '../components/Digits.svelte';
  import { store } from '../lib/store.svelte';
  import { POMO, STEPS, type Counter, type FocusMode, type PomoPreset } from '../lib/model';
  import { buzzFocus, unlockAudio, type FocusHaptic } from '../lib/alerts';
  import { androidSend, isBundledAndroid } from '../lib/android';
  import { locale } from '../lib/i18n';

  const LONG_PRESS = 650;
  const SCALE_SEGMENTS = Array.from({ length: 20 }, (_, index) => index);
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
  let countEl = $state<HTMLButtonElement>();
  let settingsOpen = $state(false);
  let goalHalo = $state<HTMLSpanElement>();
  let goalPulse: Animation | undefined;
  let countMotion = $state<HTMLSpanElement>();
  let countNudge: Animation | undefined;
  let lastNudge: 1 | -1 | undefined;

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
  const swAt = (t: number) => store.swAt(t);
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
    tactile('lap');
  }

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
    if (ms >= 1000) setTimerDuration(ms);
    customOpen = false;
  }
  function setTimerDuration(ms: number) {
    if (ms !== tDur || tRunning || store.device.timer.remaining !== null) {
      store.timerSet(ms);
      tactile('adjust');
    }
  }
  function addMinute() {
    store.timerAdd(60000);
    tactile('increment');
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
  function tactile(kind: FocusHaptic) {
    if (store.data.settings.vibrate) buzzFocus(kind);
  }
  function nudgeCount(dir: 1 | -1) {
    if (!countMotion || (countNudge?.playState === 'running' && lastNudge === dir)) return;
    countNudge?.cancel();
    lastNudge = dir;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    countNudge = countMotion.animate(
      reduced ? [{ opacity: .96 }, { opacity: 1 }] : [
        { transform: `translateY(${dir * 3}%)`, opacity: .96 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      { duration: 120, easing: 'cubic-bezier(.23, 1, .32, 1)' },
    );
  }
  function setCount(c: Counter, count: number, history = [...c.history, c.count].slice(-50)) {
    store.saveCounter({ ...$state.snapshot(c), count, history });
  }
  function changeCount(dir: 1 | -1, animate = false) {
    const wasBelowGoal = counter.count < counter.target;
    unlockAudio();
    if (!store.counterStep(dir)) return;
    if (animate) nudgeCount(dir);
    if (dir > 0 && wasBelowGoal && counter.count >= counter.target) {
      goalPulse?.cancel();
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      goalPulse = goalHalo?.animate(
        reduced ? [{ opacity: .55 }, { opacity: 0 }] :
          [{ opacity: .8, transform: 'scale(.96)' }, { opacity: 0, transform: 'scale(1.08)' }],
        { duration: 280, easing: 'cubic-bezier(.23, 1, .32, 1)' },
      );
    } else tactile(dir > 0 ? 'increment' : 'decrement');
  }
  function resetCount() {
    if (counter.count === 0) return;
    setCount(counter, 0);
    nudgeCount(-1);
    tactile('reset');
    store.toast(store.t('reset'));
  }
  function undo() {
    const c = counter;
    if (!c.history.length) return;
    const history = c.history.slice(0, -1);
    const previous = c.history[c.history.length - 1];
    setCount(c, previous, history);
    tactile('adjust');
  }

  function primary() {
    if (mode === 'counter') { changeCount(1); return; }
    const wasRunning = isPomo ? running : isSw ? swRunning : tRunning;
    if (isPomo) { if (wasRunning) store.pomoPause(); else store.pomoStart(); }
    else if (isSw) store.swToggle();
    else { if (wasRunning) store.timerPause(); else store.timerStart(); }
    tactile(wasRunning ? 'pause' : 'start');
  }
  function resetClock() {
    if (isPomo) {
      if (!running && store.device.pomo.remaining === null) return;
      store.pomoResetPhase();
    } else if (isSw) {
      if (!swRunning && swLive === 0) return;
      store.swReset();
    } else {
      if (!tRunning && store.device.timer.remaining === null) return;
      store.timerReset();
    }
    tactile('reset');
  }
  function longAction() {
    if (mode !== 'counter') resetClock();
    else if (!store.device.locked) resetCount();
  }

  function setMode(m: FocusMode) {
    if (store.device.focusMode === m) return;
    store.setDevice({ focusMode: m });
    tactile('adjust');
  }
  function pickPreset(key: PomoPreset) {
    const p = store.data.settings.pomo;
    if (p.preset !== key) {
      store.updateSettings({ pomo: { ...p, preset: key } });
      store.setDevice({ pomo: { phase: 'work', round: 1, endsAt: null, remaining: null } });
      tactile('adjust');
    }
  }
  function skipPhase() {
    store.pomoAdvance(false);
    tactile('lap');
  }
  function pickCounter(id: string) {
    if (id === store.device.activeCounter) editing = { id };
    else {
      store.setDevice({ activeCounter: id });
      tactile('adjust');
    }
  }
  function cycleStep() {
    const step = STEPS[(STEPS.indexOf(counter.step) + 1) % STEPS.length];
    store.saveCounter({ ...$state.snapshot(counter), step });
    store.flush();
    tactile('adjust');
  }

  /* ---------- tap zone ---------- */
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let pressStart: { x: number; y: number } | null = null;
  let suppressClick = false;
  const isControl = (n: EventTarget | null) => n instanceof Element && n.closest('button, input, a, dialog, .frows') && !n.closest('.count');

  function down(e: PointerEvent) {
    if (!e.isPrimary || e.button !== 0) return;
    suppressClick = false;
    if (isControl(e.target)) return;
    pressStart = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => { pressStart = null; suppressClick = true; longAction(); }, LONG_PRESS);
  }
  function move(e: PointerEvent) {
    if (pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 12) { clearTimeout(pressTimer); pressStart = null; }
  }
  function up() { clearTimeout(pressTimer); pressStart = null; }
  function click(e: MouseEvent) {
    if (mode === 'counter') {
      if (e.target instanceof Element && e.target.closest('.count') && (!suppressClick || e.detail === 0)) {
        changeCount(1, e.detail > 0);
      }
      suppressClick = false;
      return;
    }
    if (suppressClick && e.detail !== 0) { suppressClick = false; return; }
    if (isControl(e.target)) return;
    unlockAudio();
    primary();
  }

  /* ---------- wake lock ---------- */
  const wakeSupported = isBundledAndroid || 'wakeLock' in navigator;
  const wakeWanted = $derived(store.device.focusKeepAwake);
  let wakeLock: WakeLockSentinel | null = null;
  let wakeRequest: Promise<boolean> | undefined;
  let mounted = false;
  async function reacquire() {
    if (!wakeSupported || !wakeWanted || !mounted) return false;
    if (isBundledAndroid) { androidSend({ type: 'awake', enabled: true }); return true; }
    if (wakeLock) return true;
    wakeRequest ??= navigator.wakeLock.request('screen').then(async (lock) => {
      if (!mounted || !wakeWanted) { await lock.release(); return false; }
      wakeLock = lock;
      lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; }, { once: true });
      return true;
    }).catch(() => false).finally(() => { wakeRequest = undefined; });
    return wakeRequest;
  }
  async function toggleWake() {
    if (wakeWanted) {
      store.setDevice({ focusKeepAwake: false });
      const lock = wakeLock;
      wakeLock = null;
      if (isBundledAndroid) androidSend({ type: 'awake', enabled: false });
      await lock?.release().catch(() => {});
      store.toast(store.t('wakeOff'));
    } else {
      store.setDevice({ focusKeepAwake: true });
      const applied = await reacquire();
      if (mounted && wakeWanted) store.toast(store.t(applied ? 'wakeOn' : 'wakeFail'));
    }
  }

  /* ---------- fit big number ---------- */
  async function fit() {
    await tick();
    if (!countEl) return;
    countEl.style.fontSize = '';
    const style = getComputedStyle(countEl);
    const avail = countEl.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 2;
    const natural = countEl.querySelector('.digits')?.getBoundingClientRect().width ?? 0;
    if (avail > 0 && natural > avail) {
      const size = parseFloat(style.fontSize);
      countEl.style.fontSize = `${(size * avail) / natural}px`;
    }
  }
  const display = $derived(isPomo ? mmss(left) : isSw ? fmtSw(swLive) : isTimer ? mmss(tLeft) : fmt.format(counter.count));
  // Digits are tabular, so only a change in length (or mode) can change the width.
  $effect(() => { void display.length; void mode; fit(); });
  $effect(() => {
    if (!countEl) return;
    const ro = new ResizeObserver(fit);
    ro.observe(countEl);
    return () => ro.disconnect();
  });

  onMount(() => {
    mounted = true;
    void reacquire();
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || e.repeat || (e.target as Element)?.matches?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      if (mode === 'counter' && !e.ctrlKey && !e.metaKey && !e.altKey && (k === '-' || k === '+')) {
        e.preventDefault();
        changeCount(k === '-' ? -1 : 1);
        return;
      }
      if ((k === 'z' || k === 'я') && !e.ctrlKey && !e.metaKey && mode === 'counter') { e.preventDefault(); undo(); return; }
      if ((k === 'l' || k === 'д') && !e.ctrlKey && !e.metaKey && isSw) { e.preventDefault(); lap(); return; }
      if (e.code === 'Space' || e.code === 'Enter') {
        if ((e.target as Element)?.matches?.('button, a')) return;
        e.preventDefault(); unlockAudio(); primary();
      }
    };
    const onVisible = () => { if (!document.hidden) void reacquire(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisible);
    document.fonts?.ready.then(fit);
    return () => {
      mounted = false;
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisible);
      up();
      goalPulse?.cancel();
      countNudge?.cancel();
      if (isBundledAndroid && wakeWanted) androidSend({ type: 'awake', enabled: false });
      wakeLock?.release().catch(() => {});
    };
  });

  const presets: PomoPreset[] = ['classic', 'short', 'deep', 'custom'];
  const presetCfg = (k: PomoPreset) => (k === 'custom' ? store.data.settings.pomo.custom : POMO[k]);
  const percent = $derived(counter.target > 0 ? Math.min(100, Math.floor(counter.count * 100 / counter.target)) : 0);
  const filledSegments = $derived(counter.target > 0 ? Math.min(
    SCALE_SEGMENTS.length, Math.ceil(counter.count * SCALE_SEGMENTS.length / counter.target),
  ) : 0);
  const ratio = $derived(
    isPomo ? Math.min(1, Math.max(0, 1 - left / total))
      : isSw ? (swLive % 60000) / 60000
      : isTimer ? Math.min(1, Math.max(0, 1 - tLeft / Math.max(tDur, tLeft)))
      : Math.min(1, counter.count / counter.target),
  );
</script>

<div class="page focus-page">
  <div class="modes" use:glassGlide role="tablist" style:--n={MODES.length}>
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
    {#if mode === 'counter'}
      <div class="fcard counter-card">
        <div class="counter-head">
          <button type="button" class="focus-pill counter-title" onclick={() => (picker = 'counter')}>
            <span>{counterName(counter)}</span>{@render chev()}
          </button>
          <button type="button" class="focus-pill counter-settings" aria-label={store.t('settings')}
            title={store.t('settings')} onclick={() => (settingsOpen = true)}>
            <Icon name="settings" size={19} />
          </button>
        </div>
        <div class="counter-core">
          <div class="counter-readout">
            <button class="count" type="button" bind:this={countEl}
              aria-label={`${counterName(counter)}: ${display}, +${counter.step}`}>
              <span class="count-motion" bind:this={countMotion}><Digits text={display} /></span>
              <span class="step-mark more" aria-hidden="true"><Icon name="plus" size={20} /></span>
            </button>
            <button type="button" class="less" aria-label={`${store.t('minus')} ${counter.step}`}
              disabled={counter.count === 0} onclick={(e) => changeCount(-1, e.detail > 0)}>
              <span class="step-mark" aria-hidden="true"><Icon name="minus" size={20} /></span>
            </button>
          </div>
          {#if counter.target > 0}
            <span class="counter-percent">{fmt.format(percent)}%</span>
          {/if}
        </div>
        {#if counter.target > 0}
          <div class="counter-foot">
            <div class="counter-scale" aria-hidden="true">
              <div class="scale-segments">
                {#each SCALE_SEGMENTS as segment}
                  <i class:filled={segment < filledSegments} class:current={segment === filledSegments - 1}></i>
                {/each}
              </div>
              <div class="scale-labels">
                <span>0</span>
                {#if counter.target > 1}<span>{fmt.format(counter.target / 2)}</span>{/if}
                <span>{fmt.format(counter.target)}</span>
              </div>
            </div>
            <div class="goal-pill">
              <span class="goal-halo" bind:this={goalHalo} aria-hidden="true"></span>
              <button type="button" class="focus-pill" onclick={() => (editing = { id: counter.id })}>
                <Icon name={percent === 100 ? 'check' : 'flag'} size={17} />
                {store.t('goalLine')(fmt.format(counter.target))}
                {#if percent === 100}<span class="goal-status">{store.t('goalDone')}</span>{/if}
                {@render chev()}
              </button>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="fcard clock-card" class:pomo-card={isPomo}>
        <div class="ftop">
          {#if isPomo}
            {@const pc = presetCfg(store.data.settings.pomo.preset)}
            <button type="button" class="focus-pill" onclick={() => (picker = 'pomo')}>
              <Icon name="tomato" size={17} />
              {store.t('pomo')[store.data.settings.pomo.preset]} <span>{pc.work}/{pc.short}</span>{@render chev()}
            </button>
            <span class="rdots" role="img" aria-label={store.t('round')(store.device.pomo.round, cfg.every)}>
              {#each Array(cfg.every) as _, k}<i class:done={k < store.device.pomo.round - 1} class:cur={k === store.device.pomo.round - 1}></i>{/each}
            </span>
          {:else if isSw}
            <span class="ftitle"><Icon name="clock" size={17} />{store.t('modeStopwatch')}</span>
            <span class="fmeta">{laps.length ? store.t('laps')(laps.length) : store.t('noLaps')}</span>
          {:else}
            <button type="button" class="focus-pill" onclick={openCustom}>
              <Icon name="clock" size={17} />{store.t('timerFor')(durLabel(tDur))}{@render chev()}
            </button>
          {/if}
        </div>

        <div class="clock-core">
          {#if isPomo}<span class="clock-phase">{store.t('phase')[phase]}</span>{/if}
          <button class="count" type="button" bind:this={countEl}
            aria-label={isPomo ? `${store.t('phase')[phase]} ${display}` : `${store.t(isSw ? 'modeStopwatch' : 'modeTimer')} ${display}`}>
            <Digits text={display} />
          </button>
          <div class="fbar" aria-hidden="true"><i style:transform={`scaleX(${ratio})`}></i></div>
          {#if isPomo}<span class="clock-next">{store.t('next')(store.t('phase')[nextPhase], cfg[nextPhase])}</span>{/if}
        </div>

        <div class="frows clock-options">
          {#if isSw}
            <div class="flaps">
              <div class="frow"><span>{store.t('lap')} {laps.length + 1}</span><span class="fv"><b>{fmtSw(swLive - lastLap)}</b></span></div>
              {#each [...laps].reverse() as at, k (laps.length - k)}
                {@const n = laps.length - k}
                <div class="frow"><span>{store.t('lap')} {n}</span><span class="fv"><b>{fmtSw(at - (laps[n - 2] ?? 0))}</b><small>{fmtSw(at)}</small></span></div>
              {/each}
            </div>
          {:else if isPomo}
            <button type="button" class="focus-pill" onclick={skipPhase}>{store.t('skip')}{@render chev()}</button>
          {:else}
            <button type="button" class="focus-pill" onclick={addMinute}><Icon name="plus" size={17} />{store.t('addMinute')}</button>
          {/if}
          {@render settingsButton()}
        </div>
      </div>
    {/if}
  </div>

  {#if mode !== 'counter'}
    {@const on = isSw ? swRunning : isTimer ? tRunning : running}
    <div class="fkeys">
      {#if isSw}
        {#if swRunning}
          <button type="button" class="key" title="{store.t('lap')} (L)" onclick={lap}>{store.t('lap')}</button>
        {:else}
          <button type="button" class="key" disabled={swLive === 0} onclick={resetClock}>{store.t('resetKey')}</button>
        {/if}
      {:else if isTimer}
        <button type="button" class="key" disabled={!tRunning && store.device.timer.remaining === null} onclick={resetClock}>{store.t('resetKey')}</button>
      {:else if isPomo}
        <button type="button" class="key" title={store.t('pomoReset')} onclick={resetClock}>{store.t('resetKey')}</button>
      {/if}
      <button type="button" class="key pri" onclick={() => { unlockAudio(); primary(); }}>
        {#if on}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5v13M15 5.5v13" stroke-width="3"/></svg>{:else}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>{/if}
        {on ? store.t('pause') : store.t('start')}
      </button>
    </div>
  {/if}
</div>

{#snippet chev()}<span class="chev" aria-hidden="true"><Icon name="right" size={16} /></span>{/snippet}

{#snippet settingsButton()}
  <button type="button" class="focus-pill" onclick={() => (settingsOpen = true)}>
    <Icon name="settings" size={17} />{store.t('settings')}{@render chev()}
  </button>
{/snippet}

{#snippet wakeRow()}
  {#if wakeSupported}
    <button type="button" class="frow" role="switch" aria-checked={wakeWanted} onclick={toggleWake}><span>{store.t('wake')}</span><i class="tg" aria-hidden="true"></i></button>
  {/if}
{/snippet}

{#if settingsOpen}
  <Sheet title={store.t('settings')} onclose={() => (settingsOpen = false)}>
    <div class="focus-options">
      {#if mode === 'counter'}
        <button type="button" class="frow" aria-label={store.t('stepLabel')(counter.step)} onclick={cycleStep}>
          <span>{store.t('rowStep')}</span><span class="fv"><b>+{counter.step}</b>{@render chev()}</span>
        </button>
        <button type="button" class="frow" role="switch" aria-checked={store.device.locked} onclick={() => store.setDevice({ locked: !store.device.locked })}>
          <span>{store.t('lock')}</span><i class="tg" aria-hidden="true"></i>
        </button>
        <button type="button" class="frow" disabled={!counter.history.length} onclick={undo}><span>{store.t('undoLast')}</span>{@render chev()}</button>
      {:else if !isSw}
        {@render soundRow()}
      {/if}
      {@render wakeRow()}
    </div>
  </Sheet>
{/if}

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
        <button type="button" class="tag" role="option" aria-selected={tDur === m * 60000} style:--c="var(--ink)" onclick={() => { setTimerDuration(m * 60000); customOpen = false; }}>{store.t('durMin')(m)}</button>
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
  .focus-page {
    --focus-glass: linear-gradient(155deg, color-mix(in srgb, var(--bg) 55%, var(--key)), transparent 72%), var(--glass-fill);
  }
  .focus-page .zone { flex: 1 0 auto; display: grid; align-items: stretch; min-height: 0; padding: 16px 0 0; -webkit-tap-highlight-color: transparent; }
  .fcard.counter-card, .fcard.clock-card { display: grid; grid-template-rows: auto minmax(min-content, 1fr) auto; padding-bottom: 16px; }
  .counter-card { cursor: default; }
  .counter-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; }
  .counter-foot { display: grid; gap: 10px; min-width: 0; }
  .focus-pill {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; max-width: 100%;
    padding: 0 12px; border-radius: 999px; background: color-mix(in srgb, var(--ink) 7%, transparent); color: var(--ink);
    box-shadow: inset 0 0 0 1px var(--line); font-size: 13px; touch-action: manipulation;
  }
  .focus-pill:active { background: color-mix(in srgb, var(--ink) 14%, transparent); }
  .counter-title span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
  .counter-title { justify-self: start; min-width: 0; }
  .counter-title .chev { flex: none; }
  .counter-settings { width: 44px; padding: 0; }
  .counter-core { display: grid; align-content: center; min-width: 0; padding-block: 12px; }
  .counter-readout { position: relative; display: grid; min-width: 0; }
  .count-motion { display: grid; place-items: center; }
  .focus-page .fcard.counter-card .count {
    position: relative; min-width: 0; margin: 0; padding-inline: 20%; font-size: clamp(72px, 34cqi, 164px);
  }
  .counter-card .count:focus-visible, .less:focus-visible { outline-offset: -3px; }
  .less {
    position: absolute; inset: 0 auto 0 0; width: 20%; display: grid; place-items: center start;
    border-radius: 12px; color: var(--muted); touch-action: manipulation;
  }
  .less:disabled { opacity: .35; }
  .step-mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; color: var(--muted); }
  .step-mark.more { position: absolute; inset-inline-end: 0; }
  .less:active:not(:disabled) .step-mark, .count:active .step-mark { background: color-mix(in srgb, var(--ink) 12%, transparent); color: var(--ink); }
  .counter-percent { justify-self: center; font: 500 15px var(--mono); color: var(--muted); }
  .counter-scale { display: grid; gap: 7px; }
  .scale-segments { display: grid; grid-template-columns: repeat(20, minmax(0, 1fr)); gap: clamp(3px, 1.5cqi, 6px); align-items: end; height: 22px; }
  .scale-segments i { height: 10px; border-radius: 2px; background: color-mix(in srgb, var(--ink) 18%, transparent); }
  .scale-segments i:nth-child(5n) { height: 16px; }
  .scale-segments .filled { background: var(--ink); }
  .scale-segments i.current { height: 22px; }
  .scale-labels { position: relative; display: flex; justify-content: space-between; font: 500 10px var(--mono); color: var(--muted); }
  .scale-labels span:nth-child(2):not(:last-child) { position: absolute; left: 50%; transform: translateX(-50%); }
  .goal-pill { position: relative; min-width: 0; }
  .goal-pill button { width: 100%; justify-content: flex-start; }
  .goal-pill .chev { margin-inline-start: auto; }
  .goal-status { color: var(--muted); }
  .goal-halo {
    position: absolute; inset: -3px; border: 2px solid var(--ink); border-radius: 999px;
    opacity: 0; pointer-events: none;
  }
  @media (min-height: 550px) {
    :global(.shell:has(.counter-card) ~ .toast) {
      top: calc(env(safe-area-inset-top) + clamp(130px, 21svh, 180px));
      bottom: auto;
    }
  }
  .focus-options .frow { padding-inline: 8px; }
  .fcard {
    container-type: inline-size; border-radius: 26px; padding: 16px 18px 0; overflow: hidden;
    background: var(--focus-glass);
    box-shadow: var(--glass-edge), var(--glass-lift);
  }
  .ftop { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; min-height: 44px; font-size: 13px; color: var(--muted); }
  .ftitle { display: inline-flex; align-items: center; gap: 8px; min-width: 0; color: var(--ink); font-size: 15px; font-weight: 600; }
  .fmeta { flex: none; }
  .rdots { display: inline-flex; gap: 5px; }
  .rdots i { width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1.3px var(--muted); }
  .rdots i.done, .rdots i.cur { background: var(--ink); box-shadow: none; }
  .rdots i.cur { width: 16px; border-radius: 4px; }
  .clock-core { display: grid; align-content: center; justify-items: center; min-width: 0; padding-block: 14px; }
  .clock-phase { color: var(--ink); font-size: 15px; font-weight: 600; }
  .clock-next { margin-top: 10px; color: var(--muted); font-size: 13px; }
  .focus-page .fcard .count {
    display: grid; place-items: center; min-height: clamp(96px, 15svh, 136px); margin: 6px 0 10px;
    font-family: var(--sans); font-size: clamp(48px, 24cqi, 112px);
    font-weight: 650; letter-spacing: -.045em;
  }
  .focus-page .count :global(.digits .ghost) { visibility: hidden; }
  .fbar { width: 100%; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--ink) 10%, transparent); overflow: hidden; }
  .fbar i { display: block; height: 100%; border-radius: 2px; background: var(--ink); transform-origin: left center; }
  .pomo-card .fbar i { background: var(--red); }
  .clock-options { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; }
  .frow {
    display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 0 18px;
    color: var(--ink); font-size: 15px; text-align: left; font-variant-numeric: tabular-nums; cursor: default;
  }
  .frow + .frow { border-top: 1px solid color-mix(in srgb, var(--line) 72%, transparent); }
  button.frow { cursor: pointer; transition: background-color 150ms ease; }
  @media (hover: hover) and (pointer: fine) {
    button.frow:hover { background: color-mix(in srgb, var(--ink) 4%, transparent); }
  }
  button.frow:active { background: color-mix(in srgb, var(--ink) 7%, transparent); }
  button.frow:disabled { opacity: .4; cursor: default; background: none; }
  .fv { display: inline-flex; align-items: center; gap: 8px; min-width: 0; color: var(--muted); }
  .fv b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); font-weight: 500; }
  .fv small { font-size: 12px; }
  .chev { display: grid; color: var(--muted); opacity: .7; }
  .flaps {
    flex: 0 0 100%; max-height: 124px; overflow-y: auto; cursor: default;
    border: 1px solid var(--line); border-radius: 14px;
  }
  .flaps .frow { padding-inline: 12px; min-height: 40px; }
  /* Switch: the row is the control, this is its state. */
  .tg {
    position: relative; flex: none; width: 44px; height: 26px; border-radius: 99px;
    background: var(--glass-lens); box-shadow: var(--glass-edge);
  }
  .tg::before, .tg::after { content: ''; position: absolute; border-radius: inherit; }
  .tg::before { inset: 0; background: var(--primary); box-shadow: var(--glass-edge); opacity: 0; transition: opacity 150ms ease; }
  .tg::after {
    inset: 3px auto 3px 3px; width: 20px;
    background: linear-gradient(155deg, var(--key-hi), transparent 72%), var(--bg);
    box-shadow: var(--glass-lens-edge);
    transition: transform 240ms var(--ease);
  }
  [aria-checked='true'] .tg::before { opacity: 1; }
  [aria-checked='true'] .tg::after { background: var(--on-primary); transform: translateX(18px); }
  button[role='switch']:active .tg::after { transform: scaleX(1.13); }
  button[role='switch'][aria-checked='true']:active .tg::after { transform: translateX(18px) scaleX(1.13); }
  .fkeys { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; padding-top: 16px; }
  .fkeys .key {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 56px;
    font-family: var(--mono); font-size: 13px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
  }
  .fkeys .key {
    --k-bg: var(--focus-glass); --k-ink: var(--ink);
    border-radius: 20px; box-shadow: var(--glass-edge), var(--glass-lift);
    transition: transform 150ms var(--ease), opacity 150ms ease;
  }
  .fkeys .key.pri {
    --k-bg: linear-gradient(160deg, color-mix(in srgb, var(--on-primary) 22%, transparent), transparent 65%), var(--primary);
    --k-ink: var(--on-primary);
  }
  .fkeys .key:active { transform: scale(.97); }
  .fkeys .key:disabled { opacity: .35; cursor: default; transform: none; }
  .fkeys svg { width: 18px; height: 18px; }
  .plist { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .plabel { margin: 4px 0 10px; color: var(--muted); font-size: 13px; }
  .modes { margin-top: 6px; }
  .linked {
    display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
    max-width: 100%; margin-top: 12px; height: 34px; padding: 0 6px 0 12px;
    border-radius: 14px; background: var(--focus-glass); box-shadow: var(--glass-edge);
    font-size: 14px; font-weight: 600;
  }
  .ldot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: var(--c); }
  .ltitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .linked button { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px; color: var(--muted); }
  .linked button:hover { background: var(--soft); color: var(--ink); }
  .nums.two { grid-template-columns: 1fr 1fr; margin-bottom: 16px; }
  .set-time { margin-top: 4px; }
</style>
