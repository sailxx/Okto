(() => {
  const STORAGE_KEY = 'okto-counter-v1';
  const STEPS = [1, 5, 10];
  const LONG_PRESS_MS = 650;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const defaults = {
    count: 0, target: 75, step: 1, history: [],
    theme: prefersDark ? 'dark' : 'light',
    name: 'Счётчик', locked: false,
    timer: { elapsed: 0, startedAt: null },
  };
  let state = structuredClone(defaults);

  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const int = (v, min) => Number.isSafeInteger(v) && v >= min;
    state = {
      count: int(s.count, 0) ? s.count : defaults.count,
      target: int(s.target, 1) ? s.target : defaults.target,
      step: STEPS.includes(s.step) ? s.step : defaults.step,
      history: Array.isArray(s.history) ? s.history.filter((v) => int(v, 0)).slice(-50) : [],
      theme: s.theme === 'dark' || s.theme === 'light' ? s.theme : defaults.theme,
      name: typeof s.name === 'string' && s.name.trim() ? s.name.trim().slice(0, 32) : defaults.name,
      locked: s.locked === true,
      timer: {
        elapsed: int(s.timer?.elapsed, 0) ? s.timer.elapsed : 0,
        startedAt: int(s.timer?.startedAt, 1) ? s.timer.startedAt : null,
      },
    };
  } catch { /* Start fresh if storage is unavailable or invalid. */ }

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const zone = $('zone');
  const countButton = $('countButton');
  const progressFill = $('progressFill');
  const progressText = $('progressText');
  const progressPercent = $('progressPercent');
  const digits = $('digits');
  const meta = $('meta');
  const hint = $('hint');
  const nameButton = $('nameButton');
  const timerButton = $('timerButton');
  const timerValue = $('timerValue');
  const lockButton = $('lockButton');
  const undoButton = $('undoButton');
  const stepButton = $('stepButton');
  const themeButton = $('themeButton');
  const dialog = $('settingsDialog');
  const nameInput = $('nameInput');
  const targetInput = $('targetInput');
  const toast = $('toast');
  const fmt = new Intl.NumberFormat('ru-RU');
  let toastTimer;
  let pressTimer;
  let pressStart = null;
  let suppressClick = false;
  let tickTimer;

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* optional */ }
  };

  function announce(text) {
    toast.textContent = text;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 1800);
  }

  // ----- Rendering -----
  function render() {
    root.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]').content = state.theme === 'dark' ? '#0e0e10' : '#fafafa';

    digits.textContent = fmt.format(state.count);
    fitCount();

    const percent = Math.min(100, Math.floor((state.count / state.target) * 100));
    const done = state.count >= state.target;
    meta.textContent = done ? `Цель ${fmt.format(state.target)} · выполнена` : `Цель ${fmt.format(state.target)}`;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${fmt.format(state.count)} из ${fmt.format(state.target)}`;
    progressPercent.textContent = `${percent}%`;
    document.body.classList.toggle('done', done);

    nameButton.textContent = state.name;
    document.title = state.name === defaults.name ? 'Okto — счётчик в один тап' : `${state.count} · ${state.name} — Okto`;

    countButton.setAttribute('aria-label', `${state.name}: ${state.count}. Прибавить ${state.step}`);
    zone.classList.toggle('locked', state.locked);
    lockButton.setAttribute('aria-pressed', String(state.locked));
    lockButton.setAttribute('aria-label', state.locked ? 'Снять блокировку' : 'Заблокировать счёт');
    undoButton.disabled = state.history.length === 0;
    stepButton.textContent = `+${state.step}`;
    stepButton.setAttribute('aria-label', `Шаг: ${state.step}. Нажмите, чтобы сменить`);
    themeButton.setAttribute('aria-label', state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема');
    hint.textContent = state.locked
      ? 'Счёт заблокирован'
      : 'Тап — счёт · удержание — сброс';
    renderTimer();
  }

  function fitCount() {
    countButton.style.fontSize = '';
    const available = countButton.clientWidth;
    const natural = countButton.scrollWidth;
    if (available > 0 && natural > available) {
      const size = Number.parseFloat(getComputedStyle(countButton).fontSize);
      countButton.style.fontSize = `${Math.max(28, (size * available) / natural)}px`;
    }
  }

  // ----- Counting -----
  function pushHistory(value) {
    state.history = [...state.history, value].slice(-50);
  }

  function increment() {
    if (state.locked) {
      announce('Счёт заблокирован');
      return;
    }
    const previous = state.count;
    state.count = Math.min(Number.MAX_SAFE_INTEGER, state.count + state.step);
    if (state.count === previous) return;
    pushHistory(previous);
    save();
    render();
    countButton.classList.remove('tick');
    void countButton.offsetWidth;
    countButton.classList.add('tick');
    navigator.vibrate?.(6);
    if (previous < state.target && state.count >= state.target) {
      navigator.vibrate?.([40, 60, 40]);
      announce('Цель достигнута');
    }
  }

  function reset() {
    if (state.count === 0) return;
    pushHistory(state.count);
    state.count = 0;
    save();
    render();
    navigator.vibrate?.(30);
    announce('Сброшено · можно отменить');
  }

  function undo() {
    if (!state.history.length) return;
    state.count = state.history.pop();
    save();
    render();
  }

  // ----- Timer -----
  const timerMs = () => state.timer.elapsed + (state.timer.startedAt ? Date.now() - state.timer.startedAt : 0);

  function renderTimer() {
    const total = Math.floor(timerMs() / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    timerValue.textContent = h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    const running = Boolean(state.timer.startedAt);
    timerButton.classList.toggle('running', running);
    timerButton.setAttribute('aria-label', running ? 'Пауза секундомера' : 'Запустить секундомер');
  }

  function syncTicker() {
    clearInterval(tickTimer);
    if (state.timer.startedAt) tickTimer = setInterval(renderTimer, 250);
  }

  function toggleTimer() {
    if (state.timer.startedAt) {
      state.timer.elapsed = timerMs();
      state.timer.startedAt = null;
    } else {
      state.timer.startedAt = Date.now();
    }
    save();
    syncTicker();
    renderTimer();
  }

  function resetTimer() {
    state.timer = { elapsed: 0, startedAt: null };
    save();
    syncTicker();
    renderTimer();
  }

  // ----- Tap zone: tap to count, long press to reset -----
  const isControl = (el) => el.closest('button, input, a, dialog') && !el.closest('#countButton');

  zone.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || isControl(event.target)) return;
    pressStart = { x: event.clientX, y: event.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      pressStart = null;
      suppressClick = true;
      if (!state.locked) reset();
    }, LONG_PRESS_MS);
  });
  zone.addEventListener('pointermove', (event) => {
    if (pressStart && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 12) {
      clearTimeout(pressTimer);
      pressStart = null;
    }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) =>
    zone.addEventListener(type, () => { clearTimeout(pressTimer); pressStart = null; }));
  zone.addEventListener('contextmenu', (event) => event.preventDefault());

  zone.addEventListener('click', (event) => {
    if (suppressClick) { suppressClick = false; return; }
    if (isControl(event.target)) return;
    increment();
  });

  // ----- Controls -----
  timerButton.addEventListener('click', toggleTimer);
  $('timerReset').addEventListener('click', resetTimer);
  undoButton.addEventListener('click', undo);
  lockButton.addEventListener('click', () => {
    state.locked = !state.locked;
    save();
    render();
  });
  stepButton.addEventListener('click', () => {
    state.step = STEPS[(STEPS.indexOf(state.step) + 1) % STEPS.length];
    save();
    render();
  });
  themeButton.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    save();
    render();
  });

  function openSettings(focus) {
    nameInput.value = state.name === defaults.name ? '' : state.name;
    targetInput.value = String(state.target);
    if (!dialog.open) dialog.showModal();
    if (focus) focus.focus();
  }
  $('settingsButton').addEventListener('click', () => openSettings());
  nameButton.addEventListener('click', () => openSettings(nameInput));

  $('settingsForm').addEventListener('submit', (event) => {
    if (event.submitter?.value !== 'save') return;
    const target = Number.parseInt(targetInput.value, 10);
    if (!Number.isInteger(target) || target < 1 || target > 999999) {
      event.preventDefault();
      targetInput.setCustomValidity('Укажите число от 1 до 999 999');
      targetInput.reportValidity();
      return;
    }
    state.target = target;
    state.name = nameInput.value.trim().slice(0, 32) || defaults.name;
    save();
    render();
  });
  targetInput.addEventListener('input', () => targetInput.setCustomValidity(''));

  $('shareButton').addEventListener('click', async () => {
    const text = `${state.name}: ${fmt.format(state.count)} из ${fmt.format(state.target)} — посчитано в Okto`;
    const url = location.href.split('#')[0];
    if (navigator.share) {
      try { await navigator.share({ title: 'Okto', text, url }); } catch { /* closed */ }
    } else if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(`${text} ${url}`); announce('Скопировано'); } catch { announce(text); }
    } else announce(text);
  });

  // ----- Keyboard -----
  document.addEventListener('keydown', (event) => {
    if (dialog.open || event.repeat || event.target.matches?.('input, textarea')) return;
    const key = event.key.toLowerCase();
    if ((key === 'z' || key === 'я') && !event.altKey) { event.preventDefault(); undo(); return; }
    if (event.code === 'Space' || event.code === 'Enter') {
      if (event.target.matches?.('button, a')) return;
      event.preventDefault();
      increment();
    }
  });

  if ('ResizeObserver' in window) new ResizeObserver(fitCount).observe(countButton);
  else window.addEventListener('resize', fitCount);
  document.fonts?.ready.then(fitCount);

  syncTicker();
  render();
})();
