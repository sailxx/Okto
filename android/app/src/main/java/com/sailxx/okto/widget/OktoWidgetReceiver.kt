package com.sailxx.okto.widget

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.sailxx.okto.data.OktoRepository
import java.util.concurrent.TimeUnit

class OktoWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = OktoTasksWidget()

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        SyncWorker.schedule(context)
    }
}

/**
 * Фоновая синхронизация: подтягивает изменения из веб-Okto, переключает «сегодня» после полуночи
 * и перепланирует напоминания — поэтому работает и без виджета на экране.
 */
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        OktoRepository.refresh(applicationContext)
        OktoTasksWidget().updateAll(applicationContext)
        return Result.success()
    }

    companion object {
        private const val NAME = "okto-widget-sync"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<SyncWorker>(30, TimeUnit.MINUTES).build()
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(NAME, ExistingPeriodicWorkPolicy.UPDATE, request)
        }
    }
}
