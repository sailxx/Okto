[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · **ئۇيغۇرچە** · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto - كۈنىڭىزنى پىلانلاڭ ، مۇھىم ئىشلارغا دىققەت قىلىڭ"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="تور دېتالىنى ئېچىڭ"></a>&nbsp; & nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="Android نى چۈشۈرۈڭ"></a>&nbsp; & nbsp;<a href="https://github.com/sailxx-apps/Okto/releases/download/tray-v1.8.2/OktoTraySetup.exe"><img src="assets/readme/btn-windows-en.svg" height="52" alt="Windows نى چۈشۈرۈڭ"></a>

**Okto ھەرقانداق ئۈسكۈنىدە ئىشلەيدۇ** — iPhone ۋە Android ، تاختا كومپيۇتېر ، Windows ، macOS ۋە Linux. سىز ئېھتىياجلىق بولغىنى توركۆرگۈچ ، Okto تېلېفونىڭىز ياكى كومپيۇتېرىڭىزغا ئەپ سۈپىتىدە ئورنىتىدۇ. Android يەنە ۋەزىپە كىچىك قورالى بىلەن مەخسۇس ئەپكە ئېرىشىدۇ - ئۇنى تاپالايسىز [كومى دۇكىنى](https://github.com/komi-store/komi-store) ھەم.

</div>

> [!NOTE]
> ئەپ كۆرۈنمە يۈزى رۇسچە ۋە ئىنگلىزچە.

Android APK تۇنجى پىلاننى ئۆز ئىچىگە ئالغان پىلانلىغۇچىنى تورسىز ئېچىۋېتىدۇ. ماس قەدەملىك سانلىق مەلۇمات ۋە كۆرۈنۈش تەڭشەكلىرىنى ئەسلىگە كەلتۈرۈش ئۈچۈن ئوخشاش Google ھېساباتى بىلەن كىرىڭ. پەقەت كونا توركۆرگۈچ دېتالىدا ساقلانغان سانلىق مەلۇمات ۋە قوشۇمچە ھۆججەتلەر شۇ يەردە ساقلىنىدۇ.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Okto بۆلەكلىرى: ئۆي ، ۋەزىپە ، كالېندار ، فوكۇس">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Okto بۆلەكلىرى: ئۆي ، ۋەزىپە ، كالېندار ، فوكۇس"></picture>

<br>

<details>
<summary>ماسقەدەملەشنى قانداق ئېچىش</summary>

رامكىدىن Okto ئۈسكۈنىڭىزدىكى توركۆرگۈدىكى ھەممە نەرسىنى ساقلايدۇ. تېلېفون ۋە كومپيۇتېردا ئوخشاش سانلىق مەلۇماتقا ئىگە بولۇش ئۈچۈن ، ھەقسىز Firebase تۈرىنى ئۇلاڭ (ئۇچقۇن پىلانى ، كارتا لازىم ئەمەس):

1. بىر تۈر قۇر [console.firebase.google.com](https://console.firebase.google.com/).
2. **دەلىللەش → كىرىش ئۇسۇلى** — قوزغىتىش **Google**. In **تەڭشەك → ھوقۇق بېرىلگەن دائىرە** قوش `sailxx-apps.github.io`.
3. **Firestore ساندان** — ساندان قۇرۇش ۋە چاپلاش [`firestore.rules`](firestore.rules) the **قائىدە** بەتكۈچ.
4. **تۈر تەڭشىكى → ئەپلىرىڭىز → تور** — ئەپنى تىزىملىتىڭ ۋە كۆپەيتىڭ `apiKey`, `authDomain`, `projectId`, `appId`.
5. GitHub ئامبىرىدا: **تەڭشەك → مەخپىيەتلىك ۋە ئۆزگەرگۈچى مىقدار → مەشغۇلات** — سىرلارنى قوشۇڭ `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. ئورۇنلاشتۇرۇشنى ئىجرا قىلىڭ. «Google بىلەن كىرىش» Okto نىڭ تەڭشىكىدە كۆرۈنىدۇ.

بۇ كۇنۇپكىلار مەخپىي ئەمەس - زىيارەت قىلىش Firestore قائىدىسى تەرىپىدىن قوغدىلىدۇ ، شۇڭا ھەممە ئادەم پەقەت ئۆزىنىڭ سانلىق مەلۇماتلىرىنىلا كۆرىدۇ. بەتكۈچ ئېچىلغاندا تور بېكەتتىكى ئەسكەرتىش. Android دېتالىدا ، Okto تاقالغاندىمۇ ئەسكەرتىشلەر كېلىدۇ.

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="بىخەتەرلىك: ئىمزا ، سانلىق مەلۇمات ، ئىجازەت"></picture>

<br>

## Okto ھەققىدە

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="Okto ھەققىدە"></picture>

Okto 2026-يىلى 10-ئاينىڭ 2-كۈنى ئاددىي تور ھېسابلىغۇچ سۈپىتىدە باشلانغان. ئۇ ۋەزىپە ، كالېندار ۋە فوكۇسنى ھەقسىز پىلانلىغۇچىغا ئايلاندى. بۇ يەردە ئېلان ، ئانالىز ياكى ئىز قوغلىغۇچىلار يوق. يازمىلىرىڭىز ئۈسكۈنىڭىزدە تۇرىدۇ ، Google Firebase ئارقىلىق ماسقەدەملەشنى تاللىسىڭىز بولىدۇ. [بىخەتەرلىك: ئىمزا ، سانلىق مەلۇمات ، ئىجازەت](PRIVACY.md)

## يول خەرىتىسى

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="يول خەرىتىسى"></picture>

**2026-10-02** — تۇنجى Okto نىشان ۋە سائەت سائىتى بار بىر چېكىش ساندۇقى ئىدى.

**1.0** — تۆت خىل ھالەتتىكى پومودورو ، رەڭلىك ئالدىن بەلگىلەش بەلگىسى ، يەتتە تېما ، ئىنگلىز تىلى ، توركۆرگۈچ ئۇقتۇرۇشى.

**2.0** — تىزىملىك ​​، تەكرارلاش ، تارماق تىزىملىك ​​ۋە ئەسكەرتىشلەر بىلەن ۋەزىپە سۆرەپ تاشلاش ئارقىلىق ئالما كالېندارى ئۇسلۇبىدىكى كالېندار خاسلاشتۇرغىلى بولىدىغان ئائىلە ئېكرانى Firebase ماسقەدەملەش بىر ئىشقا دىققەت قىلىڭ.

**2.1** — ئائىلە ئېكرانى ۋەزىپە كىچىك قورالى بىلەن Android دېتالى ئالما ئۇسلۇبىدىكى يۇمشاق ۋە قېنىق تېمىلار چاقىرىش ۋە فوكۇسنى يوشۇرۇشقا بولىدۇ. تىل تەڭشەكلەرگە تەڭشەلدى. Android دا مۇقىم قوزغىتىش.

**2.2–2.8** — ئەپ سىنبەلگىسىنى تاللاڭ ۋەزىپىلەردىكى رەسىم ۋە ھۆججەتلەر ، تورسىز قويۇپ بېرىش كالېنداردىكى قاتلىنىدىغان ئاي ۋەزىپە ئەسكەرتىش Android; Google كالېندارىدىكى ۋەزىپە 14 يېڭى يورۇق ۋە قاراڭغۇ تېما تېكىست چوڭلۇقى ۋە ئۈچ يېڭى كىچىك قورال. باش بەتتىكى پائالىيەت خەرىتىسى.

**3.0** — رەسىم ۋە ھۆججەتلەر بىلەن ئىزاھات بۆلىكى يۇمشاق رەڭلىك كارتا ۋە بۈگۈن / ھەپتە / ئومۇمىي بەتكۈچ بار يېڭى ئۆي لەيلىمە يول باشلاش بالدىقى ۋە ئۈستەل يۈزىدە قاتلىنىدىغان يانبالداق. قاتلىنىدىغان بۆلەكلەر بىلەن تەڭشەكلەر يېڭىلانغان فوكۇس ئېكرانى Android كىچىك قوراللار ئوڭشالدى.

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — Okto Windows تەخسە دېتالىغا ئېرىشتى. Android پىلانلىغۇچى تورسىز ئېچىلىدۇ ، 3.23.6 قوشۇمچە زاپچاس ۋە فوكۇس ئېكرانىنى ياخشىلايدۇ.

## ⚖️ ئىجازەتنامە

The [Inter](https://rsms.me/inter/) خەت نۇسخىسى SIL ئوچۇق خەت ئىجازەتنامىسى 1.1 غا ئىجازەت بېرىلگەن. README رەسىملىرى تەڭشەلدى [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
