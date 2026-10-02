(() => {
  const STORAGE_KEY = 'okto-counter-v1';
  const defaults = { count: 0, target: 75, theme: 'light' };
  let state = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state = {
      count: Number.isSafeInteger(saved.count) && saved.count >= 0 ? saved.count : defaults.count,
      target: Number.isSafeInteger(saved.target) && saved.target > 0 ? saved.target : defaults.target,
      theme: saved.theme === 'dark' ? 'dark' : 'light',
    };
  } catch { /* Start fresh if storage is unavailable or invalid. */ }

  const root = document.documentElement;
  const countButton = document.querySelector('#countButton');
  const countValue = document.querySelector('#countValue');
  const targetValue = document.querySelector('#targetValue');
  const progressTrack = document.querySelector('#progressTrack');
  const progressFill = document.querySelector('#progressFill');
  const progressPercent = document.querySelector('#progressPercent');
  const targetInput = document.querySelector('#targetInput');
  const themeDescription = document.querySelector('#themeDescription');
  const themePill = document.querySelector('#themePill');
  const themeButton = document.querySelector('#themeButton');
  const settingsDialog = document.querySelector('#settingsDialog');
  const toast = document.querySelector('#toast');
  let toastTimer;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Storage is optional. */ }
  }

  function render() {
    root.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]').content = state.theme === 'dark' ? '#0d0e11' : '#f8f8f6';
    countValue.textContent = new Intl.NumberFormat('ru-RU').format(state.count);
    targetValue.textContent = new Intl.NumberFormat('ru-RU').format(state.target);
    targetInput.value = String(state.target);
    const percent = Math.min(100, Math.round((state.count / state.target) * 100));
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressTrack.setAttribute('aria-label', `Прогресс: ${percent} процентов`);
    const nextTheme = state.theme === 'light' ? 'тёмную' : 'светлую';
    themeButton.setAttribute('aria-label', `Включить ${nextTheme} тему`);
    themeDescription.textContent = state.theme === 'dark' ? 'Тёмная тема' : 'Светлая тема';
    themePill.textContent = state.theme === 'dark' ? '☾' : '☼';
  }

  function announce(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 1900);
  }

  function changeCount(amount) {
    const previous = state.count;
    state.count = Math.max(0, state.count + amount);
    save();
    render();
    if (amount > 0 && previous < state.target && state.count >= state.target) announce('Цель достигнута — отличная работа!');
  }

  function openSettings() {
    if (!settingsDialog.open) settingsDialog.showModal();
  }

  countButton.addEventListener('click', () => changeCount(1));
  document.querySelector('#undoButton').addEventListener('click', () => changeCount(-1));
  document.querySelector('#resetButton').addEventListener('click', () => {
    if (state.count === 0) return announce('Счёт уже равен нулю');
    if (window.confirm('Сбросить счёт до нуля?')) {
      state.count = 0;
      save();
      render();
      announce('Счёт сброшен');
    }
  });

  const toggleTheme = () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    save();
    render();
  };
  themeButton.addEventListener('click', toggleTheme);
  document.querySelector('#themeSetting').addEventListener('click', toggleTheme);
  document.querySelector('#settingsButton').addEventListener('click', openSettings);
  document.querySelector('#cardSettingsButton').addEventListener('click', openSettings);
  document.querySelector('#footerSettingsButton').addEventListener('click', openSettings);

  document.querySelector('#settingsForm').addEventListener('submit', (event) => {
    if (event.submitter?.value !== 'save') return;
    const target = Number.parseInt(targetInput.value, 10);
    if (!Number.isInteger(target) || target < 1 || target > 999999) {
      event.preventDefault();
      targetInput.setCustomValidity('Укажите число от 1 до 999 999');
      targetInput.reportValidity();
      return;
    }
    targetInput.setCustomValidity('');
    state.target = target;
    save();
    render();
  });
  targetInput.addEventListener('input', () => targetInput.setCustomValidity(''));

  document.querySelector('#shareButton').addEventListener('click', async () => {
    const shareData = { title: 'Okto — счётчик', text: `Мой счёт в Okto: ${state.count}. Маленький шаг — большой прогресс!` };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* The share sheet was closed. */ }
    } else if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(shareData.text); announce('Текст скопирован'); }
      catch { announce('Мой счёт в Okto: ' + state.count); }
    } else announce('Мой счёт в Okto: ' + state.count);
  });

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    if (settingsDialog.open || event.repeat || event.target.matches('input, textarea, select, button, a')) return;
    event.preventDefault();
    changeCount(1);
  });

  render();
})();
