package com.sailxx.okto.data

import android.app.Activity
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.Firebase
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.auth
import com.sailxx.okto.R
import kotlinx.coroutines.tasks.await

/**
 * Вход тем же Google-аккаунтом, что и в веб-Okto: Firebase выдаст тот же uid,
 * поэтому виджет увидит те же задачи (users/{uid}/tasks).
 */
suspend fun signInWithGoogle(activity: Activity) {
    // default_web_client_id генерирует плагин google-services из google-services.json
    val option = GetSignInWithGoogleOption.Builder(activity.getString(R.string.default_web_client_id)).build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
    val credential = CredentialManager.create(activity).getCredential(activity, request).credential

    require(credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
        "Unexpected credential type"
    }
    val idToken = GoogleIdTokenCredential.createFrom(credential.data).idToken
    Firebase.auth.signInWithCredential(GoogleAuthProvider.getCredential(idToken, null)).await()
}

fun signOut() = Firebase.auth.signOut()
