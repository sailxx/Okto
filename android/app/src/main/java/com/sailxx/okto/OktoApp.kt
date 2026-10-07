package com.sailxx.okto

import android.app.Activity
import android.app.Application
import android.os.Bundle
import androidx.glance.appwidget.updateAll
import com.google.androidbrowserhelper.trusted.LauncherActivity
import com.google.firebase.firestore.ListenerRegistration
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.widget.OktoTasksWidget
import com.sailxx.okto.widget.SyncWorker

/**
 * Пока открыт Okto (LauncherActivity живёт под окном Chrome), держим подписку на Firestore,
 * чтобы правки на сайте сразу попадали в виджет. В фоне виджет обновляет SyncWorker.
 */
class OktoApp : Application() {
    private var live: List<ListenerRegistration> = emptyList()

    override fun onCreate() {
        super.onCreate()
        registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, state: Bundle?) {
                if (activity !is LauncherActivity) return
                SyncWorker.schedule(this@OktoApp)
                if (live.isEmpty()) live = OktoRepository.listen(this@OktoApp) { OktoTasksWidget().updateAll(this@OktoApp) }
            }

            override fun onActivityDestroyed(activity: Activity) {
                if (activity !is LauncherActivity || activity.isChangingConfigurations) return
                live.forEach { it.remove() }
                live = emptyList()
            }

            override fun onActivityStarted(activity: Activity) = Unit
            override fun onActivityResumed(activity: Activity) = Unit
            override fun onActivityPaused(activity: Activity) = Unit
            override fun onActivityStopped(activity: Activity) = Unit
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
        })
    }
}
