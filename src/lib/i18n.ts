import type { Lang } from './model';
import { fromKey } from './date';

export function plural(n: number, one: string, few: string, many: string) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}


const ru = {
  // navigation
  navHome: 'Главная', navTasks: 'Задачи', navCalls: 'Созвоны', zoomIn: 'Крупнее', zoomOut: 'Мельче', expand: 'Развернуть на весь экран', collapse: 'Свернуть (Esc)', navCalendar: 'Календарь', navFocus: 'Фокус',
  newTask: 'Новая задача', newCall: 'Новый созвон', call: 'Созвон', calls: 'Созвоны', join: 'Подключиться', link: 'Ссылка на встречу', linkPh: 'meet.google.com/…', noLink: 'Без ссылки', badLink: 'Не похоже на ссылку',
  callNow: 'Идёт сейчас', callNext: 'Следующий', callsToday: (n: number) => `Сегодня ${n} ${plural(n, 'созвон', 'созвона', 'созвонов')}`, callIn: (m: number) => (m < 60 ? `через ${m} мин` : `через ${Math.floor(m / 60)} ч ${m % 60 ? `${m % 60} мин` : ''}`.trim()),
  callsPast: 'Прошедшие', callsEmpty: 'Созвонов нет', callsEmptyHint: 'Добавьте встречу — она появится и в календаре.', callLeft: (m: number) => `ещё ${m} мин`, settings: 'Настройки', close: 'Закрыть',
  // focus (from Okto 1.0)
  modeCounter: 'Счётчик', counter: 'Счётчик', modeStopwatch: 'Секундомер', modeTimer: 'Таймер',
  lap: 'Круг', laps: (n: number) => `${n} ${plural(n, 'круг', 'круга', 'кругов')}`, noLaps: 'Кругов пока нет', total: 'Всего',
  timerFor: (d: string) => `Таймер на ${d}`, timerLeft: 'осталось', timerOf: (d: string) => `из ${d}`, addMinute: '+1 минута', customTime: 'Своё время', minutes: 'Минуты', seconds: 'Секунды',
  timerDoneTitle: 'Время вышло', timerDoneBody: 'Таймер закончился',
  hintStopwatch: 'Тап — старт/пауза · удержание — сброс', hintTimer: 'Тап — старт/пауза · удержание — сброс',
  lock: 'Блокировка', unlock: 'Снять блокировку', undo: 'Отменить', minus: 'Минус шаг', stopwatch: 'Секундомер',
  wake: 'Не гасить экран', pomoReset: 'Сбросить этап', start: 'Старт', pause: 'Пауза', skip: 'Пропустить этап', sound: 'Звук',
  language: 'Язык', sections: 'Разделы', sectionsHint: 'Выключенный раздел пропадает из меню и с главной. Данные остаются.', theme: 'Тема', alerts: 'Оповещения', notifications: 'Уведомления в браузере', soundLabel: 'Звук', vibration: 'Вибрация',
  autoStart: 'Автозапуск следующего этапа', customTitle: 'Режим «Свой», минуты', focus: 'Фокус', shortBreak: 'Перерыв', longBreak: 'Длинный', every: 'Длинный каждые',
  resetStopwatch: 'Сбросить секундомер', done: 'Готово', name: 'Название', goal: 'Цель', color: 'Цвет', delete: 'Удалить', save: 'Сохранить',
  sure: 'Точно удалить?', newTag: 'Новый тег', editTag: 'Тег', add: 'Тег',
  themes: { system: 'Системная', light: 'Светлая', dark: 'Тёмная', paper: 'Бумага', mint: 'Мята', midnight: 'Полночь', oled: 'OLED', crimson: 'Красно‑чёрная', amber: 'Янтарь', ocean: 'Океан', sakura: 'Сакура', nord: 'Норд' } as Record<string, string>,
  pomo: { classic: 'Классика', short: 'Короткий', deep: 'Глубокий', custom: 'Свой' } as Record<string, string>,
  phase: { work: 'Фокус', short: 'Перерыв', long: 'Длинный перерыв' } as Record<string, string>,
  goalLine: (g: string) => `Цель ${g}`, goalDone: 'выполнена', of: (a: string, b: string) => `${a} из ${b}`,
  round: (r: number, n: number) => `Раунд ${r} из ${n}`, todayFocuses: (n: number) => `сегодня ${n} ${plural(n, 'фокус', 'фокуса', 'фокусов')}`,
  next: (p: string, m: number) => `Дальше: ${p.toLowerCase()} ${m} мин`,
  hintCounter: 'Тап — счёт · удержание — сброс', hintLocked: 'Счёт заблокирован',
  hintPomo: 'Тап — старт/пауза · удержание — сброс',
  reset: 'Сброшено · можно отменить', locked: 'Счёт заблокирован',
  goalReachedTitle: 'Цель достигнута', goalReachedBody: (n: string, g: string) => `${n}: ${g} — отличная работа!`,
  workDoneTitle: 'Фокус завершён', workDoneBody: (m: number) => `Время отдохнуть: ${m} мин`,
  breakDoneTitle: 'Перерыв окончен', breakDoneBody: 'Пора возвращаться к делу',
  notifyUnsupported: 'Этот браузер не поддерживает уведомления', notifyDenied: 'Разрешите уведомления для сайта в настройках браузера',
  notifyOn: 'Уведомления включены', wakeOn: 'Экран не будет гаснуть', wakeOff: 'Экран может гаснуть', wakeFail: 'Не удалось удержать экран',
  stepLabel: (s: number) => `Шаг: ${s}`, invalidGoal: 'Укажите число от 1 до 999 999', min: 'мин',
  focusOn: 'Фокус на задаче', unlinkTask: 'Отвязать задачу',
  // tasks
  task: 'Задача', tasks: 'Задачи', todayOf: (a: number, b: number) => `Сегодня ${a} из ${b}`,
  fToday: 'Сегодня', fUpcoming: 'Предстоящие', fAll: 'Все', fNoDate: 'Без даты', fDone: 'Выполненные',
  addList: 'Список', newList: 'Новый список', editList: 'Список', overdue: 'Просрочено',
  emptyToday: 'На сегодня всё', emptyHint: 'Нажмите +, чтобы добавить задачу', emptyList: 'Здесь пока пусто',
  taskDone: 'Выполнено', undoAction: 'Отменить', taskDeleted: 'Задача удалена', tomorrow: 'Завтра', yesterday: 'Вчера', today: 'Сегодня',
  title: 'Что нужно сделать?', note: 'Заметка', date: 'Дата', time: 'Время', noDate: 'Без даты', noTime: 'Весь день',
  duration: 'Длительность', repeat: 'Повтор', reminder: 'Напоминание', list: 'Список', priority: 'Приоритет',
  subtasks: 'Подзадачи', addSubtask: 'Подзадача', clear: 'Убрать',
  rNone: 'Не повторять', rDay: 'Каждый день', rWeekday: 'По будням', rWeek: 'Каждую неделю', rMonth: 'Каждый месяц',
  every2: 'Интервал', repeatUntil: 'До даты', forever: 'Без конца',
  remNone: 'Без напоминания', remAt: 'В начале', remBefore: (m: number) => (m >= 1440 ? 'За день' : m >= 60 ? `За ${m / 60} ч` : `За ${m} мин`),
  prio: ['Нет', 'Низкий', 'Средний', 'Высокий'],
  durMin: (m: number) => (m < 60 ? `${m} мин` : m % 60 ? `${Math.floor(m / 60)} ч ${m % 60} мин` : `${m / 60} ч`),
  scopeTitle: 'Это повторяющаяся задача', scopeOne: 'Только эту', scopeFuture: 'Все будущие', scopeAll: 'Всю серию',
  reminderTitle: 'Напоминание', reminderBody: (title: string, time: string) => `${time} · ${title}`,
  moveTomorrow: 'На завтра', titleRequired: 'Введите название',
  // calendar
  vDay: 'День', vWeek: 'Неделя', vMonth: 'Месяц', allDay: 'весь день', more: (n: number) => `ещё ${n}`, lists: 'Списки',
  prev: 'Назад', nextP: 'Вперёд',
  // home
  greetMorning: 'Доброе утро', greetDay: 'Добрый день', greetEvening: 'Добрый вечер', greetNight: 'Доброй ночи',
  edit: 'Изменить', noColor: 'Цвет списка', editHint: 'Перетаскивайте блоки, чтобы поменять их местами. Уголок справа внизу — размер.', resize: 'Изменить размер', addBlock: 'Добавить блок', remove: 'Убрать',
  bTasks: 'Задачи', bFocus: 'Фокус', bStreak: 'Серия', bNext: 'Дальше', bCounter: 'Счётчик',
  focusCount: (n: number) => `${n} ${plural(n, 'фокус', 'фокуса', 'фокусов')}`,
  streakDays: (n: number) => `${plural(n, 'день', 'дня', 'дней')} подряд`,
  nothingNext: 'Ничего не запланировано', hm: (h: number, m: number) => (h ? `${h} ч ${m} м` : `${m} мин`),
  last7: 'За 7 дней', last30: (v: string) => `За 30 дней: ${v}`, allAdded: 'Все блоки уже на главной',
  tasksDone: 'выполнено задач', focusMin: 'минут фокуса', plan: 'план',
  hello: 'Привет! Как вас зовут?', helloSub: 'Имя появится на главной. Его и приветствие можно поменять в любой момент.', namePh: 'Ваше имя', begin: 'Начать', skipName: 'Пропустить',
  profile: 'Профиль', yourName: 'Имя', greetingLabel: 'Приветствие', greetingAuto: 'По времени суток', greetingPh: 'Например: Погнали', editGreeting: 'Изменить приветствие',
  last14: '14 дней', last7d: '7 дней', last5w: '5 недель', todayLine: 'сегодня', doneOf: (a: number, b: number) => `${a} из ${b}`, noData: 'нет данных', timeline: 'план дня',
  // account
  account: 'Аккаунт', signIn: 'Войти через Google', signOut: 'Выйти',
  syncOff: 'Синхронизация не настроена — данные хранятся на этом устройстве',
  syncSignedOut: 'Войдите, чтобы синхронизировать телефон и компьютер',
  syncing: 'Синхронизация…', synced: 'Синхронизировано', offline: 'Офлайн — изменения сохранятся', syncError: 'Ошибка синхронизации',
  storageFail: 'Хранилище браузера недоступно — данные не сохранятся',
  appTitle: 'Okto — планер, задачи и фокус',
};

