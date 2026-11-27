[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · **Tiếng Việt** · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto — lập kế hoạch cho ngày của bạn, tập trung vào những gì quan trọng"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="Mở ứng dụng web"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="Tải xuống cho Android"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx/Okto/releases/tag/tray-v1.7"><img src="assets/readme/btn-windows-en.svg" height="52" alt="Tải xuống cho Windows"></a>

**Okto hoạt động trên mọi thiết bị** — iPhone và Android, máy tính bảng, Windows, macOS và Linux. Tất cả những gì bạn cần là một trình duyệt và Okto sẽ cài đặt dưới dạng một ứng dụng trên điện thoại hoặc máy tính của bạn. Android cũng có một ứng dụng chuyên dụng với tiện ích tác vụ — bạn có thể tìm thấy ứng dụng này trong [Cửa hàngKomi](https://github.com/komi-store/komi-store) cũng vậy.

</div>

> [!NOTE]
> Giao diện ứng dụng có sẵn bằng tiếng Nga và tiếng Anh.

Android APK mở công cụ lập kế hoạch ngoại tuyến, kể cả trong lần khởi chạy đầu tiên. Đăng nhập bằng cùng một tài khoản Google để khôi phục cài đặt giao diện và dữ liệu đã đồng bộ hóa. Dữ liệu và tệp đính kèm chỉ được lưu trữ trong ứng dụng trình duyệt cũ vẫn có sẵn ở đó.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Các phần của Okto: Trang chủ, Nhiệm vụ, Lịch, Tiêu điểm">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Các phần của Okto: Trang chủ, Nhiệm vụ, Lịch, Tiêu điểm"></picture>

<br>

<details>
<summary>Cách bật đồng bộ hóa</summary>

Okto có sẵn ngay lập tức lưu giữ mọi thứ trong trình duyệt trên thiết bị của bạn. Để có cùng một dữ liệu trên điện thoại và máy tính, hãy kết nối dự án Firebase miễn phí (Gói Spark, không cần thẻ):

1. Tạo một dự án tại [console.firebase.google.com](https://console.firebase.google.com/).
2. **Xác thực → Phương thức đăng nhập** — cho phép **Google**. TRONG **Cài đặt → Miền được ủy quyền** thêm vào `sailxx-apps.github.io`.
3. **Cơ sở dữ liệu Firestore** — tạo cơ sở dữ liệu và dán [`firestore.rules`](firestore.rules) vào **Quy tắc** tab.
4. **Cài đặt dự án → Ứng dụng của bạn → Web** — đăng ký ứng dụng và sao chép `apiKey`, `authDomain`, `projectId`, `appId`.
5. Trong kho lưu trữ GitHub: **Cài đặt → Bí mật và biến → Hành động** — thêm những bí mật `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Chạy triển khai. “Đăng nhập bằng Google” xuất hiện trong cài đặt của Okto.

Các khóa này không phải là bí mật — quyền truy cập được bảo vệ bởi các quy tắc của Firestore, vì vậy mọi người chỉ nhìn thấy dữ liệu của riêng mình. Lời nhắc trên trang web sẽ kích hoạt khi tab đang mở. Trong ứng dụng Android, lời nhắc sẽ xuất hiện ngay cả khi Okto đóng.

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="Bảo mật: chữ ký, dữ liệu, quyền"></picture>

<br>

## Giới thiệu về Okto

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="Giới thiệu về Okto"></picture>

Okto bắt đầu hoạt động vào ngày 2 tháng 10 năm 2026 dưới dạng một bộ đếm web đơn giản. Nó đã phát triển thành một công cụ lập kế hoạch miễn phí cho các nhiệm vụ, lịch và sự tập trung. Không có quảng cáo, phân tích hoặc trình theo dõi. Các mục nhập của bạn vẫn còn trên thiết bị của bạn và bạn có thể chọn tham gia đồng bộ hóa thông qua Google Firebase. [Bảo mật: chữ ký, dữ liệu, quyền](PRIVACY.md)

## Lộ trình

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="Lộ trình"></picture>

**2026-10-02** — Okto đầu tiên là bộ đếm một chạm có mục tiêu và đồng hồ bấm giờ.

**1.0** — Pomodoro với bốn chế độ, thẻ cài sẵn màu, bảy chủ đề, ngôn ngữ tiếng Anh, thông báo trình duyệt.

**2.0** — nhiệm vụ có danh sách, lặp lại, nhiệm vụ phụ và lời nhắc; Lịch kiểu Lịch Apple với tính năng kéo và thả; màn hình chính có thể tùy chỉnh; Đồng bộ hóa căn cứ hỏa lực; tập trung vào một nhiệm vụ.

**2.1** — Ứng dụng Android với tiện ích tác vụ trên màn hình chính; chủ đề sáng và tối dịu nhẹ theo phong cách Apple; Cuộc gọi và Tiêu điểm có thể bị ẩn; ngôn ngữ được đặt trong Cài đặt; đã sửa lỗi khởi chạy trên Android.

**2.2–2.8** — chọn biểu tượng ứng dụng; ảnh và tập tin trong tác vụ, khởi chạy ngoại tuyến; tháng đóng mở trong lịch; nhắc nhở công việc trên Android; nhiệm vụ trong Lịch Google; 14 chủ đề ánh sáng và bóng tối mới; kích thước văn bản và ba vật dụng mới; bản đồ hoạt động trên màn hình chính.

**3.0** — phần Ghi chú có ảnh và tập tin; Trang chủ mới với các thẻ màu dịu và các tab Hôm nay / Tuần / Tổng cộng; thanh điều hướng nổi và thanh bên có thể thu gọn trên màn hình; Cài đặt với các phần có thể thu gọn; màn hình Focus được làm mới; Sửa lỗi tiện ích Android.

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — Okto đã có ứng dụng khay Windows. Công cụ lập kế hoạch Android mở ngoại tuyến và 3.23.6 cải thiện các tệp đính kèm và màn hình Tiêu điểm.

## ⚖️ Giấy phép

các [Chôn cất](https://rsms.me/inter/) phông chữ được cấp phép theo Giấy phép Phông chữ Mở SIL 1.1. Hình ảnh README được đặt trong [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
