[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · **日本語** · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto — 一日の計画を立て、重要なことに集中する"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="ウェブアプリを開く"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="Android用ダウンロード"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx-apps/Okto/releases/download/tray-v1.8.2/OktoTraySetup.exe"><img src="assets/readme/btn-windows-en.svg" height="52" alt="Windows用ダウンロード"></a>

**Okto はどのデバイスでも動作します** — iPhone および Android 、タブレット、Windows 、macOS および Linux 。必要なのはブラウザだけで、Okto は携帯電話またはコンピュータにアプリとしてインストールされます。 Android には、タスク ウィジェットを備えた専用アプリも用意されています。 [コミストア](https://github.com/komi-store/komi-store) あまりにも。

</div>

> [!NOTE]
> アプリのインターフェースはロシア語と英語で利用できます。

Android APK は、初回起動時を含め、プランナーをオフラインで開きます。同期されたデータと外観設定を復元するには、同じ Google アカウントでサインインします。古いブラウザ アプリにのみ保存されているデータと添付ファイルは、そこで引き続き利用できます。

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Okto セクション: ホーム、タスク、カレンダー、フォーカス">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Okto セクション: ホーム、タスク、カレンダー、フォーカス"></picture>

<br>

<details>
<summary>同期をオンにする方法</summary>

Okto は、箱から出してすぐにデバイスのブラウザーにすべてが保存されます。携帯電話とコンピュータで同じデータを保持するには、無料の Firebase プロジェクトに接続します (Spark プラン、カードは必要ありません):

1. でプロジェクトを作成します [console.firebase.google.com](https://console.firebase.google.com/).
2. **認証→サインイン方法** — 有効にする **グーグル**。で **設定→認証済みドメイン** 追加 `sailxx-apps.github.io`.
3. **Firestore データベース** — データベースを作成して貼り付けます [`firestore.rules`](firestore.rules) に **ルール** タブ。
4. **プロジェクト設定 → アプリ → Web** — アプリを登録してコピーする `apiKey`, `authDomain`, `projectId`, `appId`.
5. GitHub リポジトリ内: **設定 → シークレットと変数 → アクション** — 秘密を追加する `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. デプロイを実行します。 Oktoの設定に「Googleでサインイン」が表示されます。

これらのキーは秘密ではありません。アクセスは Firestore ルールによって保護されているため、全員が自分のデータのみを参照できます。タブが開いている間、Web サイト上のリマインダーが起動されます。 Androidアプリでは、Oktoを閉じていてもリマインダーが届きます。

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="セキュリティ: 署名、データ、権限"></picture>

<br>

## Oktoについて

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="Oktoについて"></picture>

Oktoは2026年10月2日より簡易Webカウンターとしてスタートしました。それは、タスク、カレンダー、集中力のための無料のプランナーに成長しました。広告、分析、トラッカーはありません。エントリはデバイス上に残り、Google Firebase 経由で同期するようにオプトインできます。 [セキュリティ: 署名、データ、権限](PRIVACY.md)

## ロードマップ

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="ロードマップ"></picture>

**2026-10-02** — 初代Oktoはターゲットとストップウォッチを備えたワンタップカウンターでした。

**1.0** — 4 つのモード、色分けされたプリセット タグ、7 つのテーマ、英語、ブラウザ通知を備えたポモドーロ。

**2.0** — リスト、繰り返し、サブタスク、リマインダーを含むタスク。ドラッグアンドドロップによる Apple Calendar スタイルのカレンダー。カスタマイズ可能なホーム画面。 Firebase同期。タスクに集中します。

**2.1** — ホーム画面タスクウィジェットを備えた Android アプリ。 Apple スタイルの柔らかい光と闇のテーマ。通話とフォーカスを非表示にすることができます。言語は設定で設定します。 Android での起動を修正しました。

**2.2–2.8** — アプリのアイコンを選択します。タスク内の写真とファイル、オフライン起動。カレンダー内の折りたたみ可能な月。 Android のタスクリマインダー。 Googleカレンダーのタスク。 14 の新しい明るいテーマと暗いテーマ。テキストサイズと 3 つの新しいウィジェット。ホーム画面のアクティビティマップ。

**3.0** — 写真とファイルを含むメモセクション。柔らかい色のカードと今日/週/合計タブを備えた新しいホーム。デスクトップ上のフローティング ナビゲーション バーと折りたたみ可能なサイドバー。折りたたみ可能なセクションを備えた設定。リフレッシュされたフォーカス画面。 Android ウィジェットの修正。

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — OktoにはWindowsトレイアプリが追加されました。 Android プランナーはオフラインで開き、3.23.6 は添付ファイルとフォーカス画面を改善しました。

## ⚖️ ライセンス

の [インテル](https://rsms.me/inter/) フォントは、SIL オープン フォント ライセンス 1.1 に基づいてライセンスされています。 READMEの画像は [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
