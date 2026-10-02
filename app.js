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
  const countValue = document.querySelector('#countValue');
  const targetValue = document.querySelector('#targetValue');
  const progressRing = document.querySelector('#progressRing');
  const progressPercent = document.querySelector('#progressPercent');
  const targetInput = document.querySelector('#targetInput');
  const themeDescription = document.querySelector('#themeDescription');
  const themeButton = document.querySelector('#themeButton');
  const themeSetting = document.querySelector('#themeSetting');
  const settingsDialog = document.querySelector('#settingsDialog');
  const toast = document.querySelector('#toast');
  let toastTimer;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Storage is optional. */ }
  }

  function render() {
    root.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]').content = state.theme === 'dark' ? '#09090b' : '#f7f7f8';
    countValue.textContent = new Intl.NumberFormat('ru-RU').format(state.count);
    targetValue.textContent = new Intl.NumberFormat('ru-RU').format(state.target);
    targetInput.value = String(state.target);
    const percent = Math.min(100, Math.round((state.count / state.target) * 100));
    progressRing.style.setProperty('--progress', `${percent}%`);
    progressPercent.textContent = `${percent}%`;
    progressRing.setAttribute('aria-label', `Прогресс: ${percent} процентов`);
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    themeButton.setAttribute('aria-label', `Включить ${nextTheme === 'dark' ? 'тёмную' : 'светлую'} тему`);
    themeDescription.textContent = state.theme === 'dark' ? 'Тёмная тема' : 'Светлая тема';
    themeButton.querySelector('svg').innerHTML = state.theme === 'dark'
      ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
      : '<path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.8 8.8 0 1 0 20.2 15.2Z"/><path d="M17.5 3v5M15 5.5h5"/>';
  }

  function announce(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 1800);
  }

  function changeCount(amount) {
    state.count = Math.max(0, state.count + amount);
    save();
    render();
    if (amount > 0 && state.count === state.target) announce('Цель достигнута!');
  }

  document.querySelector('#countButton').addEventListener('click', () => changeCount(1));
  document.querySelector('#undoButton').addEventListener('click', () => changeCount(-1));
  document.querySelector('#resetButton').addEventListener('click', () => {
    if (state.count === 0) return announce('Счёт уже равен нулю');
    if (window.confirm('Сбросить счёт до нуля?')) { state.count = 0; save(); render(); announce('Счёт сброшен'); }
  });
  const toggleTheme = () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; save(); render(); };
  themeButton.addEventListener('click', toggleTheme);
  themeSetting.addEventListener('click', toggleTheme);
  document.querySelector('#settingsButton').addEventListener('click', () => settingsDialog.showModal());
  document.querySelector('#settingsForm').addEventListener('submit', (event) => {
    if (event.submitter?.value === 'save') {
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
    }
  });
  targetInput.addEventListener('input', () => targetInput.setCustomValidity(''));
  document.querySelector('#moreButton').addEventListener('click', async () => {
    const shareData = { title: 'Okto — счётчик', text: 'Попробуйте мой счётчик Okto!' };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* User closed the share sheet. */ }
    } else if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(`${shareData.text} Счёт: ${state.count}`); announce('Текст скопирован'); }
      catch { announce('Поделиться можно через меню браузера'); }
    } else announce(`Мой счёт в Okto: ${state.count}`);
  });

  render();
})();
