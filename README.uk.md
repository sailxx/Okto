[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · **Українська** · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-uk.svg"><img src="assets/readme/png/hero-uk.png" width="100%" alt="Okto — сплануй день, зосередься на головному"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-uk.svg" height="52" alt="Відкрити веб-версію"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-uk.svg" height="52" alt="Завантажити для Android"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/tag/tray-v1.7"><img src="assets/readme/btn-windows-uk.svg" height="52" alt="Завантажити для Windows"></a>

**Okto працює на будь-якому пристрої** — iPhone і Android, планшет, Windows, macOS і Linux. Потрібен лише браузер, а на телефон і комп'ютер Okto встановлюється як застосунок. Для Android є окремий застосунок із віджетом завдань — його можна знайти й у [Komi Store](https://github.com/komi-store/komi-store).

</div>

> [!NOTE]
> Інтерфейс застосунку доступний російською та англійською.

<br>

<img src="assets/readme/screens-ru.webp" width="100%" alt="Розділи Okto: Головна, Завдання, Календар, Фокус">

<br>

<picture><source srcset="assets/readme/sections-uk.svg"><img src="assets/readme/png/sections-uk.png" width="100%" alt="Розділи Okto: Головна, Завдання, Календар, Фокус"></picture>

<br>

<details>
<summary>Як увімкнути синхронізацію</summary>

Без налаштування Okto зберігає все в браузері на пристрої. Щоб дані були однаковими на телефоні й комп’ютері, підключіть безкоштовний Firebase (план Spark, картка не потрібна):

1. Створіть проєкт на [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication → Sign-in method** — увімкніть **Google**. У **Settings → Authorized domains** додайте `sailxx-apps.github.io`.
3. **Firestore Database** — створіть базу й у вкладці **Rules** вставте вміст [`firestore.rules`](firestore.rules).
4. **Project settings → Your apps → Web** — зареєструйте застосунок і скопіюйте `apiKey`, `authDomain`, `projectId`, `appId`.
5. У репозиторії на GitHub: **Settings → Secrets and variables → Actions** — додайте секрети `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Запустіть деплой. У налаштуваннях Okto з’явиться «Увійти через Google».

Ці ключі не секретні — доступ захищають правила Firestore: кожен бачить лише свої дані. Нагадування на сайті спрацьовують, поки вкладка відкрита. У застосунку для Android нагадування приходять, навіть коли Okto закритий.

</details>

<br>

<picture><source srcset="assets/readme/safe-uk.svg"><img src="assets/readme/png/safe-uk.png" width="100%" alt="Безпека: підпис, дані, дозволи"></picture>

<br>

## Про Okto

<picture><source srcset="assets/readme/about-uk.svg"><img src="assets/readme/png/about-uk.png" width="100%" alt="Про Okto"></picture>

Okto почався 2 жовтня 2026 року як простий веблічильник. Тепер це безкоштовний планувальник для завдань, календаря та фокусу. Тут немає реклами, аналітики й трекерів. Записи зберігаються на пристрої, а синхронізацію через Google Firebase можна ввімкнути за бажанням. [Безпека: підпис, дані, дозволи](PRIVACY.md)

## Дорожня карта

<picture><source srcset="assets/readme/roadmap-uk.svg"><img src="assets/readme/png/roadmap-uk.png" width="100%" alt="Дорожня карта"></picture>

**2026-10-02** — Перший Okto був лічильником в один дотик із ціллю та секундоміром.

**1.0** — Pomodoro з чотирма режимами, теги-заготовки з кольорами, сім тем, англійська мова, сповіщення в браузері.

**2.0** — завдання зі списками, повторами, підзавданнями й нагадуваннями; календар у стилі Apple Calendar з перетягуванням; головна з налаштовуваними блоками; синхронізація через Firebase; фокус на завданні.

**2.1** — Android-застосунок із віджетом завдань на робочому столі; м'які світла й темна теми в стилі Apple; «Дзвінки» і «Фокус» можна сховати; мова — в налаштуваннях; виправлено запуск на Android.

**2.2–2.8** — значок на вибір; фото й файли в завданнях, запуск офлайн; згортуваний місяць у календарі; нагадування про завдання на Android; завдання в Google Календарі; 14 нових світлих і темних тем; розмір тексту й три нові віджети; карта активності на головній.

**3.0** — розділ «Нотатки» з фото та файлами; нова головна з м’якими кольоровими картками й вкладками «Сьогодні / Тиждень / Підсумки»; плаваючі панелі навігації та згортувана бічна панель на ПК; налаштування зі згортуваними розділами; оновлений «Фокус»; виправлені віджети на Android.

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — Okto з’явився в області сповіщень Windows. Планувальник на Android відкривається офлайн, а 3.23.6 покращує вкладення та екран фокусу.

## ⚖️ Ліцензії

Шрифт [Inter](https://rsms.me/inter/) поширюється за ліцензією SIL Open Font License 1.1. Зображення README набрані шрифтом [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
