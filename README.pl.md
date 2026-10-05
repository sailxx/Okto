<div align="center">

[Русский](README.md) · [English](README.en.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Türkçe](README.tr.md) · [Українська](README.uk.md) · **Polski**

<br>

<img src="assets/readme/hero-pl.svg" width="100%" alt="Okto — zaplanuj dzień, skup się na tym, co ważne">

<a href="https://sailxx.github.io/Okto/"><img src="assets/readme/cta.svg" height="44" alt="Otwórz Okto"></a>

</div>

> [!NOTE]
> Interfejs aplikacji jest po rosyjsku i angielsku.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Sekcje Okto: Start, Zadania, Kalendarz, Skupienie">

<br>

<img src="assets/readme/sections-pl.svg" width="100%" alt="Sekcje Okto: Start, Zadania, Kalendarz, Skupienie">

<details>
<summary><b>Więcej o sekcjach</b></summary>

### 🏠 Start

Bloki produktywności: **Zadania** (wykonane z zaplanowanych), **Skupienie** (minuty Pomodoro), **Seria** (dni z rzędu z zadaniem lub skupieniem), **Dalej** (najbliższe zadanie) i **liczniki** dla dowolnego tagu. Bloki dodasz, usuniesz i przeciągniesz przyciskiem „Edytuj”. Dotknięcie bloku pokazuje wykres z 7 dni i sumę z 30.

### ✅ Zadania

Filtry: Dziś (z zaległymi), Nadchodzące, Wszystkie, Bez daty, Ukończone — oraz własne kolorowe **listy**. Zadanie ma datę, godzinę i czas trwania, **powtarzanie** (codziennie, dni robocze, co tydzień, co miesiąc, interwał, data końca), **przypomnienie**, priorytet, notatkę i **podzadania**. **Skupienie na zadaniu** uruchamia Pomodoro i zapisuje minuty w zadaniu. Na telefonie przesuń w lewo: „Na jutro” lub „Usuń”; każdą akcję można cofnąć.

### 📅 Kalendarz

W stylu Apple Calendar: **Dzień · Tydzień · Miesiąc**, czerwona linia bieżącej godziny i wiersz „cały dzień”. Nowe zadanie od razu pojawia się w kalendarzu. Bloki można **przeciągać** na inną godzinę lub dzień i **rozciągać** za dolną krawędź (krok 15 minut; na telefonie po długim przytrzymaniu). Przy zadaniach cyklicznych Okto zapyta: tylko to, wszystkie przyszłe czy całą serię.

### 🎯 Skupienie

Licznik jednym dotknięciem i Pomodoro: gotowe tagi z celami, kroki +1/+5/+10, przytrzymanie — reset, cztery tryby Pomodoro, stoper i „nie wygaszaj ekranu”.

</details>

<br>

<img src="assets/readme/quality-pl.svg" width="100%" alt="JAKOŚĆ W LICZBACH">

<br>

<img src="assets/readme/design-pl.svg" width="100%" alt="KOD DESIGNU">

<br>

<img src="assets/readme/more-pl.svg" width="100%" alt="Synchronizacja, prywatność i wygląd">

<details>
<summary><b>Jak włączyć synchronizację</b></summary>

Domyślnie Okto trzyma wszystko w przeglądarce na urządzeniu. Aby mieć te same dane na telefonie i komputerze, podłącz darmowy projekt Firebase (plan Spark, bez karty):

1. Utwórz projekt na [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication → Sign-in method** — włącz **Google**. W **Settings → Authorized domains** dodaj `sailxx.github.io`.
3. **Firestore Database** — utwórz bazę i wklej [`firestore.rules`](firestore.rules) w zakładce **Rules**.
4. **Project settings → Your apps → Web** — zarejestruj aplikację i skopiuj `apiKey`, `authDomain`, `projectId`, `appId`.
5. W repozytorium na GitHubie: **Settings → Secrets and variables → Actions** — dodaj sekrety `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Uruchom wdrożenie. W ustawieniach Okto pojawi się „Zaloguj przez Google”.

Te klucze nie są tajne — dostęp chronią reguły Firestore, każdy widzi tylko swoje dane. Przypomnienia na stronie działają, dopóki karta jest otwarta.

</details>

<br>

## 🛠 Rozwój

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest: powtórki, statystyki, migracja, synchronizacja, kalendarz
npm run check    # svelte-check
npm run build    # build do dist/
```

Do synchronizacji lokalnie skopiuj `.env.example` do `.env.local` i uzupełnij klucze. GitHub Pages publikuje automatycznie przy każdej zmianie w `main`.

## 🗂 Historia wersji

**2.0** — zadania z listami, powtórkami, podzadaniami i przypomnieniami; kalendarz w stylu Apple Calendar z przeciąganiem; konfigurowalny ekran startowy; synchronizacja przez Firebase; skupienie na zadaniu.

**1.0** — Pomodoro z czterema trybami, kolorowe gotowe tagi, siedem motywów, język angielski, powiadomienia w przeglądarce.

## ⚖️ Licencje

Czcionka [Inter](https://rsms.me/inter/) jest na licencji SIL Open Font License 1.1. Obrazy w README używają [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).

<div align="center">
<br>
<sub>Zrobił [Vlad](https://t.me/arkhitkovv). Jeśli Okto ci się przydał, zostaw ⭐ w repozytorium.</sub>
</div>
