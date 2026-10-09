import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    // Читает google-services.json: Firebase-проект okto-2102026, тот же, что у сайта
    id("com.google.gms.google-services")
}

android {
    namespace = "com.sailxx.okto"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.sailxx.okto"
        minSdk = 24
        targetSdk = 36
        versionCode = 13
        versionName = "2.7.1"
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
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = releaseSigning
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        // Виджет считает даты через java.time — на Android 7 (API 24–25) его даёт desugaring
        isCoreLibraryDesugaringEnabled = true
    }

    buildFeatures {
        compose = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    // Trusted Web Activity: открывает PWA через движок Chrome на весь экран
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")

    // Виджет задач на рабочем столе
    implementation("androidx.glance:glance-appwidget:1.1.1")
    implementation("androidx.work:work-runtime-ktx:2.10.0")

    // Экраны «Настройки виджета» и «Новая задача»
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.activity:activity-compose:1.9.3")

    // Задачи из того же Firestore, что и у сайта (users/{uid}/tasks)
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.9.0")

    // Вход через Google
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // Доступ к Google Календарю (AuthorizationClient): задачи в календаре «Okto»
    implementation("com.google.android.gms:play-services-auth:21.3.0")

    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
}
