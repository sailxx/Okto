[English](README.md) · [العربية](README.ar.md) · **简体中文** · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto — 计划你的一天，专注于重要的事情"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="打开网络应用程序"></a>&nbsp;;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="下载Android"></a>&nbsp;;<a href="https://github.com/sailxx-apps/Okto/releases/download/tray-v1.8.2/OktoTraySetup.exe"><img src="assets/readme/btn-windows-en.svg" height="52" alt="下载Windows"></a>

**Okto 适用于任何设备** — iPhone 和 Android、平板电脑、Windows、macOS 和 Linux。您只需要一个浏览器，Okto 就会作为应用程序安装在您的手机或计算机上。 Android 还拥有一个带有任务小部件的专用应用程序 - 您可以在 [科米店](https://github.com/komi-store/komi-store) 也。

</div>

> [!NOTE]
> 该应用程序界面有俄语和英语版本。

Android APK 可离线打开规划器，包括首次启动时。使用同一 Google 帐户登录以恢复同步的数据和外观设置。仅存储在旧浏览器应用程序中的数据和附件仍然可用。

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Okto 部分：主页、任务、日历、焦点">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Okto 部分：主页、任务、日历、焦点"></picture>

<br>

<details>
<summary>如何开启同步</summary>

开箱即用的 Okto 将浏览器中的所有内容保留在您的设备上。要在手机和计算机上拥有相同的数据，请连接免费的 Firebase 项目（Spark 计划，无需卡）:

1. 创建一个项目于 [console.firebase.google.com](https://console.firebase.google.com/).
2. **身份验证 → 登录方式** — 使能够 **谷歌**。在 **设置 → 授权域** 添加 `sailxx-apps.github.io`.
3. **Firestore数据库** — 创建数据库并粘贴 [`firestore.rules`](firestore.rules) 进入 **规则** 选项卡。
4. **项目设置 → 您的应用程序 → Web** — 注册应用程序并复制 `apiKey`, `authDomain`, `projectId`, `appId`.
5. 在 GitHub 仓库中: **设置 → 秘密和变量 → 操作** — 添加秘密 `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. 运行部署。 Okto 的设置中出现“使用 Google 登录”。

这些密钥不是秘密的 - 访问受到 Firestore 规则的保护，因此每个人只能看到自己的数据。当选项卡打开时，网站上的提醒会触发。在 Android 应用程序中，即使 Okto 关闭，提醒也会到达。

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="安全：签名、数据、权限"></picture>

<br>

## 关于Okto

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="关于Okto"></picture>

Okto 于 2026 年 10 月 2 日开始作为一个简单的网络计数器。它后来发展成为一款免费的任务、日历和焦点规划工具。没有广告、分析或跟踪器。您的条目会保留在您的设备上，并且您可以选择通过 Google Firebase 进行同步。 [安全：签名、数据、权限](PRIVACY.md)

## 路线图

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="路线图"></picture>

**2026-10-02** — 第一个 Okto 是带有目标和秒表的一键计数器。

**1.0** — 番茄工作法有四种模式、彩色预设标签、七个主题、英语、浏览器通知。

**2.0** — 带有列表、重复、子任务和提醒的任务； Apple Calendar 风格的拖放日历；可定制的主屏幕； Firebase 同步；专注于一项任务。

**2.1** — 带有主屏幕任务小部件的 Android 应用程序；苹果风格的柔和明暗主题；通话和焦点可以隐藏；语言在“设置”中设置；修复了 Android 上的启动问题。

**2.2–2.8** — 选择应用程序图标；任务中的照片和文件，离线启动；日历中可折叠的月份； Android上的任务提醒； Google 日历中的任务； 14 个新的光明和黑暗主题；文本大小和三个新的小部件；主屏幕上的活动地图。

**3.0** — 包含照片和文件的注释部分；带有柔和彩色卡片和“今日”/“周”/“总计”选项卡的新主页；桌面上的浮动导航栏和可折叠侧边栏；具有可折叠部分的设置；刷新的焦点屏幕； Android 小部件修复。

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — Okto 获得了 Windows 托盘应用程序。 Android 规划器可离线打开，3.23.6 改进了附件和焦点屏幕。

## ⚖️ 许可证

这 [国际米兰](https://rsms.me/inter/) 字体根据 SIL 开放字体许可证 1.1 获得许可。 README图像设置在 [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
