[English](README.md) · [العربية](README.ar.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Čeština](README.cs.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Ελληνικά** · [Bahasa Indonesia](README.id.md) · [Gaeilge](README.ga.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md) · [Română](README.ro.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Українська](README.uk.md) · [اردو](README.ur.md) · [ئۇيغۇرچە](README.ug.md) · [Tiếng Việt](README.vi.md) · [Português](README.pt.md) · [Türkçe](README.tr.md)

<div align="center">


<br>

<picture><source srcset="assets/readme/hero-en.svg"><img src="assets/readme/png/hero-en.png" width="100%" alt="Okto — προγραμματίστε την ημέρα σας, εστιάστε σε ό,τι έχει σημασία"></picture>

<a href="https://sailxx-apps.github.io/Okto/"><img src="assets/readme/btn-web-en.svg" height="52" alt="Ανοίξτε την εφαρμογή Ιστού"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-en.svg" height="52" alt="Λήψη για Android"></a>&nbsp; &nbsp;<a href="https://github.com/sailxx/Okto/releases/tag/tray-v1.7"><img src="assets/readme/btn-windows-en.svg" height="52" alt="Λήψη για Windows"></a>

**Το Okto λειτουργεί σε οποιαδήποτε συσκευή** — iPhone και Android , tablet, Windows , macOS και Linux . Το μόνο που χρειάζεστε είναι ένα πρόγραμμα περιήγησης και το Okto εγκαθίσταται ως εφαρμογή στο τηλέφωνο ή τον υπολογιστή σας. Το Android διαθέτει επίσης μια αποκλειστική εφαρμογή με ένα γραφικό στοιχείο εργασιών — μπορείτε να το βρείτε [Κατάστημα Komi](https://github.com/komi-store/komi-store) πολύ.

</div>

> [!NOTE]
> Η διεπαφή της εφαρμογής είναι διαθέσιμη στα ρωσικά και τα αγγλικά.

Το Android APK ανοίγει το πρόγραμμα σχεδιασμού εκτός σύνδεσης, συμπεριλαμβανομένης της πρώτης κυκλοφορίας. Συνδεθείτε με τον ίδιο λογαριασμό Google για να επαναφέρετε συγχρονισμένα δεδομένα και ρυθμίσεις εμφάνισης. Τα δεδομένα και τα συνημμένα που είναι αποθηκευμένα μόνο στην παλιά εφαρμογή προγράμματος περιήγησης παραμένουν διαθέσιμα εκεί.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Ενότητες Okto: Αρχική σελίδα, Εργασίες, Ημερολόγιο, Εστίαση">

<br>

<picture><source srcset="assets/readme/sections-en.svg"><img src="assets/readme/png/sections-en.png" width="100%" alt="Ενότητες Okto: Αρχική σελίδα, Εργασίες, Ημερολόγιο, Εστίαση"></picture>

<br>

<details>
<summary>Πώς να ενεργοποιήσετε το συγχρονισμό</summary>

Εκτός συσκευασίας Το Okto διατηρεί τα πάντα στο πρόγραμμα περιήγησης στη συσκευή σας. Για να έχετε τα ίδια δεδομένα σε τηλέφωνο και υπολογιστή, συνδέστε ένα δωρεάν έργο Firebase (σχέδιο Spark, δεν χρειάζεται κάρτα):

1. Δημιουργία έργου στο [console.firebase.google.com](https://console.firebase.google.com/).
2. **Έλεγχος ταυτότητας → Μέθοδος σύνδεσης** — καθιστώ ικανό **Google**. Σε **Ρυθμίσεις → Εξουσιοδοτημένοι τομείς** προσθέτω `sailxx-apps.github.io`.
3. **Βάση δεδομένων Firestore** — δημιουργήστε μια βάση δεδομένων και επικολλήστε [`firestore.rules`](firestore.rules) στο **Κανόνες** αυτί.
4. **Ρυθμίσεις έργου → Οι εφαρμογές σας → Ιστός** — εγγράψτε την εφαρμογή και αντιγράψτε `apiKey`, `authDomain`, `projectId`, `appId`.
5. Στο αποθετήριο GitHub: **Ρυθμίσεις → Μυστικά και μεταβλητές → Ενέργειες** — προσθέστε τα μυστικά `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Εκτελέστε την ανάπτυξη. Η "Σύνδεση με Google" εμφανίζεται στις ρυθμίσεις του Okto.

Αυτά τα κλειδιά δεν είναι μυστικά — η πρόσβαση προστατεύεται από κανόνες Firestore, έτσι ώστε ο καθένας να βλέπει μόνο τα δικά του δεδομένα. Οι υπενθυμίσεις στον ιστότοπο ενεργοποιούνται ενώ η καρτέλα είναι ανοιχτή. Στην εφαρμογή Android, οι υπενθυμίσεις φτάνουν ακόμη και όταν το Okto είναι κλειστό.

</details>

<br>

<picture><source srcset="assets/readme/safe-en.svg"><img src="assets/readme/png/safe-en.png" width="100%" alt="Ασφάλεια: υπογραφή, δεδομένα, δικαιώματα"></picture>

<br>

## Σχετικά με το Okto

<picture><source srcset="assets/readme/about-en.svg"><img src="assets/readme/png/about-en.png" width="100%" alt="Σχετικά με το Okto"></picture>

Το Okto ξεκίνησε στις 2 Οκτωβρίου 2026 ως ένας απλός μετρητής ιστού. Μεγάλωσε σε ένα δωρεάν πρόγραμμα σχεδιασμού για εργασίες, ημερολόγια και εστίαση. Δεν υπάρχουν διαφημίσεις, αναλυτικά στοιχεία ή ιχνηλάτες. Οι καταχωρίσεις σας παραμένουν στη συσκευή σας και μπορείτε να επιλέξετε να συγχρονίσετε μέσω του Google Firebase. [Ασφάλεια: υπογραφή, δεδομένα, δικαιώματα](PRIVACY.md)

## Οδικός Χάρτης

<picture><source srcset="assets/readme/roadmap-en.svg"><img src="assets/readme/png/roadmap-en.png" width="100%" alt="Οδικός Χάρτης"></picture>

**2026-10-02** — Το πρώτο Okto ήταν ένας μετρητής με ένα πάτημα με στόχο και χρονόμετρο.

**1.0** — Pomodoro με τέσσερις λειτουργίες, έγχρωμες προκαθορισμένες ετικέτες, επτά θέματα, αγγλική γλώσσα, ειδοποιήσεις προγράμματος περιήγησης.

**2.0** — εργασίες με λίστες, επαναλήψεις, δευτερεύουσες εργασίες και υπενθυμίσεις. Ημερολόγιο στυλ Apple Calendar με μεταφορά και απόθεση. μια προσαρμόσιμη αρχική οθόνη. Συγχρονισμός Firebase. εστίαση σε μια εργασία.

**2.1** — Εφαρμογή Android με γραφικό στοιχείο εργασιών στην αρχική οθόνη. απαλά φωτεινά και σκοτεινά θέματα σε στυλ Apple. Οι κλήσεις και η εστίαση μπορούν να κρυφτούν. Η γλώσσα ορίζεται στις Ρυθμίσεις. διορθώθηκε η εκκίνηση στο Android.

**2.2–2.8** — επιλέξτε το εικονίδιο της εφαρμογής. φωτογραφίες και αρχεία σε εργασίες, εκκίνηση εκτός σύνδεσης. πτυσσόμενος μήνας στο ημερολόγιο. υπενθυμίσεις εργασιών στο Android. εργασίες στο Ημερολόγιο Google. 14 νέα ανοιχτά και σκοτεινά θέματα. μέγεθος κειμένου και τρία νέα γραφικά στοιχεία. χάρτη δραστηριότητας στην αρχική οθόνη.

**3.0** — μια ενότητα Σημειώσεις με φωτογραφίες και αρχεία. ένα νέο σπίτι με απαλές χρωματιστές κάρτες και καρτέλες Σήμερα / Εβδομάδα / Σύνολα. αιωρούμενες γραμμές πλοήγησης και μια πτυσσόμενη πλαϊνή γραμμή στην επιφάνεια εργασίας. Ρυθμίσεις με πτυσσόμενα τμήματα. μια ανανεωμένη οθόνη εστίασης. Διορθώσεις γραφικών στοιχείων Android.

[**3.23.6**](https://github.com/sailxx/Okto/releases/tag/v3.23.6) — Το Okto απέκτησε μια εφαρμογή δίσκου Windows. Το πρόγραμμα σχεδιασμού Android ανοίγει εκτός σύνδεσης και το 3.23.6 βελτιώνει τα συνημμένα και την οθόνη εστίασης.

## ⚖️ Άδειες

Ο [Ενταφιάζω](https://rsms.me/inter/) Η γραμματοσειρά παρέχεται με την άδεια SIL Open Font License 1.1. Οι εικόνες README έχουν οριστεί [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
