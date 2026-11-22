package com.sailxx.okto.notify

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.sailxx.okto.R
import com.sailxx.okto.data.AppLang
import com.sailxx.okto.data.OktoTask
import com.sailxx.okto.widget.oktoIntent
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/** Android notifications for the installed planner, including alarms without a Google account. */
object PlannerNotifications {
    private const val LIVE = "planner-live"
    private const val ALERT = "focus"
    private const val TOKEN = "plannerActionToken"
    private const val ACTION = "plannerNotificationAction"
    private val clockModes = listOf("pomodoro", "timer")
    private val liveActions = setOf(
        "pomodoro:pause", "pomodoro:resume", "pomodoro:skip", "timer:pause", "timer:resume", "timer:add",
        "stopwatch:pause", "stopwatch:resume", "stopwatch:reset", "counter:plus", "counter:minus",
    )

    private fun prefs(context: Context) = context.getSharedPreferences("planner-notifications", Context.MODE_PRIVATE)
    private fun manager(context: Context) = NotificationManagerCompat.from(context)

    @SuppressLint("MissingPermission")
    fun show(context: Context, msg: JSONObject) {
        val notifications = manager(context)
        if (!notifications.areNotificationsEnabled()) return
        val tag = msg.optString("tag", "okto")
        val userContext = AppLang.wrap(context)
        channel(context, ALERT, userContext.getString(R.string.focus_channel), NotificationManager.IMPORTANCE_HIGH)
        val home = if (tag.startsWith("planner-focus-")) "#/focus" else ""
        val open = PendingIntent.getActivity(context, home.hashCode(), oktoIntent(context, home), PendingIntent.FLAG_IMMUTABLE)
        val body = msg.optString("body")
        notifications.notify(tag, 1, NotificationCompat.Builder(context, ALERT)
            .setSmallIcon(R.drawable.ic_notify)
            .setContentTitle(msg.optString("title"))
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(open)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setOnlyAlertOnce(true)
            .setAutoCancel(true)
            .build())
    }

