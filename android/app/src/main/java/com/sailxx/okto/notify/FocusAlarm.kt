package com.sailxx.okto.notify

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.sailxx.okto.R
import com.sailxx.okto.data.AppLang
import com.sailxx.okto.data.FocusLive
import com.sailxx.okto.data.FocusMode
import com.sailxx.okto.data.FocusRepository
import com.sailxx.okto.widget.updateFocusWidgets
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Будильник на конец фазы помодоро и таймера: виджет перестаёт показывать минус,
 * фаза закрывается (с сессией фокуса), приходит уведомление — даже если Okto закрыт.
 */
object FocusAlarm {
    private const val ACTION = "com.sailxx.okto.FOCUS_END"
    private const val EXTRA_MODE = "mode"

    private fun pending(context: Context, mode: FocusMode): PendingIntent =
        PendingIntent.getBroadcast(
            context, 7100 + mode.ordinal,
            Intent(context, FocusAlarmReceiver::class.java).setAction("$ACTION:${mode.name}").putExtra(EXTRA_MODE, mode.name),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    fun schedule(context: Context, live: FocusLive) {
        val app = context.applicationContext
        val alarms = app.getSystemService(AlarmManager::class.java)
        val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
        for ((mode, at) in listOf(FocusMode.POMO to live.pomo.endsAt, FocusMode.TIMER to live.timer.endsAt)) {
            val pi = pending(app, mode)
            alarms.cancel(pi)
            if (at == null) continue
            val time = maxOf(at, System.currentTimeMillis() + 500)
            if (exact) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pi)
            else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pi)
        }
    }

    internal suspend fun fire(context: Context, mode: FocusMode) {
        val app = context.applicationContext
        // Состояние могли поменять на сайте: сверяемся с документом, а не с тем, что было при постановке будильника.
        val live = FocusRepository.refresh(app) ?: return
        val now = System.currentTimeMillis()
        if (!live.ended(mode, now)) return
        val ctx = AppLang.wrap(app)
        if (mode == FocusMode.TIMER) {
            FocusRepository.update(app) { l, t -> l.reset(FocusMode.TIMER, t) to null }
            notify(app, "timer", live.timer.endsAt, ctx.getString(R.string.timer_done_title), ctx.getString(R.string.timer_done_body))
        } else {
            val work = live.pomo.phase == "work"
            FocusRepository.update(app) { l, t -> if (l.ended(FocusMode.POMO, t)) l.advance(t, natural = true) else l to null }
            val next = FocusRepository.state.value ?: live
            if (work) notify(app, "pomodoro", live.pomo.endsAt, ctx.getString(R.string.work_done_title), ctx.getString(R.string.work_done_body, next.cfg.minutes(next.pomo.phase)))
            else notify(app, "pomodoro", live.pomo.endsAt, ctx.getString(R.string.break_done_title), ctx.getString(R.string.break_done_body))
        }
        updateFocusWidgets(app)
    }

    private fun notify(context: Context, mode: String, time: Long?, title: String, text: String) {
        if (!PlannerNotifications.clockNotificationsEnabled(context)) return
        PlannerNotifications.show(context, JSONObject()
            .put("tag", "planner-focus-$mode-$time")
            .put("title", title)
            .put("body", text))
    }
}

class FocusAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val mode = intent.getStringExtra("mode")?.let { runCatching { FocusMode.valueOf(it) }.getOrNull() } ?: return
        val done = goAsync()
        CoroutineScope(Dispatchers.Default).launch {
            try { FocusAlarm.fire(context, mode) } finally { done.finish() }
        }
    }
}
