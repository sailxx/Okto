import java.util.Properties

plugins {
    id("com.android.application")
}

android {
    namespace = "com.sailxx.okto"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.sailxx.okto"
        minSdk = 24
        targetSdk = 36
        versionCode = 5
        versionName = "2.0.4"
    }

    // Ключ подписи хранится вне репозитория; путь и пароли — в keystore.properties (в .gitignore)
    val keystoreFile = rootProject.file("keystore.properties")
    val releaseSigning = if (keystoreFile.exists()) {
        val props = Properties().apply { keystoreFile.inputStream().use { load(it) } }
        signingConfigs.create("release") {
            storeFile = file(props.getProperty("storeFile"))
            storePassword = props.getProperty("storePassword")
            keyAlias = props.getProperty("keyAlias")
            keyPassword = props.getProperty("keyPassword")
        }
    } else {
        null
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
            signingConfig = releaseSigning
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // Trusted Web Activity: открывает PWA через движок Chrome на весь экран
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")
}
