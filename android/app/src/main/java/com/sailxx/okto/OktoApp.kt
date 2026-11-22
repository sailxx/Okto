package com.sailxx.okto

import android.app.Activity
import android.app.Application
import android.os.Bundle
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.ListenerRegistration
import com.sailxx.okto.data.FocusRepository
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.widget.updateFocusWidgets
import com.sailxx.okto.widget.updateOktoWidgets
import com.sailxx.okto.widget.SyncWorker

/**
 * Пока открыт планер, подписки Firestore обновляют виджеты. В фоне работает SyncWorker.
 */
class OktoApp : Application() {
    private var live: List<ListenerRegistration> = emptyList()

    override fun onCreate() {
        super.onCreate()
        registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, state: Bundle?) {
                if (activity !is PlannerActivity) return
                SyncWorker.schedule(this@OktoApp)
                Firebase.auth.addAuthStateListener(authListener)
            }

            override fun onActivityDestroyed(activity: Activity) {
                if (activity !is PlannerActivity) return
                Firebase.auth.removeAuthStateListener(authListener)
                stopListening()
            }

            override fun onActivityStarted(activity: Activity) = Unit
            override fun onActivityResumed(activity: Activity) = Unit
            override fun onActivityPaused(activity: Activity) = Unit
            override fun onActivityStopped(activity: Activity) = Unit
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
        })
    }

    private val authListener = FirebaseAuth.AuthStateListener { auth ->
        stopListening()
        if (auth.currentUser != null) {
            live = OktoRepository.listen(this) { updateOktoWidgets(this) } +
                listOfNotNull(FocusRepository.listen(this) { updateFocusWidgets(this) })
        }
    }

    private fun stopListening() {
        live.forEach { it.remove() }
        live = emptyList()
    }
}
