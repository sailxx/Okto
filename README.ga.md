[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · **Gaeilge** · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto - pleanáil do lá, dírigh ar na rudaí atá tábhachtach"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="Oscail app gréasáin"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx-apps/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="Íoslódáil bileog eolais Android"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx-apps/Okto/releases/tag/tray-v1.7"><img src="assets/readme/btn-windows-en.svg" height="52" alt="Íoslódáil bileog eolais Windows"></a>

**Oibríonn Okto ar aon fheiste** — iPhone agus Android , táibléad, Windows , macOS agus Linux . Níl uait ach brabhsálaí, agus suiteálann Okto mar aip ar do ghuthán nó ríomhaire. Faigheann Android aip tiomnaithe freisin le giuirléid tascanna - is féidir leat é a fháil isteach [Siopa Komi](https://github.com/komi-store/komi-store) freisin.

</div>

> [!NOTE]
> Tá an comhéadan app ar fáil i Rúisis agus i mBéarla.

Osclaíonn an Android APK an pleanálaí as líne, lena n-áirítear ar an gcéad seoladh. Sínigh isteach leis an gcuntas Google céanna chun sonraí sioncronaithe agus socruithe láithris a aischur. Tá sonraí agus ceangaltáin atá stóráilte san aip brabhsálaí amháin ar fáil fós ann.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Ailt Okto: Baile, Tascanna, Féilire, Fócas">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Ailt Okto: Baile, Tascanna, Féilire, Fócas"></picture>

<br>

<details>
<summary>Conas sioncrónú a chur ar siúl</summary>

Amach as an mbosca coimeádann Okto gach rud sa bhrabhsálaí ar do ghléas. Chun na sonraí céanna a bheith agat ar an bhfón agus ar an ríomhaire, ceangail tionscadal Firebase saor in aisce (plean Spark, níl gá le cárta):

1. Cruthaigh tionscadal ag [consól.firebase.google.com](https://console.firebase.google.com/).
2. **Fíordheimhniú → Modh síniú isteach** — chumasú **Google**. I **Socruithe → Fearainn údaraithe** cuir `sailxx-apps.github.io`.
3. **Bunachar Sonraí Firestore** — bunachar sonraí a chruthú agus a ghreamú [`firestore.rules`](firestore.rules) isteach sa **Rialacha** cluaisín.
4. **Socruithe tionscadail → Do chuid apps → Gréasáin** — cláraigh an aip agus cóipeáil `apiKey`, `authDomain`, `projectId`, `appId`.
5. Sa repo GitHub: **Socruithe → Rúin agus athróga → Gníomhartha** — cuir na rúin `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Rith an imscaradh. Tá “Sínigh isteach le Google” le feiceáil i socruithe Okto.

Níl na heochracha seo rúnda - tá rochtain cosanta ag rialacha Firestore, mar sin ní fheiceann gach duine ach a gcuid sonraí féin. Meabhrúcháin ar an láithreán gréasáin dóiteáin agus an cluaisín oscailte. Sa app Android, tagann meabhrúcháin fiú nuair a bhíonn Okto dúnta.

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="Slándáil: síniú, sonraí, ceadanna"></picture>

<br>

## Maidir Okto

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="Maidir Okto"></picture>

Thosaigh Okto ar 2 Deireadh Fómhair, 2026 mar chuntar gréasáin simplí. D'fhás sé ina phleanálaí saor in aisce le haghaidh tascanna, féilirí agus fócas. Níl aon fhógraí, anailísíocht ná rianairí ann. Fanann d’iontrálacha ar do ghléas, agus is féidir leat tarraingt isteach chun sioncronú a dhéanamh trí Google Firebase. [Slándáil: síniú, sonraí, ceadanna](PRIVACY.md)

## Treochlár

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="Treochlár"></picture>

**2026-10-02** — Cuntar aon sconna a bhí sa chéad Okto le sprioc agus stopuaireadóir.

**1.0** — Pomodoro le ceithre mhodh, clibeanna daite réamhshocraithe, seacht dtéama, Béarla, fógraí brabhsálaí.

**2.0** — tascanna le liostaí, athrá, subtascanna agus meabhrúcháin; Féilire stíl Apple Calendar le tarraing agus scaoil; scáileán baile is féidir a shaincheapadh; Sioncronú Firebase; díriú ar thasc.

**2.1** — Android app le ghiuirléid tasc scáileán baile; solas bog agus téamaí dorcha i stíl Apple; Is féidir Glaonna agus Fócas a chur i bhfolach; tá teanga socraithe i Socruithe; seoladh seasta ar Android .

**2.2–2.8** — roghnaigh an deilbhín app; grianghraif agus comhaid i dtascanna, seoladh as líne; mí infhillte sa fhéilire; meabhrúcháin tasc ar Android ; tascanna in Google Calendar; 14 théama nua éadrom agus dorcha; méid an téacs agus trí ghiuirléid nua; léarscáil gníomhaíochta ar an scáileán baile.

**3.0** — alt Nótaí le grianghraif agus comhaid; Baile nua le cártaí bog daite agus cluaisíní Inniu/Seachtain/Iomláin; barraí loingseoireachta ar snámh agus barra taoibh infhillte ar an deasc; Socruithe le hailt infhillte; scáileán Fócas athnuaite; Ceartúcháin ghiuirléid Android.

[**3.23.6**](https://github.com/sailxx-apps/Okto/releases/tag/v3.23.6) — Fuair ​​​​Okto aip tráidire Windows. Osclaíonn an pleanálaí Android as líne, agus feabhsaíonn 3.23.6 ceangaltáin agus an scáileán Fócas.

## ⚖️ Ceadúnais

Tá an [Idir](https://rsms.me/inter/) tá cló ceadúnaithe faoin gCeadúnas Cló Oscailte SIL 1.1 . Tá íomhánna README socraithe isteach [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
