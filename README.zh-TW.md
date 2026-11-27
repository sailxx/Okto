[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · **繁體中文** · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto — 規劃你的一天，專注於重要的事情"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="開啟網路應用程式"></a>&nbsp;;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="下載Android"></a>&nbsp;;<a href="https://github.com/sailxx-apps/Okto/releases/download/tray-v1.8.2/OktoTraySetup.exe"><img src="assets/readme/btn-windows-en.svg" height="52" alt="下載Windows"></a>

**Okto 適用於任何設備** — iPhone 和 Android、平板電腦、Windows、macOS 和 Linux。您只需要一個瀏覽器，Okto 就會作為應用程式安裝在您的手機或電腦上。 Android 還擁有一個帶有任務小部件的專用應用程式 - 您可以在 [科米店](https://github.com/komi-store/komi-store) 也。

</div>

> [!NOTE]
> 該應用程式介面有俄語和英語版本。

Android APK 可離線開啟規劃器，包括首次啟動時。使用相同 Google 帳戶登入以恢復同步的資料和外觀設定。僅儲存在舊瀏覽器應用程式中的資料和附件仍然可用。

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Okto 部分：首頁、任務、日曆、焦點">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Okto 部分：首頁、任務、日曆、焦點"></picture>

<br>

<details>
<summary>如何開啟同步</summary>

開箱即用的 Okto 將瀏覽器中的所有內容保留在您的裝置上。要在手機和電腦上擁有相同的數據，請連接免費的 Firebase 專案（Spark 計劃，無需卡片）:

1. 創建一個專案於 [console.firebase.google.com](https://console.firebase.google.com/).
2. **驗證 → 登入方式** — 使能夠 **Google**。在 **設定 → 授權域** 添加 `sailxx-apps.github.io`.
3. **Firestore資料庫** — 建立資料庫並貼​​上 [`firestore.rules`](firestore.rules) 進入 **規則** 選項卡。
4. **專案設定 → 您的應用程式 → Web** — 註冊應用程式並複製 `apiKey`, `authDomain`, `projectId`, `appId`.
5. 在 GitHub 倉庫中: **設定 → 秘密和變數 → 操作** — 添加秘密 `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. 運行部署。 Okto 的設定中出現「使用 Google 登入」。

這些金鑰不是秘密的 - 存取受到 Firestore 規則的保護，因此每個人只能看到自己的資料。當選項卡開啟時，網站上的提醒會觸發。在 Android 應用程式中，即使 Okto 關閉，提醒也會到達。

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="安全：簽名、資料、權限"></picture>

<br>

## 關於Okto

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="關於Okto"></picture>

Okto 於 2026 年 10 月 2 日開始作為一個簡單的網路計數器。它後來發展成為一款免費的任務、日曆和焦點規劃工具。沒有廣告、分析或追蹤器。您的條目會保留在您的裝置上，並且您可以選擇透過 Google Firebase 進行同步。 [安全：簽名、資料、權限](PRIVACY.md)

## 路線圖

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="路線圖"></picture>

**2026-10-02** — 第一個 Okto 是帶有目標和秒錶的一鍵計數器。

**1.0** — 番茄工作法有四種模式、彩色預設標籤、七個主題、英文、瀏覽器通知。

**2.0** — 帶有清單、重複、子任務和提醒的任務； Apple Calendar 風格的拖放日曆；可自訂的主螢幕； Firebase 同步；專注於一項任務。

**2.1** — 帶有主螢幕任務小部件的 Android 應用程式；蘋果風格的柔和明暗主題；通話和焦點可以隱藏；語言在「設定」中設定；修復了 Android 上的啟動問題。

**2.2–2.8** — 選擇應用程式圖示；任務中的照片和文件，離線啟動；日曆中可折疊的月份；Android上的任務提醒； Google 日曆中的任務； 14 個新的光明和黑暗主題；文字大小和三個新的小部件；主螢幕上的活動地圖。

**3.0** — 包含照片和文件的註釋部分；帶有柔和彩色卡片和“今日”/“週”/“總計”選項卡的新主頁；桌面上的浮動導航列和可折疊側邊欄；具有可折疊部分的設置；刷新的焦點屏幕； Android 小部件修復。

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — Okto 獲得了 Windows 托盤應用程式。 Android 規劃器可離線打開，3.23.6 改進了配件和焦點螢幕。

## ⚖️ 許可證

這 [國際米蘭](https://rsms.me/inter/) 字體根據 SIL 開放字體授權 1.1 獲得許可。 README影像設定在 [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