    @SuppressLint("MissingPermission")
    fun live(context: Context, view: JSONObject?) {
        val notifications = manager(context)
        if (view == null) {
            notifications.cancel(LIVE, 1)
            prefs(context).edit().remove("dismissed").apply()
            return
        }
        if (!notifications.areNotificationsEnabled()) return
        val prefs = prefs(context)
        val sticky = view.optString("sticky")
        val dismissed = prefs.getString("dismissed", null)
        if (dismissed == sticky) return
        if (dismissed != null) prefs.edit().remove("dismissed").apply()
        channel(context, LIVE, AppLang.wrap(context).getString(R.string.focus_channel), NotificationManager.IMPORTANCE_LOW)
        val body = view.optString("body")
        val delete = PendingIntent.getBroadcast(context, 0, Intent(context, PlannerNotificationReceiver::class.java)
            .setAction("dismiss").putExtra("sticky", sticky), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val timestamp = view.optLong("timestamp")
        val builder = NotificationCompat.Builder(context, LIVE)
            .setSmallIcon(R.drawable.ic_notify)
            .setContentTitle(view.optString("title"))
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setWhen(timestamp)
            .setShowWhen(timestamp > 0)
            .setSilent(true)
            .setContentIntent(PendingIntent.getActivity(context, 0, oktoIntent(context, "#/focus"), PendingIntent.FLAG_IMMUTABLE))
            .setDeleteIntent(delete)
        val token = prefs.getString(TOKEN, null) ?: UUID.randomUUID().toString().also { prefs.edit().putString(TOKEN, it).apply() }
        val actions = view.optJSONArray("actions") ?: JSONArray()
        for (i in 0 until actions.length()) {
            val button = actions.optJSONObject(i) ?: continue
            val action = button.optString("action").takeIf { it in liveActions } ?: continue
            val intent = oktoIntent(context, "#/focus").setAction("$ACTION:$action")
                .putExtra(ACTION, action).putExtra(TOKEN, token)
            val pending = PendingIntent.getActivity(context, action.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE)
            builder.addAction(0, button.optString("title"), pending)
        }
        notifications.notify(LIVE, 1, builder.build())
    }

    fun takeAction(context: Context, intent: Intent): String? {
        val action = intent.getStringExtra(ACTION)?.takeIf { it in liveActions } ?: return null
        val token = intent.getStringExtra(TOKEN) ?: return null
        if (prefs(context).getString(TOKEN, null) != token) return null
        intent.removeExtra(ACTION)
        intent.removeExtra(TOKEN)
        return action
    }

    fun updateSchedule(context: Context, msg: JSONObject) {
        val state = JSONObject().put("enabled", msg.optBoolean("enabled"))
            .put("tasks", msg.optJSONArray("tasks") ?: JSONArray())
            .put("clock", msg.optJSONObject("clock") ?: JSONObject())
        val value = state.toString()
        val prefs = prefs(context)
        if (prefs.getString("schedule", null) == value) return
        prefs.edit().putString("schedule", value).apply()
        Reminders.schedule(AppLang.wrap(context), if (state.optBoolean("enabled")) localTasks(state) else emptyList())
        scheduleClock(context, state.optJSONObject("clock"))
    }

    fun scheduleTasks(context: Context, cloud: Collection<OktoTask>) {
        val state = storedSchedule(context)
        val tasks = when {
            state == null -> cloud
            !state.optBoolean("enabled") -> emptyList()
            Firebase.auth.currentUser != null -> cloud.filter { it.kind != "habit" }
            else -> localTasks(state)
        }
        Reminders.schedule(AppLang.wrap(context), tasks)
    }

    private fun storedSchedule(context: Context): JSONObject? =
        prefs(context).getString("schedule", null)?.let { runCatching { JSONObject(it) }.getOrNull() }

    fun clockNotificationsEnabled(context: Context) = storedSchedule(context)?.optBoolean("enabled") ?: true

    private fun localTasks(state: JSONObject): List<OktoTask> {
        val local = state.optJSONArray("tasks") ?: return emptyList()
        return (0 until local.length()).mapNotNull { i ->
            val item = local.optJSONObject(i) ?: return@mapNotNull null
            OktoTask.fromMap(item.getString("id"), item.asMap())
        }
    }

    fun rescheduleClock(context: Context) = scheduleClock(context, storedSchedule(context)?.optJSONObject("clock"))

    private fun scheduleClock(context: Context, clock: JSONObject?) {
        val alarms = context.getSystemService(AlarmManager::class.java)
        for (mode in clockModes) {
            val intent = Intent(context, PlannerNotificationReceiver::class.java).setAction(mode)
            val pending = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
            val time = clock?.optJSONObject(mode)?.optLong("time") ?: 0
            if (time <= System.currentTimeMillis()) {
                alarms.cancel(pending)
            } else if (Build.VERSION.SDK_INT < 31 || alarms.canScheduleExactAlarms()) {
                alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pending)
            } else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pending)
        }
    }

    internal fun receive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == "dismiss") {
            prefs(context).edit().putString("dismissed", intent.getStringExtra("sticky")).apply()
        } else if (action in clockModes) {
            val data = storedSchedule(context)?.optJSONObject("clock")?.optJSONObject(action) ?: return
            if (data.optLong("time") <= System.currentTimeMillis()) {
                manager(context).cancel(LIVE, 1)
                show(context, data)
            }
        }
    }

    private fun channel(context: Context, id: String, title: String, importance: Int) {
        if (Build.VERSION.SDK_INT >= 26) {
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel(id, title, importance))
        }
    }

    private fun JSONObject.asMap(): Map<String, Any?> = keys().asSequence().associateWith { key ->
        when (val value = get(key)) {
            JSONObject.NULL -> null
            is JSONObject -> value.asMap()
            is JSONArray -> (0 until value.length()).map(value::get)
            else -> value
        }
    }
}

class PlannerNotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) = PlannerNotifications.receive(context, intent)
}
