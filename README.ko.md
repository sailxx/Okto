[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · **한국어** · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto — 하루를 계획하고 중요한 일에 집중하세요"></picture>

<a href="https://sailxx.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="웹 앱 열기"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="Android용 다운로드"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx/Okto/releases/tag/tray-v1.7"><img src="assets/readme/btn-windows-en.svg" height="52" alt="Windows용 다운로드"></a>

**Okto는 모든 장치에서 작동합니다.** — iPhone 및 Android , 태블릿, Windows , macOS 및 Linux . 브라우저만 있으면 Okto가 휴대폰이나 컴퓨터에 앱으로 설치됩니다. Android에는 작업 위젯이 포함된 전용 앱도 제공됩니다. [코미스토어](https://github.com/komi-store/komi-store) 도.

</div>

> [!NOTE]
> 앱 인터페이스는 러시아어와 영어로 제공됩니다.

Android APK는 첫 실행 시를 포함해 오프라인으로 플래너를 엽니다. 동기화된 데이터 및 모양 설정을 복원하려면 동일한 Google 계정으로 로그인하세요. 이전 브라우저 앱에만 저장된 데이터와 첨부 파일은 계속해서 사용할 수 있습니다.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Okto 섹션: 홈, 작업, 달력, 포커스">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Okto 섹션: 홈, 작업, 달력, 포커스"></picture>

<br>

<details>
<summary>동기화를 켜는 방법</summary>

즉시 사용 가능한 Okto는 장치의 브라우저에 있는 모든 내용을 유지합니다. 휴대전화와 컴퓨터에서 동일한 데이터를 유지하려면 무료 Firebase 프로젝트를 연결하세요(Spark 요금제, 카드 필요 없음).:

1. 다음에서 프로젝트를 생성하세요. [console.firebase.google.com](https://console.firebase.google.com/).
2. **인증 → 로그인 방법** — ~할 수 있게 하다 **Google**. ~ 안에 **설정 → 승인된 도메인** 추가하다 `sailxx.github.io`.
3. **Firestore 데이터베이스** — 데이터베이스를 만들고 붙여넣기 [`firestore.rules`](firestore.rules) 속으로 **규칙** 꼬리표.
4. **프로젝트 설정 → 내 앱 → 웹** — 앱을 등록하고 복사하세요 `apiKey`, `authDomain`, `projectId`, `appId`.
5. GitHub 저장소에서: **설정 → 비밀 및 변수 → 작업** — 비밀을 추가해 `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. 배포를 실행합니다. Okto의 설정에 "Google로 로그인"이 나타납니다.

이러한 키는 비밀이 아닙니다. 액세스는 Firestore 규칙으로 보호되므로 모든 사람은 자신의 데이터만 볼 수 있습니다. 탭이 열려 있는 동안 웹사이트의 알림이 실행됩니다. Android 앱에서는 Okto가 닫혀 있어도 알림이 도착합니다.

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="보안: 서명, 데이터, 권한"></picture>

<br>

## Okto 소개

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="Okto 소개"></picture>

Okto는 2026년 10월 2일 간단한 웹 카운터로 시작되었습니다. 작업, 캘린더, 집중을 위한 무료 플래너로 성장했습니다. 광고, 분석 또는 추적기가 없습니다. 항목은 기기에 유지되며 Google Firebase를 통해 동기화하도록 선택할 수 있습니다. [보안: 서명, 데이터, 권한](PRIVACY.md)

## 로드맵

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="로드맵"></picture>

**2026-10-02** — 최초의 Okto는 타겟과 스톱워치가 있는 원탭 카운터였습니다.

**1.0** — 4가지 모드, 컬러 사전 설정 태그, 7가지 테마, 영어, 브라우저 알림을 갖춘 Pomodoro.

**2.0** — 목록, 반복, 하위 작업 및 미리 알림이 포함된 작업; 드래그 앤 드롭이 가능한 Apple 캘린더 스타일 캘린더; 맞춤형 홈 화면; Firebase 동기화; 작업에 집중하세요.

**2.1** — 홈 화면 작업 위젯이 있는 Android 앱 Apple 스타일의 부드러운 밝고 어두운 테마; 통화 및 집중을 숨길 수 있습니다. 언어는 설정에서 설정됩니다. Android에서 실행이 수정되었습니다.

**2.2–2.8** — 앱 아이콘을 선택하세요. 작업의 사진 및 파일, 오프라인 실행; 달력에서 접을 수 있는 달; Android의 작업 알림; Google 캘린더의 작업 14개의 새로운 밝은 테마와 어두운 테마; 텍스트 크기 및 세 가지 새로운 위젯; 홈 화면의 활동 지도.

**3.0** — 사진과 파일이 포함된 메모 섹션 부드러운 색상의 카드와 오늘/주/총계 탭이 있는 새로운 홈; 데스크탑의 플로팅 네비게이션 바와 접을 수 있는 사이드바; 접을 수 있는 섹션이 있는 설정 새로워진 초점 화면; Android 위젯이 수정되었습니다.

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — Okto는 Windows 트레이 앱을 얻었습니다. Android 플래너는 오프라인으로 열리고 3.23.6는 첨부 파일과 포커스 화면을 개선합니다.

## ⚖️ 라이센스

그만큼 [인테르](https://rsms.me/inter/) 글꼴은 SIL 오픈 글꼴 라이선스 1.1에 따라 라이선스가 부여됩니다. README 이미지는 다음과 같이 설정됩니다. [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