const en: typeof ru = {
  navHome: 'Home', navTasks: 'Tasks', navCalls: 'Calls', zoomIn: 'Zoom in', zoomOut: 'Zoom out', expand: 'Expand to full screen', collapse: 'Collapse (Esc)', navCalendar: 'Calendar', navFocus: 'Focus',
  newTask: 'New task', newCall: 'New call', call: 'Call', calls: 'Calls', join: 'Join', link: 'Meeting link', linkPh: 'meet.google.com/…', noLink: 'No link', badLink: 'Not a valid link',
  callNow: 'Happening now', callNext: 'Next up', callsToday: (n) => `${n} ${n === 1 ? 'call' : 'calls'} today`, callIn: (m) => (m < 60 ? `in ${m} min` : `in ${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim()),
  callsPast: 'Past', callsEmpty: 'No calls', callsEmptyHint: 'Add a meeting — it shows up in the calendar too.', callLeft: (m) => `${m} min left`, settings: 'Settings', close: 'Close',
  modeCounter: 'Counter', counter: 'Counter', modeStopwatch: 'Stopwatch', modeTimer: 'Timer',
  lap: 'Lap', laps: (n) => `${n} ${n === 1 ? 'lap' : 'laps'}`, noLaps: 'No laps yet', total: 'Total',
  timerFor: (d) => `Timer for ${d}`, timerLeft: 'left', timerOf: (d) => `of ${d}`, addMinute: '+1 minute', customTime: 'Custom time', minutes: 'Minutes', seconds: 'Seconds',
  timerDoneTitle: 'Time is up', timerDoneBody: 'The timer has finished',
  hintStopwatch: 'Tap — start/pause · hold — reset', hintTimer: 'Tap — start/pause · hold — reset',
  lock: 'Lock', unlock: 'Unlock', undo: 'Undo', minus: 'Minus step', stopwatch: 'Stopwatch',
  wake: 'Keep screen on', pomoReset: 'Reset phase', start: 'Start', pause: 'Pause', skip: 'Skip phase', sound: 'Sound',
  language: 'Language', sections: 'Sections', sectionsHint: 'A switched-off section leaves the menu and Home. Your data stays.', theme: 'Theme', alerts: 'Alerts', notifications: 'Browser notifications', soundLabel: 'Sound', vibration: 'Vibration',
  autoStart: 'Auto‑start next phase', customTitle: '“Custom” mode, minutes', focus: 'Focus', shortBreak: 'Break', longBreak: 'Long', every: 'Long every',
  resetStopwatch: 'Reset stopwatch', done: 'Done', name: 'Name', goal: 'Goal', color: 'Colour', delete: 'Delete', save: 'Save',
  sure: 'Delete for sure?', newTag: 'New tag', editTag: 'Tag', add: 'Tag',
  themes: { system: 'System', light: 'Light', dark: 'Dark', paper: 'Paper', mint: 'Mint', midnight: 'Midnight', oled: 'OLED', crimson: 'Red & black', amber: 'Amber', ocean: 'Ocean', sakura: 'Sakura', nord: 'Nord' },
  pomo: { classic: 'Classic', short: 'Short', deep: 'Deep work', custom: 'Custom' },
  phase: { work: 'Focus', short: 'Break', long: 'Long break' },
  goalLine: (g) => `Goal ${g}`, goalDone: 'reached', of: (a, b) => `${a} of ${b}`,
  round: (r, n) => `Round ${r} of ${n}`, todayFocuses: (n) => `${n} ${n === 1 ? 'focus' : 'focuses'} today`,
  next: (p, m) => `Next: ${p.toLowerCase()} ${m} min`,
  hintCounter: 'Tap — count · hold — reset', hintLocked: 'Counter locked',
  hintPomo: 'Tap — start/pause · hold — reset',
  reset: 'Reset · you can undo', locked: 'Counter locked',
  goalReachedTitle: 'Goal reached', goalReachedBody: (n, g) => `${n}: ${g} — great job!`,
  workDoneTitle: 'Focus complete', workDoneBody: (m) => `Take a break: ${m} min`,
  breakDoneTitle: 'Break is over', breakDoneBody: 'Time to get back to work',
  notifyUnsupported: 'This browser does not support notifications', notifyDenied: 'Allow notifications for this site in your browser settings',
  notifyOn: 'Notifications on', wakeOn: 'Screen will stay on', wakeOff: 'Screen may turn off', wakeFail: 'Could not keep the screen on',
  stepLabel: (s) => `Step: ${s}`, invalidGoal: 'Enter a number from 1 to 999,999', min: 'min',
  focusOn: 'Focus on task', unlinkTask: 'Unlink task',
  task: 'Task', tasks: 'Tasks', todayOf: (a, b) => `Today ${a} of ${b}`,
  fToday: 'Today', fUpcoming: 'Upcoming', fAll: 'All', fNoDate: 'No date', fDone: 'Completed',
  addList: 'List', newList: 'New list', editList: 'List', overdue: 'Overdue',
  emptyToday: 'All done for today', emptyHint: 'Tap + to add a task', emptyList: 'Nothing here yet',
  taskDone: 'Completed', undoAction: 'Undo', taskDeleted: 'Task deleted', tomorrow: 'Tomorrow', yesterday: 'Yesterday', today: 'Today',
  title: 'What needs doing?', note: 'Note', date: 'Date', time: 'Time', noDate: 'No date', noTime: 'All day',
  duration: 'Duration', repeat: 'Repeat', reminder: 'Reminder', list: 'List', priority: 'Priority',
  subtasks: 'Subtasks', addSubtask: 'Subtask', clear: 'Clear',
  rNone: 'Never', rDay: 'Every day', rWeekday: 'Weekdays', rWeek: 'Every week', rMonth: 'Every month',
  every2: 'Interval', repeatUntil: 'Until', forever: 'Forever',
  remNone: 'No reminder', remAt: 'At start', remBefore: (m) => (m >= 1440 ? '1 day before' : m >= 60 ? `${m / 60} h before` : `${m} min before`),
  prio: ['None', 'Low', 'Medium', 'High'],
  durMin: (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`),
  scopeTitle: 'This is a repeating task', scopeOne: 'This one only', scopeFuture: 'All future', scopeAll: 'Whole series',
  reminderTitle: 'Reminder', reminderBody: (title, time) => `${time} · ${title}`,
  moveTomorrow: 'Tomorrow', titleRequired: 'Enter a title',
  vDay: 'Day', vWeek: 'Week', vMonth: 'Month', allDay: 'all‑day', more: (n) => `${n} more`, lists: 'Lists',
  prev: 'Previous', nextP: 'Next',
  greetMorning: 'Good morning', greetDay: 'Good afternoon', greetEvening: 'Good evening', greetNight: 'Good night',
  edit: 'Edit', noColor: 'List colour', editHint: 'Drag blocks to swap them. Bottom-right corner resizes.', resize: 'Resize', addBlock: 'Add block', remove: 'Remove',
  bTasks: 'Tasks', bFocus: 'Focus', bStreak: 'Streak', bNext: 'Up next', bCounter: 'Counter',
  focusCount: (n) => `${n} ${n === 1 ? 'focus' : 'focuses'}`,
  streakDays: (n) => `${n === 1 ? 'day' : 'days'} in a row`,
  nothingNext: 'Nothing scheduled', hm: (h, m) => (h ? `${h} h ${m} m` : `${m} min`),
  last7: 'Last 7 days', last30: (v) => `Last 30 days: ${v}`, allAdded: 'All blocks are already on Home',
  tasksDone: 'tasks completed', focusMin: 'focus minutes', plan: 'plan',
  hello: 'Hi! What should we call you?', helloSub: 'Your name shows on Home. You can change it and the greeting any time.', namePh: 'Your name', begin: 'Start', skipName: 'Skip',
  profile: 'Profile', yourName: 'Name', greetingLabel: 'Greeting', greetingAuto: 'By time of day', greetingPh: 'e.g. Let’s go', editGreeting: 'Edit greeting',
  last14: '14 days', last7d: '7 days', last5w: '5 weeks', todayLine: 'today', doneOf: (a, b) => `${a} of ${b}`, noData: 'no data', timeline: 'day plan',
  account: 'Account', signIn: 'Sign in with Google', signOut: 'Sign out',
  syncOff: 'Sync is not configured — data stays on this device',
  syncSignedOut: 'Sign in to sync your phone and computer',
  syncing: 'Syncing…', synced: 'Synced', offline: 'Offline — changes will be saved', syncError: 'Sync error',
  storageFail: 'Browser storage unavailable — data will not be saved',
  appTitle: 'Okto — planner, tasks & focus',
};

