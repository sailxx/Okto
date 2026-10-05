<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import CounterEditor from '../components/CounterEditor.svelte';
  import { store } from '../lib/store.svelte';
  import { POMO, STEPS, type Counter, type PomoPreset } from '../lib/model';
  import { buzz, unlockAudio } from '../lib/alerts';
  import { locale } from '../lib/i18n';

  const LONG_PRESS = 650;
  const isPomo = $derived(store.device.focusMode === 'pomodoro');
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

  /* ---------- pomodoro view ---------- */
  const cfg = $derived(store.pomoCfg());
  const left = $derived.by(() => { void store.now; return store.pomoLeft(); });
  const total = $derived(store.phaseMs());
  const running = $derived(Boolean(store.device.pomo.endsAt));
  const phase = $derived(store.device.pomo.phase);
  const nextPhase = $derived(phase === 'work' ? (store.device.pomo.round % cfg.every === 0 ? 'long' : 'short') : 'work');

  $effect(() => {
    if (isPomo && running) document.title = `${mmss(left)} · ${store.t('phase')[phase]} — Okto`;
    else if (!isPomo && counter.count) document.title = `${fmt.format(counter.count)} · ${counterName(counter)} — Okto`;
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
    store.setDevice({ stopwatch: sw.startedAt ? { elapsed: swMs, startedAt: null } : { ...sw, startedAt: Date.now() } });
  }

  function primary() {
    if (isPomo) { if (running) store.pomoPause(); else store.pomoStart(); if (store.data.settings.vibrate) buzz(8); }
    else changeCount(1);
  }
  function longAction() {
    if (isPomo) { store.pomoResetPhase(); if (store.data.settings.vibrate) buzz(30); }
    else if (!store.device.locked) resetCount();
  }

  function setMode(m: 'counter' | 'pomodoro') { if (store.device.focusMode !== m) store.setDevice({ focusMode: m }); }
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
  const display = $derived(isPomo ? mmss(left) : fmt.format(counter.count));
  $effect(() => { void display; fit(); });

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || e.repeat || (e.target as Element)?.matches?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      if ((k === 'z' || k === 'я') && !e.ctrlKey && !e.metaKey && !isPomo) { e.preventDefault(); undo(); return; }
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
</script>

<div class="page focus-page">
  <div class="modes" role="tablist" style:--i={isPomo ? 1 : 0}>
    <span class="modes-thumb" aria-hidden="true"></span>
    <button type="button" role="tab" aria-selected={!isPomo} onclick={() => setMode('counter')}>{store.t('modeCounter')}</button>
    <button type="button" role="tab" aria-selected={isPomo} onclick={() => setMode('pomodoro')}>Pomodoro</button>
  </div>

  <section class="heading">
    <button class="name" type="button" onclick={() => (isPomo ? null : (editing = { id: counter.id }))}>
      {isPomo ? store.t('phase')[phase] : counterName(counter)}
    </button>
    <p class="meta">
      {#if isPomo}
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

  <div class="tags" role="listbox">
    {#if isPomo}
      {#each presets as key}
        <button type="button" class="tag" role="option" aria-selected={store.data.settings.pomo.preset === key} style:--c="var(--red)" onclick={() => pickPreset(key)}>
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

  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="zone"
    class:locked={!isPomo && store.device.locked}
    class:paused={isPomo && !running && left < total}
    onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onpointerleave={up}
    oncontextmenu={(e) => e.preventDefault()}
    onclick={click}
  >
    <div class="block">
      <button class="count" class:tick={tickAnim} type="button" bind:this={countEl}
        aria-label={isPomo ? `${store.t('phase')[phase]} ${display}` : `${counterName(counter)}: ${counter.count}`}>
        <span>{display}</span>
      </button>
      <div class="progress" aria-hidden="true">
        <span style:width="{isPomo ? Math.min(100, Math.max(0, (1 - left / total) * 100)) : percent}%"></span>
      </div>
      <div class="progress-line">
        {#if isPomo}
          <span>{store.t('next')(store.t('phase')[nextPhase], cfg[nextPhase])}</span>
          <span>{cfg[phase]} {store.t('min')}</span>
        {:else}
          <span>{store.t('of')(fmt.format(counter.count), fmt.format(counter.target))}{#if swMs > 0 || store.device.stopwatch.startedAt} · {mmss(swMs)}{/if}</span>
          <span>{percent}%</span>
        {/if}
      </div>
    </div>
  </div>

  <footer class="bottom">
    <p class="hint">{isPomo ? store.t('hintPomo') : store.device.locked ? store.t('hintLocked') : store.t('hintCounter')}</p>

    {#if isPomo}
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

{#snippet wake()}
  <button class="circle" type="button" aria-pressed={wakeWanted} aria-label={store.t('wake')} title={store.t('wake')} onclick={toggleWake}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/><path d="M10 9.5l1.5 1.5 3-3"/></svg>
  </button>
{/snippet}

{#if editing}
  <CounterEditor id={editing.id} onclose={() => (editing = null)} />
{/if}

<style>
  .modes { margin-top: 6px; }
  .linked {
    display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
    max-width: 100%; margin-top: 12px; height: 34px; padding: 0 6px 0 12px;
    border-radius: 99px; background: color-mix(in srgb, var(--c) 14%, transparent);
    font-size: 14px; font-weight: 600;
  }
  .ldot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: var(--c); }
  .ltitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .linked button { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; color: var(--muted); }
  .linked button:hover { background: var(--soft); color: var(--ink); }
  .sound[aria-pressed='true'] { background: none; color: inherit; }
</style>
