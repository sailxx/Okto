import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    // Ð§Ð¸Ñ‚Ð°ÐµÑ‚ google-services.json: Firebase-Ð¿Ñ€Ð¾ÐµÐºÑ‚ okto-2102026, Ñ‚Ð¾Ñ‚ Ð¶Ðµ, Ñ‡Ñ‚Ð¾ Ñƒ ÑÐ°Ð¹Ñ‚Ð°
    id("com.google.gms.google-services")
}

android {
    namespace = "com.sailxx.okto"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.sailxx.okto"
        minSdk = 24
        targetSdk = 36
        versionCode = 30
        versionName = "3.7.1"
    }

    // ÐšÐ»ÑŽÑ‡ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ¸ Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑÑ Ð²Ð½Ðµ Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ð¸Ñ; Ð¿ÑƒÑ‚ÑŒ Ð¸ Ð¿Ð°Ñ€Ð¾Ð»Ð¸ â€” Ð² keystore.properties (Ð² .gitignore)
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
        // Ð’Ð¸Ð´Ð¶ÐµÑ‚ ÑÑ‡Ð¸Ñ‚Ð°ÐµÑ‚ Ð´Ð°Ñ‚Ñ‹ Ñ‡ÐµÑ€ÐµÐ· java.time â€” Ð½Ð° Android 7 (API 24â€“25) ÐµÐ³Ð¾ Ð´Ð°Ñ‘Ñ‚ desugaring
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
    // Trusted Web Activity: Ð¾Ñ‚ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ PWA Ñ‡ÐµÑ€ÐµÐ· Ð´Ð²Ð¸Ð¶Ð¾Ðº Chrome Ð½Ð° Ð²ÐµÑÑŒ ÑÐºÑ€Ð°Ð½
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")

    // Ð’Ð¸Ð´Ð¶ÐµÑ‚ Ð·Ð°Ð´Ð°Ñ‡ Ð½Ð° Ñ€Ð°Ð±Ð¾Ñ‡ÐµÐ¼ ÑÑ‚Ð¾Ð»Ðµ
    implementation("androidx.glance:glance-appwidget:1.1.1")
    implementation("androidx.work:work-runtime-ktx:2.10.0")
    testImplementation("junit:junit:4.13.2")

    // Ð­ÐºÑ€Ð°Ð½Ñ‹ Â«ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ Ð²Ð¸Ð´Ð¶ÐµÑ‚Ð°Â» Ð¸ Â«ÐÐ¾Ð²Ð°Ñ Ð·Ð°Ð´Ð°Ñ‡Ð°Â»
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.activity:activity-compose:1.9.3")

    // Ð—Ð°Ð´Ð°Ñ‡Ð¸ Ð¸Ð· Ñ‚Ð¾Ð³Ð¾ Ð¶Ðµ Firestore, Ñ‡Ñ‚Ð¾ Ð¸ Ñƒ ÑÐ°Ð¹Ñ‚Ð° (users/{uid}/tasks)
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.9.0")

    // Ð’Ñ…Ð¾Ð´ Ñ‡ÐµÑ€ÐµÐ· Google
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // Ð”Ð¾ÑÑ‚ÑƒÐ¿ Ðº Google ÐšÐ°Ð»ÐµÐ½Ð´Ð°Ñ€ÑŽ (AuthorizationClient): Ð·Ð°Ð´Ð°Ñ‡Ð¸ Ð² ÐºÐ°Ð»ÐµÐ½Ð´Ð°Ñ€Ðµ Â«OktoÂ»
    implementation("com.google.android.gms:play-services-auth:21.3.0")

    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
}
