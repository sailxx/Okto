(() => {
  'use strict';

  /* ================= Constants ================= */
  const KEY = 'okto-v2';
  const LEGACY_KEY = 'okto-counter-v1';
  const STEPS = [1, 5, 10];
  const LONG_PRESS = 650;
  const COLORS = ['#0090ff', '#30a46c', '#12a594', '#8e4ec6', '#e93d82', '#e5484d', '#f76b15', '#ffb224', '#6b6e76'];
  const THEMES = {
    system: ['#fafafa', '#0e0e10'],
    light: ['#fafafa', '#e4e5e8'],
    dark: ['#0e0e10', '#2a2b30'],
    paper: ['#f4efe6', '#2a251d'],
    mint: ['#edf5f0', '#13241a'],
    midnight: ['#0f1522', '#e8edf7'],
    oled: ['#000000', '#ffffff'],
  };
  const POMO = {
    classic: { work: 25, short: 5, long: 15, every: 4 },
    short: { work: 15, short: 3, long: 10, every: 4 },
    deep: { work: 50, short: 10, long: 30, every: 2 },
  };

  /* ================= i18n ================= */
  const FLAGS = {
    ru: '<svg class="flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039a6"/><rect y="13.33" width="30" height="6.67" fill="#d52b1e"/></svg>',
    en: '<svg class="flag" viewBox="0 0 60 40" aria-hidden="true"><clipPath id="fc"><rect width="60" height="40"/></clipPath><g clip-path="url(#fc)"><rect width="60" height="40" fill="#012169"/><path d="M0 0l60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0l60 40M60 0L0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#c8102e" stroke-width="7"/></g></svg>',
  };
  const I18N = {
    ru: {
      modeCounter: 'Счётчик', counter: 'Счётчик', settings: 'Настройки', close: 'Закрыть',
      lock: 'Блокировка', unlock: 'Снять блокировку', undo: 'Отменить', minus: 'Минус шаг', stopwatch: 'Секундомер',
      wake: 'Не гасить экран', pomoReset: 'Сбросить этап', start: 'Старт', pause: 'Пауза', skip: 'Пропустить этап', sound: 'Звук',
      language: 'Язык', theme: 'Тема', alerts: 'Оповещения', notifications: 'Уведомления в браузере', soundLabel: 'Звук', vibration: 'Вибрация',
      autoStart: 'Автозапуск следующего этапа', customTitle: 'Режим «Свой», минуты', focus: 'Фокус', shortBreak: 'Перерыв', longBreak: 'Длинный', every: 'Длинный каждые',
      resetStopwatch: 'Сбросить секундомер', share: 'Поделиться', done: 'Готово', name: 'Название', goal: 'Цель', color: 'Цвет', delete: 'Удалить', save: 'Сохранить',
      sure: 'Точно удалить?', newTag: 'Новый тег', editTag: 'Тег', add: 'Тег',
      themes: { system: 'Системная', light: 'Светлая', dark: 'Тёмная', paper: 'Бумага', mint: 'Мята', midnight: 'Полночь', oled: 'OLED' },
      pomo: { classic: 'Классика', short: 'Короткий', deep: 'Глубокий', custom: 'Свой' },
      phase: { work: 'Фокус', short: 'Перерыв', long: 'Длинный перерыв' },
      goalLine: (g) => `Цель ${g}`, goalDone: 'выполнена', of: (a, b) => `${a} из ${b}`,
      round: (r, n) => `Раунд ${r} из ${n}`, today: (n) => `сегодня ${n} ${plural(n, 'фокус', 'фокуса', 'фокусов')}`,
      next: (p, m) => `Дальше: ${p.toLowerCase()} ${m} мин`,
      hintCounter: 'Тап — счёт · удержание — сброс', hintLocked: 'Счёт заблокирован',
      hintPomo: 'Тап — старт/пауза · удержание — сброс',
      reset: 'Сброшено · можно отменить', locked: 'Счёт заблокирован', copied: 'Скопировано',
      goalReachedTitle: 'Цель достигнута', goalReachedBody: (n, g) => `${n}: ${g} — отличная работа!`,
      workDoneTitle: 'Фокус завершён', workDoneBody: (m) => `Время отдохнуть: ${m} мин`,
      breakDoneTitle: 'Перерыв окончен', breakDoneBody: 'Пора возвращаться к делу',
      notifyUnsupported: 'Этот браузер не поддерживает уведомления', notifyDenied: 'Разрешите уведомления для сайта в настройках браузера',
      notifyOn: 'Уведомления включены', wakeOn: 'Экран не будет гаснуть', wakeOff: 'Экран может гаснуть', wakeFail: 'Не удалось удержать экран',
      shareText: (n, c, g) => `${n}: ${c} из ${g} — посчитано в Okto`, stepLabel: (s) => `Шаг: ${s}`,
      title: 'Okto — счётчик и Pomodoro', invalidGoal: 'Укажите число от 1 до 999 999',
    },
    en: {
      modeCounter: 'Counter', counter: 'Counter', settings: 'Settings', close: 'Close',
      lock: 'Lock', unlock: 'Unlock', undo: 'Undo', minus: 'Minus step', stopwatch: 'Stopwatch',
      wake: 'Keep screen on', pomoReset: 'Reset phase', start: 'Start', pause: 'Pause', skip: 'Skip phase', sound: 'Sound',
      language: 'Language', theme: 'Theme', alerts: 'Alerts', notifications: 'Browser notifications', soundLabel: 'Sound', vibration: 'Vibration',
      autoStart: 'Auto‑start next phase', customTitle: '“Custom” mode, minutes', focus: 'Focus', shortBreak: 'Break', longBreak: 'Long', every: 'Long every',
      resetStopwatch: 'Reset stopwatch', share: 'Share', done: 'Done', name: 'Name', goal: 'Goal', color: 'Colour', delete: 'Delete', save: 'Save',
      sure: 'Delete for sure?', newTag: 'New tag', editTag: 'Tag', add: 'Tag',
      themes: { system: 'System', light: 'Light', dark: 'Dark', paper: 'Paper', mint: 'Mint', midnight: 'Midnight', oled: 'OLED' },
      pomo: { classic: 'Classic', short: 'Short', deep: 'Deep work', custom: 'Custom' },
      phase: { work: 'Focus', short: 'Break', long: 'Long break' },
      goalLine: (g) => `Goal ${g}`, goalDone: 'reached', of: (a, b) => `${a} of ${b}`,
      round: (r, n) => `Round ${r} of ${n}`, today: (n) => `${n} ${n === 1 ? 'focus' : 'focuses'} today`,
      next: (p, m) => `Next: ${p.toLowerCase()} ${m} min`,
      hintCounter: 'Tap — count · hold — reset', hintLocked: 'Counter locked',
      hintPomo: 'Tap — start/pause · hold — reset',
      reset: 'Reset · you can undo', locked: 'Counter locked', copied: 'Copied',
      goalReachedTitle: 'Goal reached', goalReachedBody: (n, g) => `${n}: ${g} — great job!`,
      workDoneTitle: 'Focus complete', workDoneBody: (m) => `Take a break: ${m} min`,
      breakDoneTitle: 'Break is over', breakDoneBody: 'Time to get back to work',
      notifyUnsupported: 'This browser does not support notifications', notifyDenied: 'Allow notifications for this site in your browser settings',
      notifyOn: 'Notifications on', wakeOn: 'Screen will stay on', wakeOff: 'Screen may turn off', wakeFail: 'Could not keep the screen on',
      shareText: (n, c, g) => `${n}: ${c} of ${g} — counted with Okto`, stepLabel: (s) => `Step: ${s}`,
      title: 'Okto — counter & Pomodoro', invalidGoal: 'Enter a number from 1 to 999,999',
    },
  };

  function plural(n, one, few, many) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }

  /* ================= State ================= */
  const uid = () => Math.random().toString(36).slice(2, 9);
  const int = (v, min, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(v) && v >= min && v <= max;
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const browserLang = (navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';

  function makePreset(p = {}) {
    return {
      id: typeof p.id === 'string' ? p.id : uid(),
      name: typeof p.name === 'string' ? p.name.slice(0, 24) : '',
      target: int(p.target, 1, 999999) ? p.target : 75,
      step: STEPS.includes(p.step) ? p.step : 1,
      count: int(p.count, 0) ? p.count : 0,
      history: Array.isArray(p.history) ? p.history.filter((v) => int(v, 0)).slice(-50) : [],
      color: COLORS.includes(p.color) ? p.color : COLORS[0],
    };
  }

  function defaults() {
    const first = makePreset();
    return {
      v: 2, lang: browserLang, theme: 'system', mode: 'counter',
      presets: [first], active: first.id, locked: false,
      stopwatch: { elapsed: 0, startedAt: null },
      notify: false, sound: true, vibrate: true,
      pomo: {
        preset: 'classic', custom: { ...POMO.classic }, autoStart: true,
        phase: 'work', round: 1, remaining: null, endsAt: null,
        today: { date: todayKey(), n: 0 },
      },
    };
  }

  function load() {
    const base = defaults();
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
    if (!s) {
      // Migrate the single counter from v1.
      try {
        const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
        if (old) {
          base.presets = [makePreset({ ...old, name: old.name && old.name !== 'Счётчик' ? old.name : '' })];
          base.active = base.presets[0].id;
          if (THEMES[old.theme]) base.theme = old.theme;
          base.locked = old.locked === true;
          if (old.timer && int(old.timer.elapsed, 0)) base.stopwatch.elapsed = old.timer.elapsed;
        }
      } catch { /* ignore */ }
      return base;
    }
    const st = { ...base };
    st.lang = I18N[s.lang] ? s.lang : base.lang;
    st.theme = THEMES[s.theme] ? s.theme : base.theme;
    st.mode = s.mode === 'pomodoro' ? 'pomodoro' : 'counter';
    st.presets = Array.isArray(s.presets) && s.presets.length ? s.presets.slice(0, 20).map(makePreset) : base.presets;
    st.active = st.presets.some((p) => p.id === s.active) ? s.active : st.presets[0].id;
    st.locked = s.locked === true;
    st.stopwatch = {
      elapsed: int(s.stopwatch?.elapsed, 0) ? s.stopwatch.elapsed : 0,
      startedAt: int(s.stopwatch?.startedAt, 1) ? s.stopwatch.startedAt : null,
    };
    st.notify = s.notify === true;
    st.sound = s.sound !== false;
    st.vibrate = s.vibrate !== false;
    const p = s.pomo || {};
    const c = p.custom || {};
    st.pomo = {
      preset: POMO[p.preset] || p.preset === 'custom' ? p.preset : 'classic',
      custom: {
        work: int(c.work, 1, 180) ? c.work : 25, short: int(c.short, 1, 60) ? c.short : 5,
        long: int(c.long, 1, 90) ? c.long : 15, every: int(c.every, 2, 12) ? c.every : 4,
      },
      autoStart: p.autoStart !== false,
      phase: ['work', 'short', 'long'].includes(p.phase) ? p.phase : 'work',
      round: int(p.round, 1, 12) ? p.round : 1,
      remaining: int(p.remaining, 0) ? p.remaining : null,
      endsAt: int(p.endsAt, 1) ? p.endsAt : null,
      today: p.today && p.today.date === todayKey() && int(p.today.n, 0) ? p.today : { date: todayKey(), n: 0 },
    };
    return st;
  }

  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* optional */ } };
  const t = (k) => I18N[state.lang][k];
  const fmt = () => new Intl.NumberFormat(state.lang === 'ru' ? 'ru-RU' : 'en-US');
  const active = () => state.presets.find((p) => p.id === state.active) || state.presets[0];
  const presetName = (p) => p.name || t('counter');

  /* ================= DOM ================= */
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const el = {
    zone: $('zone'), count: $('countButton'), display: $('display'), name: $('nameButton'), meta: $('meta'),
    tags: $('tags'), fill: $('progressFill'), pText: $('progressText'), pRight: $('progressRight'), hint: $('hint'),
    counterControls: $('counterControls'), pomoControls: $('pomoControls'),
    lock: $('lockButton'), undo: $('undoButton'), minus: $('minusButton'), step: $('stepButton'), stopwatch: $('stopwatchButton'),
    play: $('pomoPlay'), sound: $('soundButton'), lang: $('langButton'), toast: $('toast'),
    settings: $('settingsDialog'), preset: $('presetDialog'),
  };
  const wakeButtons = [...document.querySelectorAll('.wake')];
  const modeButtons = [...document.querySelectorAll('[data-mode]')];

  /* ================= Helpers ================= */
  let toastTimer;
  function toast(text) {
    el.toast.textContent = text;
    el.toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('visible'), 2400);
  }
  const mmss = (ms) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    const p = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  };
  const buzz = (pattern) => { if (state.vibrate) navigator.vibrate?.(pattern); };

  let audio;
  function unlockAudio() {
    if (audio) return;
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ }
  }
  function chime(times = 3) {
    if (!state.sound || !audio) return;
    if (audio.state === 'suspended') audio.resume();
    const now = audio.currentTime;
    for (let i = 0; i < times; i++) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = i % 2 ? 660 : 880;
      const start = now + i * 0.28;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    }
  }

  /* ================= Notifications ================= */
  let swReg = null;
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; }).catch(() => {});
  }

  async function notify(title, body) {
    toast(`${title} · ${body}`);
    if (!state.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body, icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', tag: 'okto', renotify: true };
    try {
      const reg = swReg || (await navigator.serviceWorker?.getRegistration());
      if (reg) { await reg.showNotification(title, opts); return; }
    } catch { /* fall back */ }
    try { new Notification(title, opts); } catch { /* not allowed here */ }
  }

  function alertUser(title, body) {
    chime();
    buzz([60, 80, 60, 80, 120]);
    notify(title, body);
  }

  /* ================= Theme & language ================= */
  const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  function applyTheme() {
    const resolved = state.theme === 'system' ? (darkQuery?.matches ? 'dark' : 'light') : state.theme;
    root.dataset.theme = resolved;
    root.dataset.mode = state.mode;
    root.style.setProperty('--tag', active().color);
    const bg = getComputedStyle(document.body).backgroundColor;
    document.querySelector('meta[name="theme-color"]').content = bg;
  }
  darkQuery?.addEventListener?.('change', () => { if (state.theme === 'system') applyTheme(); });

  function applyLanguage() {
    root.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((n) => {
      n.setAttribute('aria-label', t(n.dataset.i18nAria));
      n.title = t(n.dataset.i18nAria);
    });
    const other = state.lang === 'ru' ? 'en' : 'ru';
    el.lang.innerHTML = `${FLAGS[other]}<span>${other.toUpperCase()}</span>`;
    el.lang.setAttribute('aria-label', state.lang === 'ru' ? 'Switch to English' : 'Переключить на русский');
    document.querySelectorAll('#langSeg [data-lang]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
      if (!b.querySelector('.flag')) b.insertAdjacentHTML('afterbegin', FLAGS[b.dataset.lang]);
    });
    document.querySelector('meta[name="description"]').content = state.lang === 'ru'
      ? 'Okto — минималистичный счётчик в один тап и Pomodoro‑таймер. Без регистрации и рекламы.'
      : 'Okto — a minimalist one‑tap counter and Pomodoro timer. No sign‑up, no ads.';
  }

  /* ================= Pomodoro engine ================= */
  const pomoCfg = () => (state.pomo.preset === 'custom' ? state.pomo.custom : POMO[state.pomo.preset]);
  const phaseMs = (phase = state.pomo.phase) => pomoCfg()[phase === 'work' ? 'work' : phase] * 60000;
  const pomoRunning = () => Boolean(state.pomo.endsAt);
  const pomoLeft = () => (pomoRunning() ? state.pomo.endsAt - Date.now() : (state.pomo.remaining ?? phaseMs()));

  function pomoStart() {
    if (pomoRunning()) return;
    state.pomo.endsAt = Date.now() + pomoLeft();
    state.pomo.remaining = null;
    save(); render();
  }
  function pomoPause() {
    if (!pomoRunning()) return;
    state.pomo.remaining = Math.max(0, state.pomo.endsAt - Date.now());
    state.pomo.endsAt = null;
    save(); render();
  }
  function pomoResetPhase() {
    state.pomo.endsAt = null;
    state.pomo.remaining = null;
    save(); render();
  }
  function pomoAdvance(natural) {
    const p = state.pomo;
    const cfg = pomoCfg();
    const finished = p.phase;
    if (p.today.date !== todayKey()) p.today = { date: todayKey(), n: 0 };
    if (finished === 'work') {
      if (natural) p.today.n += 1;
      p.phase = p.round % cfg.every === 0 ? 'long' : 'short';
    } else {
      p.round = finished === 'long' ? 1 : p.round + 1;
      p.phase = 'work';
    }
    p.remaining = null;
    p.endsAt = natural && p.autoStart ? Date.now() + phaseMs() : null;
    save(); render();
    if (natural) {
      if (finished === 'work') alertUser(t('workDoneTitle'), t('workDoneBody')(cfg[p.phase]));
      else alertUser(t('breakDoneTitle'), t('breakDoneBody'));
    }
  }

  /* ================= Counter actions ================= */
  function pushHistory(p, v) { p.history = [...p.history, v].slice(-50); }

  function changeCount(dir) {
    const p = active();
    if (state.locked) { toast(t('locked')); return; }
    const prev = p.count;
    p.count = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, p.count + dir * p.step));
    if (p.count === prev) return;
    pushHistory(p, prev);
    save(); render();
    el.count.classList.remove('tick'); void el.count.offsetWidth; el.count.classList.add('tick');
    buzz(6);
    if (dir > 0 && prev < p.target && p.count >= p.target) {
      alertUser(t('goalReachedTitle'), t('goalReachedBody')(presetName(p), fmt().format(p.target)));
    }
  }
  function resetCount() {
    const p = active();
    if (p.count === 0) return;
    pushHistory(p, p.count);
    p.count = 0;
    save(); render();
    buzz(30);
    toast(t('reset'));
  }
  function undo() {
    const p = active();
    if (!p.history.length) return;
    p.count = p.history.pop();
    save(); render();
  }

  const swMs = () => state.stopwatch.elapsed + (state.stopwatch.startedAt ? Date.now() - state.stopwatch.startedAt : 0);
  function toggleStopwatch() {
    const s = state.stopwatch;
    if (s.startedAt) { s.elapsed = swMs(); s.startedAt = null; } else s.startedAt = Date.now();
    save(); render();
  }

  /* ================= Rendering ================= */
  function renderTags() {
    const frag = document.createDocumentFragment();
    if (state.mode === 'counter') {
      state.presets.forEach((p) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tag';
        b.dataset.id = p.id;
        b.style.setProperty('--c', p.color);
        b.setAttribute('role', 'option');
        b.setAttribute('aria-selected', String(p.id === state.active));
        b.append(presetName(p), Object.assign(document.createElement('small'), { textContent: fmt().format(p.target) }));
        frag.append(b);
      });
      if (state.presets.length < 20) {
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'tag add';
        add.dataset.add = '1';
        add.textContent = `+ ${t('add')}`;
        frag.append(add);
      }
    } else {
      ['classic', 'short', 'deep', 'custom'].forEach((key) => {
        const cfg = key === 'custom' ? state.pomo.custom : POMO[key];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tag';
        b.dataset.pomo = key;
        b.style.setProperty('--c', 'var(--red)');
        b.setAttribute('role', 'option');
        b.setAttribute('aria-selected', String(state.pomo.preset === key));
        b.append(t('pomo')[key], Object.assign(document.createElement('small'), { textContent: `${cfg.work}/${cfg.short}` }));
        frag.append(b);
      });
    }
    el.tags.replaceChildren(frag);
  }

  let lastTags = '';
  function render() {
    applyTheme();
    const isPomo = state.mode === 'pomodoro';
    modeButtons.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === state.mode)));
    el.counterControls.hidden = isPomo;
    el.pomoControls.hidden = !isPomo;

    const tagsKey = JSON.stringify([state.mode, state.lang, state.active, state.presets.map((p) => [p.name, p.color, p.target]), state.pomo.preset, state.pomo.custom]);
    if (tagsKey !== lastTags) { renderTags(); lastTags = tagsKey; }

    if (isPomo) renderPomo(); else renderCounter();
    fitDisplay();
  }

  function renderCounter() {
    const p = active();
    const f = fmt();
    const percent = Math.min(100, Math.floor((p.count / p.target) * 100));
    const done = p.count >= p.target;
    el.display.textContent = f.format(p.count);
    el.name.textContent = presetName(p);
    el.meta.innerHTML = '';
    el.meta.append(t('goalLine')(f.format(p.target)));
    if (done) { el.meta.append(' · '); el.meta.append(Object.assign(document.createElement('b'), { textContent: t('goalDone') })); }
    el.fill.style.width = `${percent}%`;
    const sw = swMs();
    el.pText.textContent = t('of')(f.format(p.count), f.format(p.target)) + (sw > 0 || state.stopwatch.startedAt ? ` · ${mmss(sw)}` : '');
    el.pRight.textContent = `${percent}%`;
    el.zone.classList.toggle('locked', state.locked);
    el.zone.classList.remove('paused');
    el.lock.setAttribute('aria-pressed', String(state.locked));
    el.lock.setAttribute('aria-label', state.locked ? t('unlock') : t('lock'));
    el.undo.disabled = p.history.length === 0;
    el.minus.disabled = p.count === 0;
    el.step.textContent = `+${p.step}`;
    el.step.setAttribute('aria-label', t('stepLabel')(p.step));
    el.stopwatch.setAttribute('aria-pressed', String(Boolean(state.stopwatch.startedAt)));
    el.hint.textContent = state.locked ? t('hintLocked') : t('hintCounter');
    el.count.setAttribute('aria-label', `${presetName(p)}: ${p.count}`);
    document.title = p.count ? `${f.format(p.count)} · ${presetName(p)} — Okto` : t('title');
  }

  function renderPomo() {
    const p = state.pomo;
    const cfg = pomoCfg();
    const left = pomoLeft();
    const total = phaseMs();
    const running = pomoRunning();
    if (p.today.date !== todayKey()) p.today = { date: todayKey(), n: 0 };
    el.display.textContent = mmss(left);
    el.name.textContent = t('phase')[p.phase];
    el.meta.textContent = `${t('round')(p.round, cfg.every)} · ${t('today')(p.today.n)}`;
    el.fill.style.width = `${Math.min(100, Math.max(0, (1 - left / total) * 100))}%`;
    const nextPhase = p.phase === 'work' ? (p.round % cfg.every === 0 ? 'long' : 'short') : 'work';
    el.pText.textContent = t('next')(t('phase')[nextPhase], cfg[nextPhase]);
    el.pRight.textContent = `${cfg[p.phase]} ${state.lang === 'ru' ? 'мин' : 'min'}`;
    el.zone.classList.remove('locked');
    el.zone.classList.toggle('paused', !running && left < total);
    el.pomoControls.classList.toggle('running', running);
    el.play.setAttribute('aria-label', running ? t('pause') : t('start'));
    el.play.title = el.play.getAttribute('aria-label');
    el.sound.setAttribute('aria-pressed', String(state.sound));
    el.hint.textContent = t('hintPomo');
    el.count.setAttribute('aria-label', `${t('phase')[p.phase]} ${mmss(left)}`);
    document.title = running ? `${mmss(left)} · ${t('phase')[p.phase]} — Okto` : t('title');
  }

  function fitDisplay() {
    el.count.style.fontSize = '';
    const avail = el.count.clientWidth;
    const natural = el.count.scrollWidth;
    if (avail > 0 && natural > avail) {
      const size = parseFloat(getComputedStyle(el.count).fontSize);
      el.count.style.fontSize = `${Math.max(28, (size * avail) / natural)}px`;
    }
  }

  /* ================= Ticker ================= */
  setInterval(() => {
    if (state.mode === 'pomodoro' || pomoRunning()) {
      if (pomoRunning() && Date.now() >= state.pomo.endsAt) pomoAdvance(true);
      else if (state.mode === 'pomodoro') renderPomo();
    }
    if (state.mode === 'counter' && state.stopwatch.startedAt) renderCounter();
  }, 250);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { if (pomoRunning() && Date.now() >= state.pomo.endsAt) pomoAdvance(true); render(); reacquireWake(); }
  });

  /* ================= Wake lock ================= */
  let wakeLock = null;
  let wakeWanted = false;
  if (!('wakeLock' in navigator)) wakeButtons.forEach((b) => { b.hidden = true; });
  async function reacquireWake() {
    if (!wakeWanted || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; syncWake(); });
    } catch { wakeLock = null; }
    syncWake();
  }
  function syncWake() { wakeButtons.forEach((b) => b.setAttribute('aria-pressed', String(wakeWanted))); }
  wakeButtons.forEach((b) => b.addEventListener('click', async () => {
    if (wakeWanted) {
      wakeWanted = false;
      await wakeLock?.release().catch(() => {});
      wakeLock = null;
      toast(t('wakeOff'));
    } else {
      wakeWanted = true;
      await reacquireWake();
      toast(wakeLock ? t('wakeOn') : t('wakeFail'));
      if (!wakeLock) wakeWanted = false;
    }
    syncWake();
  }));

  /* ================= Tap zone ================= */
  let pressTimer = null;
  let pressStart = null;
  let suppressClick = false;
  const isControl = (n) => n.closest('button, input, a, dialog') && !n.closest('#countButton');

  function primary() {
    if (state.mode === 'pomodoro') { if (pomoRunning()) pomoPause(); else pomoStart(); buzz(8); }
    else changeCount(1);
  }
  function longAction() {
    if (state.mode === 'pomodoro') { pomoResetPhase(); buzz(30); }
    else if (!state.locked) resetCount();
  }

  document.addEventListener('pointerdown', unlockAudio, { once: true });
  el.zone.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || isControl(e.target)) return;
    pressStart = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => { pressStart = null; suppressClick = true; longAction(); }, LONG_PRESS);
  });
  el.zone.addEventListener('pointermove', (e) => {
    if (pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 12) { clearTimeout(pressTimer); pressStart = null; }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => el.zone.addEventListener(type, () => { clearTimeout(pressTimer); pressStart = null; }));
  el.zone.addEventListener('contextmenu', (e) => e.preventDefault());
  el.zone.addEventListener('click', (e) => {
    if (suppressClick) { suppressClick = false; return; }
    if (isControl(e.target)) return;
    primary();
  });

  /* ================= Controls ================= */
  modeButtons.forEach((b) => b.addEventListener('click', () => {
    if (state.mode === b.dataset.mode) return;
    state.mode = b.dataset.mode;
    save(); render();
  }));
  el.lang.addEventListener('click', () => { state.lang = state.lang === 'ru' ? 'en' : 'ru'; save(); applyLanguage(); render(); });

  el.lock.addEventListener('click', () => { state.locked = !state.locked; save(); render(); });
  el.undo.addEventListener('click', undo);
  el.minus.addEventListener('click', () => {
    const was = state.locked; state.locked = false; changeCount(-1); state.locked = was; save(); render();
  });
  el.step.addEventListener('click', () => {
    const p = active();
    p.step = STEPS[(STEPS.indexOf(p.step) + 1) % STEPS.length];
    save(); render();
  });
  el.stopwatch.addEventListener('click', toggleStopwatch);

  el.play.addEventListener('click', () => { unlockAudio(); primary(); });
  $('pomoReset').addEventListener('click', pomoResetPhase);
  $('pomoSkip').addEventListener('click', () => pomoAdvance(false));
  el.sound.addEventListener('click', () => { state.sound = !state.sound; unlockAudio(); save(); render(); if (state.sound) chime(1); });

  // Tags: tap to switch, tap the active one to edit, "+" to add.
  el.tags.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.add) { openPreset(null); return; }
    if (b.dataset.pomo) {
      if (state.pomo.preset !== b.dataset.pomo) {
        state.pomo.preset = b.dataset.pomo;
        state.pomo.phase = 'work'; state.pomo.round = 1; state.pomo.endsAt = null; state.pomo.remaining = null;
        save(); render();
      } else if (b.dataset.pomo === 'custom') openSettings('#cWork');
      return;
    }
    if (b.dataset.id === state.active) openPreset(b.dataset.id);
    else { state.active = b.dataset.id; save(); render(); }
  });
  el.name.addEventListener('click', () => { if (state.mode === 'counter') openPreset(state.active); else openSettings('#cWork'); });

  /* ================= Preset dialog ================= */
  let editingId = null;
  let pickedColor = COLORS[0];
  const colorList = $('colorList');
  COLORS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'color-opt'; b.dataset.color = c; b.style.setProperty('--c', c);
    b.setAttribute('aria-label', c);
    colorList.append(b);
  });
  colorList.addEventListener('click', (e) => {
    const b = e.target.closest('[data-color]');
    if (!b) return;
    pickedColor = b.dataset.color;
    syncColors();
  });
  const syncColors = () => colorList.querySelectorAll('[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === pickedColor)));
  const deleteBtn = $('presetDelete');
  let deleteArmed = false;

  function openPreset(id) {
    editingId = id;
    const p = id ? state.presets.find((x) => x.id === id) : null;
    $('presetTitle').textContent = p ? t('editTag') : t('newTag');
    $('presetName').value = p ? p.name : '';
    $('presetName').placeholder = state.lang === 'ru' ? 'Например, отжимания' : 'e.g. Push‑ups';
    $('presetTarget').value = String(p ? p.target : 50);
    const used = new Set(state.presets.map((x) => x.color));
    pickedColor = p ? p.color : (COLORS.find((c) => !used.has(c)) || COLORS[0]);
    syncColors();
    const canDelete = Boolean(p) && state.presets.length > 1;
    deleteBtn.hidden = !canDelete;
    deleteBtn.parentElement.classList.toggle('single', !canDelete);
    deleteArmed = false; deleteBtn.textContent = t('delete');
    el.preset.showModal();
    document.activeElement?.blur();
  }
  deleteBtn.addEventListener('click', () => {
    if (!deleteArmed) { deleteArmed = true; deleteBtn.textContent = t('sure'); return; }
    state.presets = state.presets.filter((p) => p.id !== editingId);
    if (state.active === editingId) state.active = state.presets[0].id;
    save(); el.preset.close(); render();
  });
  $('presetForm').addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'save') return;
    const target = parseInt($('presetTarget').value, 10);
    if (!int(target, 1, 999999)) {
      e.preventDefault();
      $('presetTarget').setCustomValidity(t('invalidGoal'));
      $('presetTarget').reportValidity();
      return;
    }
    const name = $('presetName').value.trim().slice(0, 24);
    if (editingId) {
      Object.assign(state.presets.find((p) => p.id === editingId), { name, target, color: pickedColor });
    } else {
      const p = makePreset({ name, target, color: pickedColor });
      state.presets.push(p);
      state.active = p.id;
    }
    save(); render();
  });
  $('presetTarget').addEventListener('input', (e) => e.target.setCustomValidity(''));

  /* ================= Settings dialog ================= */
  const themeList = $('themeList');
  Object.entries(THEMES).forEach(([key, [a, b]]) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'theme-opt'; btn.dataset.theme = key;
    const sw = document.createElement('i');
    sw.style.setProperty('--a', a); sw.style.setProperty('--b', b);
    btn.append(sw, document.createElement('span'));
    themeList.append(btn);
  });
  function syncSettings() {
    themeList.querySelectorAll('.theme-opt').forEach((b) => {
      b.querySelector('span').textContent = t('themes')[b.dataset.theme];
      b.setAttribute('aria-pressed', String(b.dataset.theme === state.theme));
    });
    $('notifyToggle').checked = state.notify && 'Notification' in window && Notification.permission === 'granted';
    $('soundToggle').checked = state.sound;
    $('vibrateToggle').checked = state.vibrate;
    $('autoToggle').checked = state.pomo.autoStart;
    $('cWork').value = state.pomo.custom.work;
    $('cShort').value = state.pomo.custom.short;
    $('cLong').value = state.pomo.custom.long;
    $('cEvery').value = state.pomo.custom.every;
    if (!('vibrate' in navigator)) $('vibrateToggle').closest('.switch').hidden = true;
  }
  function openSettings(focusSel) {
    syncSettings();
    el.settings.showModal();
    document.activeElement?.blur();
    if (focusSel) document.querySelector(focusSel)?.focus();
  }
  $('settingsButton').addEventListener('click', () => openSettings());
  themeList.addEventListener('click', (e) => {
    const b = e.target.closest('[data-theme]');
    if (!b) return;
    state.theme = b.dataset.theme;
    save(); render(); syncSettings();
  });
  document.querySelectorAll('#langSeg [data-lang]').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang; save(); applyLanguage(); render(); syncSettings();
  }));
  $('notifyToggle').addEventListener('change', async (e) => {
    if (!e.target.checked) { state.notify = false; save(); return; }
    if (!('Notification' in window)) { e.target.checked = false; toast(t('notifyUnsupported')); return; }
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm === 'granted') { state.notify = true; save(); notify('Okto', t('notifyOn')); }
    else { e.target.checked = false; state.notify = false; save(); toast(t('notifyDenied')); }
  });
  $('soundToggle').addEventListener('change', (e) => { state.sound = e.target.checked; unlockAudio(); save(); render(); if (state.sound) chime(1); });
  $('vibrateToggle').addEventListener('change', (e) => { state.vibrate = e.target.checked; save(); buzz(20); });
  $('autoToggle').addEventListener('change', (e) => { state.pomo.autoStart = e.target.checked; save(); });
  [['cWork', 'work', 1, 180], ['cShort', 'short', 1, 60], ['cLong', 'long', 1, 90], ['cEvery', 'every', 2, 12]].forEach(([id, key, min, max]) => {
    $(id).addEventListener('change', (e) => {
      const v = parseInt(e.target.value, 10);
      if (int(v, min, max)) {
        state.pomo.custom[key] = v;
        if (state.pomo.preset === 'custom' && !pomoRunning()) state.pomo.remaining = null;
        save(); render();
      } else e.target.value = state.pomo.custom[key];
    });
  });
  $('stopwatchReset').addEventListener('click', () => { state.stopwatch = { elapsed: 0, startedAt: null }; save(); render(); toast(t('reset')); });
  $('shareButton').addEventListener('click', async () => {
    const p = active();
    const text = t('shareText')(presetName(p), fmt().format(p.count), fmt().format(p.target));
    const url = location.href.split('#')[0];
    if (navigator.share) { try { await navigator.share({ title: 'Okto', text, url }); } catch { /* closed */ } }
    else if (navigator.clipboard?.writeText) { try { await navigator.clipboard.writeText(`${text} ${url}`); toast(t('copied')); } catch { toast(text); } }
    else toast(text);
  });

  /* ================= Keyboard ================= */
  document.addEventListener('keydown', (e) => {
    if (el.settings.open || el.preset.open || e.repeat || e.target.matches?.('input, textarea')) return;
    const k = e.key.toLowerCase();
    if ((k === 'z' || k === 'я') && !e.ctrlKey && !e.metaKey && state.mode === 'counter') { e.preventDefault(); undo(); return; }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (e.target.matches?.('button, a')) return;
      e.preventDefault();
      unlockAudio();
      primary();
    }
  });

  if ('ResizeObserver' in window) new ResizeObserver(fitDisplay).observe(el.count);
  document.fonts?.ready.then(fitDisplay);

  // Catch up on a phase that ended while the page was closed.
  if (pomoRunning() && Date.now() >= state.pomo.endsAt) pomoAdvance(true);
  applyLanguage();
  render();
})();
