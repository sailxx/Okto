<div align="center">

<img src="public/assets/favicon.svg" width="72" height="72" alt="Okto">

# Okto

### Планер, задачи, календарь и фокус

Задачи на сегодня, календарь в стиле Apple Calendar, Pomodoro и счётчик в один тап —
в одном минималистичном приложении. Бесплатно, без рекламы и трекеров.

<a href="https://sailxx.github.io/Okto/"><img src="https://img.shields.io/badge/Открыть_Okto-17181b?style=for-the-badge" alt="Открыть Okto"></a>
&nbsp;
<img src="https://img.shields.io/badge/версия-2.0-e5484d?style=for-the-badge" alt="Версия 2.0">

<br>

![Svelte](https://img.shields.io/badge/Svelte_5-ff3e00?style=flat-square&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-бесплатный_план-ffca28?style=flat-square&logo=firebase&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5a0fc8?style=flat-square&logo=pwa&logoColor=white)
![RU · EN](https://img.shields.io/badge/языки-RU_·_EN-0090ff?style=flat-square)

</div>

<br>

## Что нового в Okto 2.0

Okto вырос из счётчика в личный планер. Счётчик и Pomodoro остались такими же, как в 1.0, а вокруг них появились задачи, календарь и главная со статистикой. Дизайн прежний: Inter, крупные цифры, кнопки-кружочки, семь тем.

<br>

## Разделы

### 🏠 Главная

Блоки продуктивности: **Задачи** (выполнено из запланированного), **Фокус** (минуты Pomodoro), **Серия** (дней подряд с задачей или фокусом), **Дальше** (ближайшая задача) и **счётчики** по любому тегу. Блоки можно добавлять, убирать и перетаскивать — кнопка «Изменить». Тап по блоку показывает график за 7 дней и итог за 30.

### ✅ Задачи

- Фильтры: Сегодня (с просроченными), Предстоящие, Все, Без даты, Выполненные — и ваши **списки** с цветами.
- У задачи: дата, время и длительность, **повтор** (каждый день, по будням, неделя, месяц, интервал, дата окончания), **напоминание**, приоритет, заметка и **подзадачи**.
- **Фокус на задаче** — запускает Pomodoro, и минуты записываются в задачу.
- Свайп влево на телефоне — «На завтра» или «Удалить», после любого действия можно отменить.

### 📅 Календарь

В стиле Apple Calendar: **День · Неделя · Месяц**, красная линия текущего времени, строка «весь день». Новая задача сразу появляется в календаре. Блоки можно **перетаскивать** на другое время и день и **растягивать** за нижний край (шаг 15 минут; на телефоне — после долгого нажатия). Для повторяющихся задач Okto спросит: только эту, все будущие или всю серию.

### 🎯 Фокус

Счётчик в один тап и Pomodoro из Okto 1.0 без изменений: теги-заготовки с целями, шаг +1/+5/+10, удержание — сброс, четыре режима Pomodoro, красный акцент, секундомер, «не гасить экран».

<br>

## Синхронизация телефона и компьютера

Без настройки Okto хранит всё в браузере на устройстве. Чтобы данные были одинаковыми везде, подключите бесплатный Firebase (план Spark, карта не нужна, проект не засыпает):

1. Создайте проект на [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication → Sign-in method** — включите **Google**. В **Settings → Authorized domains** добавьте `sailxx.github.io`.
3. **Firestore Database** — создайте базу и во вкладке **Rules** вставьте содержимое [`firestore.rules`](firestore.rules).
4. **Project settings → Your apps → Web** — зарегистрируйте приложение и скопируйте `apiKey`, `authDomain`, `projectId`, `appId`.
5. В репозитории на GitHub: **Settings → Secrets and variables → Actions** — добавьте секреты `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Запустите деплой. В настройках Okto появится «Войти через Google».

Эти ключи не секретные — доступ защищают правила Firestore: каждый видит только свои данные.

> Напоминания на сайте срабатывают, пока вкладка открыта. В будущем Android-приложении они будут приходить и при закрытом приложении.

<br>

## Разработка

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest: повторы, статистика, перенос данных, синхронизация, раскладка календаря
npm run check    # svelte-check
npm run build    # сборка в dist/
```

Для синхронизации локально скопируйте `.env.example` в `.env.local` и заполните ключи.

```text
src/
├── lib/            логика без интерфейса: даты, повторы, статистика, раскладка, перенос, синхронизация
├── components/     общие элементы: шторки, строка задачи, редактор, сетки календаря
├── screens/        Главная, Задачи, Календарь, Фокус
└── styles/         токены и темы из Okto 1.0
public/             иконки, шрифты Inter, manifest, service worker
```

Данные Okto 1.x (`okto-v2`, `okto-counter-v1`) переносятся автоматически при первом запуске. Публикация на GitHub Pages — автоматически при каждом изменении в `main`.

<br>

## История версий

**2.0** — задачи со списками, повторами, подзадачами и напоминаниями; календарь в стиле Apple Calendar с перетаскиванием; главная с настраиваемыми блоками; синхронизация через Firebase; фокус на задаче.

**1.0** — Pomodoro с четырьмя режимами, теги‑заготовки с цветами, семь тем, английский язык, уведомления в браузере.

<br>

## Лицензия

Шрифт [Inter](https://rsms.me/inter/) распространяется по лицензии SIL Open Font License 1.1.
