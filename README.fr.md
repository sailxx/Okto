<div align="center">

[Русский](README.ru.md) · [English](README.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Français** · [Italiano](README.it.md) · [Türkçe](README.tr.md) · [Українська](README.uk.md) · [Polski](README.pl.md)

<br>

<picture><source srcset="assets/readme/hero-fr.svg"><img src="assets/readme/png/hero-fr.png" width="100%" alt="Okto — planifie ta journée, concentre-toi sur l’essentiel"></picture>

<a href="https://sailxx.github.io/Okto/"><img src="assets/readme/btn-web-fr.svg" height="52" alt="Ouvrir la version web"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-fr.svg" height="52" alt="Télécharger pour Android"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/tag/tray-v1.5"><img src="assets/readme/btn-windows-fr.svg" height="52" alt="Télécharger pour Windows"></a>

**Okto fonctionne sur tous les appareils** : iPhone et Android, tablettes, Windows, macOS et Linux. Un navigateur suffit, et Okto s'installe comme une app sur le téléphone ou l'ordinateur. Sur Android, il existe aussi une app avec widget de tâches, disponible aussi dans [Komi Store](https://github.com/komi-store/komi-store).

</div>

> [!NOTE]
> L’interface de l’app est disponible en russe et en anglais.

<br>

<img src="assets/readme/screens-en.webp" width="100%" alt="Sections d’Okto : Accueil, Tâches, Calendrier, Concentration">

<br>

<picture><source srcset="assets/readme/sections-fr.svg"><img src="assets/readme/png/sections-fr.png" width="100%" alt="Sections d’Okto : Accueil, Tâches, Calendrier, Concentration"></picture>

<br>

<details>
<summary>Activer la synchronisation</summary>

Par défaut, Okto garde tout dans le navigateur de l’appareil. Pour avoir les mêmes données sur téléphone et ordinateur, connecte un projet Firebase gratuit (offre Spark, sans carte) :

1. Crée un projet sur [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication → Sign-in method** — active **Google**. Dans **Settings → Authorized domains**, ajoute `sailxx.github.io`.
3. **Firestore Database** — crée la base et colle [`firestore.rules`](firestore.rules) dans l’onglet **Rules**.
4. **Project settings → Your apps → Web** — enregistre l’app et copie `apiKey`, `authDomain`, `projectId`, `appId`.
5. Dans le dépôt GitHub : **Settings → Secrets and variables → Actions** — ajoute les secrets `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Lance le déploiement. « Se connecter avec Google » apparaît dans les réglages d’Okto.

Ces clés ne sont pas secrètes : l’accès est protégé par les règles Firestore, chacun ne voit que ses données. Sur le site, les rappels fonctionnent tant que l’onglet est ouvert. Dans l’app Android, les rappels arrivent même quand Okto est fermé.

</details>

<br>

<picture><source srcset="assets/readme/safe-fr.svg"><img src="assets/readme/png/safe-fr.png" width="100%" alt="Sécurité : signature, données, autorisations"></picture>

<br>

## 🗂 Historique des versions

**3.0** — section Notes avec photos et fichiers ; nouvel Accueil avec cartes douces et colorées et onglets Aujourd’hui / Semaine / Totaux ; barres de navigation flottantes et barre latérale repliable sur ordinateur ; réglages à sections repliables ; Focus remanié ; correctifs des widgets Android.

**2.2–2.8** — icône au choix ; photos et fichiers dans les tâches, lancement hors ligne ; mois repliable dans le calendrier ; rappels de tâches sur Android ; tâches dans Google Agenda ; 14 nouveaux thèmes clairs et sombres ; taille du texte et trois nouveaux widgets ; carte d'activité sur l'accueil.

**2.1** — app Android avec widget de tâches sur l'écran d'accueil ; thèmes clair et sombre doux style Apple ; Appels et Focus masquables ; langue dans les Réglages ; lancement corrigé sur Android.

**2.0** — tâches avec listes, répétitions, sous-tâches et rappels ; calendrier façon Apple Calendrier avec glisser-déposer ; accueil personnalisable ; synchronisation Firebase ; focus sur une tâche.

**1.0** — Pomodoro à quatre modes, tags prédéfinis en couleur, sept thèmes, anglais, notifications du navigateur.

## ⚖️ Licences

La police [Inter](https://rsms.me/inter/) est sous licence SIL Open Font License 1.1. Les images du README utilisent [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1) + [Golos Text](https://github.com/googlefonts/golos-text) (OFL 1.1).
