[English](README.md) · **العربية** · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Ελληνικά](README.el.md) · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto — خطط ليومك، وركز على ما يهمك"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="افتح تطبيق الويب"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="تحميل Android"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx-apps/Okto/releases/download/tray-v1.8.2/OktoTraySetup.exe"><img src="assets/readme/btn-windows-en.svg" height="52" alt="تحميل Windows"></a>

**يعمل Okto على أي جهاز** — iPhone وAndroid والأجهزة اللوحية وWindows وmacOS وLinux. كل ما تحتاجه هو متصفح، ويتم تثبيت Okto كتطبيق على هاتفك أو جهاز الكمبيوتر الخاص بك. تحصل Android أيضًا على تطبيق مخصص به أداة مهمة - يمكنك العثور عليها فيه [متجر كومي](https://github.com/komi-store/komi-store) أيضاً.

</div>

> [!NOTE]
> واجهة التطبيق متاحة باللغتين الروسية والإنجليزية.

يفتح Android APK المخطط دون الاتصال بالإنترنت، بما في ذلك عند الإطلاق لأول مرة. قم بتسجيل الدخول باستخدام حساب Google نفسه لاستعادة البيانات المتزامنة وإعدادات المظهر. تظل البيانات والمرفقات المخزنة فقط في تطبيق المتصفح القديم متاحة هناك.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="أقسام Okto: الصفحة الرئيسية، المهام، التقويم، التركيز">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="أقسام Okto: الصفحة الرئيسية، المهام، التقويم، التركيز"></picture>

<br>

<details>
<summary>كيفية تشغيل المزامنة</summary>

يحتفظ Okto بكل شيء في المتصفح على جهازك. للحصول على نفس البيانات على الهاتف والكمبيوتر، قم بتوصيل مشروع Firebase مجاني (خطة Spark، لا حاجة إلى بطاقة):

1. إنشاء مشروع في [console.firebase.google.com](https://console.firebase.google.com/).
2. **المصادقة ← طريقة تسجيل الدخول** — يُمكَِن **جوجل**. في **الإعدادات → المجالات المعتمدة** يضيف `sailxx-apps.github.io`.
3. **قاعدة بيانات فايرستور** — إنشاء قاعدة بيانات ولصقها [`firestore.rules`](firestore.rules) في **قواعد** فاتورة غير مدفوعة.
4. **إعدادات المشروع → تطبيقاتك → الويب** — تسجيل التطبيق ونسخ `apiKey`, `authDomain`, `projectId`, `appId`.
5. في الريبو GitHub: **الإعدادات → الأسرار والمتغيرات → الإجراءات** — أضف الأسرار `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. قم بتشغيل النشر. تظهر عبارة "تسجيل الدخول باستخدام Google" في إعدادات Okto.

هذه المفاتيح ليست سرية - الوصول إليها محمي بموجب قواعد Firestore، لذلك يرى الجميع بياناتهم الخاصة فقط. يتم تنشيط التذكيرات الموجودة على موقع الويب أثناء فتح علامة التبويب. في تطبيق Android، تصل التذكيرات حتى عندما يكون Okto مغلقًا.

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="الأمان: التوقيع والبيانات والأذونات"></picture>

<br>

## حول Okto

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="حول Okto"></picture>

بدأت Okto في 2 أكتوبر 2026 كعداد ويب بسيط. لقد تطور ليصبح مخططًا مجانيًا للمهام والتقويمات والتركيز. لا توجد إعلانات أو تحليلات أو أجهزة تتبع. تظل إدخالاتك على جهازك، ويمكنك الاشتراك في المزامنة من خلال Google Firebase. [الأمان: التوقيع والبيانات والأذونات](PRIVACY.md)

## خريطة الطريق

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="خريطة الطريق"></picture>

**2026-10-02** — كان أول Okto عبارة عن عداد بنقرة واحدة مع هدف وساعة توقيت.

**1.0** — بومودورو مع أربعة أوضاع، وعلامات ملونة محددة مسبقًا، وسبعة مواضيع، واللغة الإنجليزية، وإشعارات المتصفح.

**2.0** — المهام مع القوائم، والتكرارات، والمهام الفرعية والتذكيرات؛ تقويم نمط Apple Calendar مع السحب والإسقاط؛ شاشة رئيسية قابلة للتخصيص؛ مزامنة Firebase؛ التركيز على المهمة.

**2.1** — تطبيق Android مع أداة المهام على الشاشة الرئيسية؛ سمات فاتحة وداكنة ناعمة بأسلوب Apple؛ يمكن إخفاء المكالمات والتركيز. تم ضبط اللغة في الإعدادات؛ إطلاق ثابت على Android.

**2.2–2.8** — اختر أيقونة التطبيق؛ الصور والملفات في المهام، إطلاق دون اتصال بالإنترنت؛ شهر قابل للطي في التقويم؛ تذكيرات المهام على Android؛ المهام في تقويم جوجل؛ 14 موضوعًا فاتحًا ومظلمًا جديدًا؛ حجم النص وثلاث عناصر واجهة مستخدم جديدة؛ خريطة النشاط على الشاشة الرئيسية.

**3.0** — قسم الملاحظات مع الصور والملفات؛ منزل جديد به بطاقات ملونة ناعمة وعلامات التبويب "اليوم/الأسبوع/الإجماليات"؛ أشرطة التنقل العائمة والشريط الجانبي القابل للطي على سطح المكتب؛ إعدادات بأقسام قابلة للطي؛ شاشة التركيز المحدثة؛ إصلاحات القطعة Android.

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — حصل Okto على تطبيق صينية Windows. يتم فتح مخطط Android في وضع عدم الاتصال، ويعمل 3.23.6 على تحسين المرفقات وشاشة التركيز.

## ⚖️ التراخيص

ال [انتر](https://rsms.me/inter/) الخط مرخص بموجب ترخيص SIL Open Font License 1.1. تم ضبط صور README [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
