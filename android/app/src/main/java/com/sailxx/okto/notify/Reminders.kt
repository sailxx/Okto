package com.sailxx.okto.notify

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.sailxx.okto.R
import com.sailxx.okto.data.OktoTask
import com.sailxx.okto.widget.SyncWorker
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Напоминания о задачах, как в веб-Okto (поле reminder — минуты до начала), но без открытого Okto:
 * каждое обновление задач из Firestore перепланирует будильники AlarmManager, а ReminderReceiver
 * показывает уведомление. Внутри приложения веб-версия свои системные напоминания не шлёт.
 */
object Reminders {
    private const val CHANNEL = "reminders"
    private const val PREFS = "okto-reminders"
    private const val MAX_ALARMS = 64
    private const val EXTRA_KEY = "key"
    private const val EXTRA_TITLE = "title"
    private const val EXTRA_TEXT = "text"
    private const val EXTRA_WHEN = "when"

    private data class Due(val key: String, val at: Long, val startMs: Long, val title: String, val text: String)

    /** Перепланировать всё по актуальному списку задач (пустой — снять все напоминания). */
    fun schedule(context: Context, tasks: Collection<OktoTask>, untitled: String = context.getString(R.string.untitled)) {
        val app = context.applicationContext
        val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val fired = prefs.getStringSet("fired", emptySet())!!
        val now = System.currentTimeMillis()
        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)

        val due = mutableListOf<Due>()
        for (task in tasks) {
            val reminder = task.reminder ?: continue
            val start = task.start?.let { runCatching { LocalTime.parse(it) }.getOrNull() } ?: continue
            // Напоминание бывает до недели заранее: смотрим вхождения на 8 дней вперёд.
            for (offset in 0L..8L) {
                val day = today.plusDays(offset)
                val d = day.toString()
                if (!task.occursOn(d) || task.isDoneOn(d)) continue
                val startMs = day.atTime(start).atZone(zone).toInstant().toEpochMilli()
                val key = "${task.id}@$d@$reminder"
                if (key in fired || now >= startMs + task.duration * 60_000L) continue
                due += Due(
                    key = key,
                    at = maxOf(now, startMs - reminder * 60_000L),
                    startMs = startMs,
                    title = task.title.ifBlank { untitled },
                    text = label(app, task, day, today),
                )
            }
        }
        val next = due.sortedBy { it.at }.take(MAX_ALARMS)

        val alarms = app.getSystemService(AlarmManager::class.java)
        val keys = next.map { it.key }.toSet()
        for (old in prefs.getStringSet("scheduled", emptySet())!! - keys) {
            alarms.cancel(pending(app, Intent(app, ReminderReceiver::class.java).putExtra(EXTRA_KEY, old), old))
        }
        val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
        for (r in next) {
            val intent = Intent(app, ReminderReceiver::class.java)
                .putExtra(EXTRA_KEY, r.key)
                .putExtra(EXTRA_TITLE, r.title)
                .putExtra(EXTRA_TEXT, r.text)
                .putExtra(EXTRA_WHEN, r.startMs)
            val pi = pending(app, intent, r.key)
            if (exact) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, r.at, pi)
            else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, r.at, pi)
        }
        // Сработавшие держим, пока их задача не закончилась, — иначе при следующей синхронизации повторятся.
        val keepFired = fired.filter { k -> k.split('@').getOrNull(1)?.let { it >= today.minusDays(1).toString() } == true }
        prefs.edit().putStringSet("scheduled", keys).putStringSet("fired", keepFired.toSet()).apply()
    }

    /** «Сегодня · 12:00», «Завтра · Звонок 14:00–14:30», «3 окт. · 9:00». */
    private fun label(context: Context, task: OktoTask, day: LocalDate, today: LocalDate): String {
        val start = task.start ?: ""
        val time = if (task.kind == "call") {
            val end = runCatching {
                LocalTime.parse(start).plusMinutes(task.duration.toLong()).format(DateTimeFormatter.ofPattern("HH:mm"))
            }.getOrDefault("")
            "${context.getString(R.string.call)} $start–$end"
        } else start
        val date = when (day) {
            today -> context.getString(R.string.today)
            today.plusDays(1) -> context.getString(R.string.tomorrow_chip)
            else -> day.format(DateTimeFormatter.ofPattern("d MMM"))
        }
        return "$date · $time"
    }

    private fun pending(context: Context, intent: Intent, key: String): PendingIntent =
        PendingIntent.getBroadcast(
            context, key.hashCode(), intent.setAction("com.sailxx.okto.REMINDER:$key"),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    internal fun show(context: Context, intent: Intent) {
        val key = intent.getStringExtra(EXTRA_KEY) ?: return
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val fired = prefs.getStringSet("fired", emptySet())!!
        if (key in fired) return
        prefs.edit().putStringSet("fired", fired + key).apply()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        ensureChannel(context)
        val open = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?.let { PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_IMMUTABLE) }
        val notification = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_notify)
            .setContentTitle(intent.getStringExtra(EXTRA_TITLE))
            .setContentText(intent.getStringExtra(EXTRA_TEXT))
            .setWhen(intent.getLongExtra(EXTRA_WHEN, System.currentTimeMillis()))
            .setShowWhen(true)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(key, 0, notification)
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(CHANNEL, context.getString(R.string.reminders_channel), NotificationManager.IMPORTANCE_HIGH)
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) = Reminders.show(context, intent)
}

/** После перезагрузки, смены времени или обновления приложения будильники пропадают — синхронизируемся и ставим заново. */
class RescheduleReceiver : BroadcastReceiver() {
    private val actions = setOf(
        Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED, Intent.ACTION_TIME_CHANGED,
        Intent.ACTION_TIMEZONE_CHANGED, AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED,
    )

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action !in actions) return
        SyncWorker.schedule(context)
        WorkManager.getInstance(context).enqueue(OneTimeWorkRequestBuilder<SyncWorker>().build())
    }
}
