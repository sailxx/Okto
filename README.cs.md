[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · **Čeština** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto — naplánujte si svůj den, zaměřte se na to, na čem záleží"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="Otevřete webovou aplikaci"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="Stáhnout pro Android"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx-apps/Okto/releases/download/tray-v1.8.2/OktoTraySetup.exe"><img src="assets/readme/btn-windows-en.svg" height="52" alt="Stáhnout pro Windows"></a>

**Okto funguje na jakémkoli zařízení** — iPhone a Android , tablety, Windows , macOS a Linux . Vše, co potřebujete, je prohlížeč a Okto se nainstaluje jako aplikace do vašeho telefonu nebo počítače. Android také získává speciální aplikaci s widgetem úkolu – najdete jej v [Obchod Komi](https://github.com/komi-store/komi-store) příliš.

</div>

> [!NOTE]
> Rozhraní aplikace je k dispozici v ruštině a angličtině.

Android APK otevře plánovač offline, a to i při prvním spuštění. Chcete-li obnovit synchronizovaná data a nastavení vzhledu, přihlaste se pomocí stejného účtu Google. Data a přílohy uložené pouze ve staré aplikaci prohlížeče tam zůstávají k dispozici.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Sekce Okto: Domů, Úkoly, Kalendář, Zaměření">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Sekce Okto: Domů, Úkoly, Kalendář, Zaměření"></picture>

<br>

<details>
<summary>Jak zapnout synchronizaci</summary>

Po vybalení Okto uchovává vše v prohlížeči ve vašem zařízení. Chcete-li mít stejná data na telefonu a počítači, připojte bezplatný projekt Firebase (plán Spark, není potřeba žádná karta):

1. Vytvořte projekt na [console.firebase.google.com](https://console.firebase.google.com/).
2. **Autentizace → Způsob přihlášení** — umožnit **Google**. V **Nastavení → Autorizované domény** přidat `sailxx-apps.github.io`.
3. **Databáze Firestore** — vytvořit databázi a vložit [`firestore.rules`](firestore.rules) do **Pravidla** tab.
4. **Nastavení projektu → Vaše aplikace → Web** — zaregistrujte aplikaci a zkopírujte `apiKey`, `authDomain`, `projectId`, `appId`.
5. V repozitáři GitHub: **Nastavení → Tajemství a proměnné → Akce** — přidat tajemství `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Spusťte nasazení. V nastavení Okto se zobrazí „Přihlásit se přes Google“.

Tyto klíče nejsou tajné — přístup je chráněn pravidly Firestore, takže každý vidí pouze svá vlastní data. Připomenutí na webu se spouští, když je karta otevřená. V aplikaci Android přicházejí připomenutí, i když je Okto zavřený.

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="Zabezpečení: podpis, data, oprávnění"></picture>

<br>

## O Okto

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="O Okto"></picture>

Okto začal 2. října 2026 jako jednoduchý webový čítač. Vyrostlo v bezplatný plánovač úkolů, kalendářů a zaměření. Neexistují žádné reklamy, analýzy ani sledovače. Vaše záznamy zůstanou ve vašem zařízení a můžete se přihlásit k synchronizaci prostřednictvím Google Firebase. [Zabezpečení: podpis, data, oprávnění](PRIVACY.md)

## Cestovní mapa

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="Cestovní mapa"></picture>

**2026-10-02** — První Okto byl čítač na jedno klepnutí s terčíkem a stopkami.

**1.0** — Pomodoro se čtyřmi režimy, barevnými přednastavenými značkami, sedmi motivy, anglickým jazykem, upozorněním v prohlížeči.

**2.0** — úkoly se seznamy, opakováními, dílčími úkoly a připomínkami; Kalendář ve stylu Apple Calendar s přetažením; přizpůsobitelná domovská obrazovka; Firebase synchronizace; soustředit se na úkol.

**2.1** — aplikace Android s widgetem úloh na domovské obrazovce; měkké světlé a tmavé motivy ve stylu Apple; Volání a zaměření lze skrýt; jazyk se nastavuje v Nastavení; opraveno spouštění na Android .

**2.2–2.8** — vyberte ikonu aplikace; fotografie a soubory v úkolech, spouštění offline; skládací měsíc v kalendáři; připomenutí úkolů na Android ; úkoly v Kalendáři Google; 14 nových světlých a tmavých témat; velikost textu a tři nové widgety; mapa aktivit na domovské obrazovce.

**3.0** — část Poznámky s fotografiemi a soubory; nový domov s měkkými barevnými kartami a kartami Dnes / Týden / Součty; plovoucí navigační panely a skládací postranní panel na ploše; Nastavení se skládacími sekcemi; obnovená obrazovka Focus; Opravy widgetu Android.

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — Okto získal zásobník Windows. Plánovač Android se otevírá offline a 3.23.6 vylepšuje přílohy a obrazovku Focus.

## ⚖️ licence

The [Mezi](https://rsms.me/inter/) písmo je licencováno pod licencí SIL Open Font License 1.1. Jsou vloženy obrázky README [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