export const DICT: Record<Lang, typeof ru> = { ru, en };
export type Key = keyof typeof ru;

export function tr<K extends Key>(lang: Lang, key: K): (typeof ru)[K] {
  return DICT[lang][key];
}

export const locale = (lang: Lang) => (lang === 'ru' ? 'ru-RU' : 'en-US');
export const weekStartOf = (lang: Lang): 0 | 1 => (lang === 'ru' ? 1 : 0);

export function fmtDate(lang: Lang, key: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale(lang), opts).format(fromKey(key));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** «Понедельник, 5 октября» */
export const fmtLongDay = (lang: Lang, key: string) => cap(fmtDate(lang, key, { weekday: 'long', day: 'numeric', month: 'long' }));
/** «Ср, 7 окт.» */
export const fmtShortDay = (lang: Lang, key: string) => cap(fmtDate(lang, key, { weekday: 'short', day: 'numeric', month: 'short' }));
/** «Октябрь» (standalone month name) */
export const fmtMonth = (lang: Lang, key: string) => cap(fmtDate(lang, key, { month: 'long' }).replace(/\s*г\.?$/, ''));
export const fmtWeekdayShort = (lang: Lang, key: string) => cap(fmtDate(lang, key, { weekday: 'short' }));
export const fmtWeekdayNarrow = (lang: Lang, key: string) => fmtDate(lang, key, { weekday: 'narrow' });

export function relDay(lang: Lang, key: string, today: string, tomorrow: string, yesterday: string) {
  const d = DICT[lang];
  if (key === today) return d.today;
  if (key === tomorrow) return d.tomorrow;
  if (key === yesterday) return d.yesterday;
  return fmtShortDay(lang, key);
}

