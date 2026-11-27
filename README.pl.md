[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Polski** · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-pl.svg"><img src="assets/readme/png/hero-pl.png" width="100%" alt="Okto — zaplanuj dzień, skup się na tym, co ważne"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-pl.svg" height="52" alt="Otwórz wersję web"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx-apps/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-pl.svg" height="52" alt="Pobierz na Androida"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx-apps/Okto/releases/tag/tray-v1.7"><img src="assets/readme/btn-windows-pl.svg" height="52" alt="Pobierz na Windows"></a>

**Okto działa na każdym urządzeniu** — iPhone i Android, tablet, Windows, macOS i Linux. Wystarczy przeglądarka, a na telefonie i komputerze Okto instaluje się jak aplikacja. Na Androida jest też osobna aplikacja z widżetem zadań — znajdziesz ją także w [Komi Store](https://github.com/komi-store/komi-store).

</div>

> [!NOTE]
> Interfejs aplikacji jest po rosyjsku i angielsku.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Sekcje Okto: Start, Zadania, Kalendarz, Skupienie">

<br>

<picture><source srcset="assets/readme/sections-pl.svg"><img src="assets/readme/png/sections-pl.png" width="100%" alt="Sekcje Okto: Start, Zadania, Kalendarz, Skupienie"></picture>

<br>

<details>
<summary>Jak włączyć synchronizację</summary>

Domyślnie Okto trzyma wszystko w przeglądarce na urządzeniu. Aby mieć te same dane na telefonie i komputerze, podłącz darmowy projekt Firebase (plan Spark, bez karty):

1. Utwórz projekt na [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication → Sign-in method** — włącz **Google**. W **Settings → Authorized domains** dodaj `sailxx-apps.github.io`.
3. **Firestore Database** — utwórz bazę i wklej [`firestore.rules`](firestore.rules) w zakładce **Rules**.
4. **Project settings → Your apps → Web** — zarejestruj aplikację i skopiuj `apiKey`, `authDomain`, `projectId`, `appId`.
5. W repozytorium na GitHubie: **Settings → Secrets and variables → Actions** — dodaj sekrety `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Uruchom wdrożenie. W ustawieniach Okto pojawi się „Zaloguj przez Google”.

Te klucze nie są tajne — dostęp chronią reguły Firestore, każdy widzi tylko swoje dane. Przypomnienia na stronie działają, dopóki karta jest otwarta. W aplikacji na Androida przypomnienia przychodzą, nawet gdy Okto jest zamknięte.

</details>

<br>

<picture><source srcset="assets/readme/safe-pl.svg"><img src="assets/readme/png/safe-pl.png" width="100%" alt="Bezpieczeństwo: podpis, dane, uprawnienia"></picture>

<br>

## O Okto

<picture><source srcset="assets/readme/about-pl.svg"><img src="assets/readme/png/about-pl.png" width="100%" alt="O Okto"></picture>

Okto powstało 2 października 2026 roku jako prosty licznik internetowy. Dziś to bezpłatny planer z zadaniami, kalendarzem i trybem skupienia. Nie ma reklam, analityki ani śledzenia. Dane pozostają na urządzeniu, a synchronizacja przez Google Firebase jest opcjonalna. [Bezpieczeństwo: podpis, dane, uprawnienia](PRIVACY.md)

## Plan rozwoju

<picture><source srcset="assets/readme/roadmap-pl.svg"><img src="assets/readme/png/roadmap-pl.png" width="100%" alt="Plan rozwoju"></picture>

**2026-10-02** — Pierwsze Okto było licznikiem na jedno dotknięcie z celem i stoperem.

**1.0** — Pomodoro z czterema trybami, kolorowe gotowe tagi, siedem motywów, język angielski, powiadomienia w przeglądarce.

**2.0** — zadania z listami, powtórkami, podzadaniami i przypomnieniami; kalendarz w stylu Apple Calendar z przeciąganiem; konfigurowalny ekran startowy; synchronizacja przez Firebase; skupienie na zadaniu.

**2.1** — aplikacja na Androida z widżetem zadań na ekranie głównym; łagodne jasny i ciemny motyw w stylu Apple; Rozmowy i Fokus można ukryć; język w Ustawieniach; naprawione uruchamianie na Androidzie.

**2.2–2.8** — ikona do wyboru; zdjęcia i pliki w zadaniach, uruchamianie offline; zwijany miesiąc w kalendarzu; przypomnienia o zadaniach na Androidzie; zadania w Kalendarzu Google; 14 nowych jasnych i ciemnych motywów; rozmiar tekstu i trzy nowe widżety; mapa aktywności na stronie głównej.

**3.0** — sekcja Notatki ze zdjęciami i plikami; nowy ekran główny z miękkimi kolorowymi kartami i zakładkami Dziś / Tydzień / Podsumowanie; pływające paski nawigacji i zwijany panel boczny na komputerze; ustawienia ze zwijanymi sekcjami; odświeżony Fokus; poprawki widgetów na Androidzie.

[**3.23.6**](https://github.com/sailxx-apps/Okto/releases/tag/v3.23.6) — Okto trafiło do zasobnika systemowego Windows. Planer na Androidzie otwiera się offline, a wersja 3.23.6 usprawnia załączniki i ekran skupienia.

## ⚖️ Licencje

Czcionka [Inter](https://rsms.me/inter/) jest na licencji SIL Open Font License 1.1. Obrazy w README używają [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
