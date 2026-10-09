package com.sailxx.okto.widget

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.sailxx.okto.data.OktoRepository
import java.util.concurrent.TimeUnit

/** Любой виджет Okto на экране включает фоновую синхронизацию. */
abstract class OktoReceiver : GlanceAppWidgetReceiver() {
    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        SyncWorker.schedule(context)
    }
}

class OktoWidgetReceiver : OktoReceiver() {
    override val glanceAppWidget: GlanceAppWidget = OktoTasksWidget()
}

class NextTaskWidgetReceiver : OktoReceiver() {
    override val glanceAppWidget: GlanceAppWidget = NextTaskWidget()
}

class QuickAddWidgetReceiver : OktoReceiver() {
    override val glanceAppWidget: GlanceAppWidget = QuickAddWidget()
}

class StreakWidgetReceiver : OktoReceiver() {
    override val glanceAppWidget: GlanceAppWidget = StreakWidget()
}

/**
 * Фоновая синхронизация: подтягивает изменения из веб-Okto, переключает «сегодня» после полуночи
 * и перепланирует напоминания — поэтому работает и без виджета на экране.
 */
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        OktoRepository.refresh(applicationContext)
        updateOktoWidgets(applicationContext)
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
