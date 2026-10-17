package com.sailxx.okto.widget

import android.content.Context
import android.os.SystemClock
import android.util.TypedValue
import android.widget.RemoteViews
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.action.ActionParameters
import androidx.glance.action.actionParametersOf
import androidx.glance.action.clickable
import androidx.glance.appwidget.AndroidRemoteViews
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.sailxx.okto.R
import com.sailxx.okto.data.AppLang
import com.sailxx.okto.data.FocusLive
import com.sailxx.okto.data.FocusMode
import com.sailxx.okto.data.FocusRepository
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.WidgetState

/** Какой режим показывает виджет. Пока не выбран — тот, что идёт, иначе помодоро. */
object FocusWidgetMode {
    private const val PREFS = "focus_widget"

    fun get(context: Context, live: FocusLive?): FocusMode =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("mode", null)
            ?.let { runCatching { FocusMode.valueOf(it) }.getOrNull() }
            ?: FocusMode.entries.firstOrNull { live?.running(it) == true }
            ?: FocusMode.POMO

    fun set(context: Context, mode: FocusMode) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("mode", mode.name).apply()
}

/** «Фокус»: помодоро, таймер и секундомер — общие с сайтом, часы тикают сами (Chronometer). */
class FocusWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        OktoRepository.refreshIfStale(context)
        FocusRepository.refresh(context)
        provideContent {
            val state by OktoRepository.state.collectAsState()
            val live by FocusRepository.state.collectAsState()
            Frame(state, padding = 12) { Focus(state, live ?: FocusLive.DEFAULT) }
        }
    }
}

@Composable
private fun Focus(s: WidgetState, live: FocusLive) {
    val p = s.palette
    val app = LocalContext.current
    val ctx = AppLang.wrap(app)
    val mode = FocusWidgetMode.get(app, live)
    val now = System.currentTimeMillis()
    val running = live.running(mode)
    val ended = live.ended(mode, now)
    val big = LocalSize.current.height >= 150.dp

    Column(GlanceModifier.fillMaxSize()) {
        Row(GlanceModifier.fillMaxWidth().padding(horizontal = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Tab(ctx.getString(R.string.focus_tab_pomo), FocusMode.POMO, mode, p)
            Tab(ctx.getString(R.string.focus_tab_timer), FocusMode.TIMER, mode, p)
            Tab(ctx.getString(R.string.focus_tab_sw), FocusMode.STOPWATCH, mode, p)
        }
        Column(
            GlanceModifier.fillMaxWidth().defaultWeight().padding(horizontal = 4.dp)
                .clickable(actionStartActivity(oktoIntent(ctx, "#/focus"))),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val (ms, down) = when (mode) {
                FocusMode.POMO -> live.pomoLeft(now) to true
                FocusMode.TIMER -> live.timerLeft(now) to true
                FocusMode.STOPWATCH -> live.swAt(now) to false
            }
            AndroidRemoteViews(
                chrono(app, if (ended) 0 else ms, down, running && !ended, if (ended) p.red else p.ink, if (big) 52f else 40f),
                GlanceModifier.fillMaxWidth(),
            )
            Text(
                caption(ctx, live, mode, running, ended),
                maxLines = 1,
                style = TextStyle(color = cp(if (ended) p.red else p.muted), fontSize = 12.sp),
            )
        }
        Row(GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconKey(R.drawable.ic_focus_reset, ctx.getString(R.string.focus_reset), FocusOp.RESET, mode, p, enabled = live.started(mode) && !ended)
            Spacer(GlanceModifier.width(8.dp))
            val label = when {
                ended && mode == FocusMode.POMO -> ctx.getString(R.string.focus_next)
                ended -> ctx.getString(R.string.focus_again)
                running -> ctx.getString(R.string.focus_pause)
                else -> ctx.getString(R.string.focus_start)
            }
            val icon = if (running && !ended) R.drawable.ic_focus_pause else R.drawable.ic_focus_play
            Box(
                GlanceModifier.defaultWeight().height(44.dp).background(p.accent).cornerRadius(12.dp)
                    .clickable(actionRunCallback<FocusAction>(params(if (ended) FocusOp.FINISH else FocusOp.TOGGLE, mode))),
                contentAlignment = Alignment.Center,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(ImageProvider(icon), null, GlanceModifier.size(18.dp), colorFilter = ColorFilter.tint(cp(p.onAccent)))
                    Spacer(GlanceModifier.width(6.dp))
                    Text(label, maxLines = 1, style = TextStyle(color = cp(p.onAccent), fontSize = 14.sp, fontWeight = FontWeight.Medium))
                }
            }
            when (mode) {
                FocusMode.POMO -> {
                    Spacer(GlanceModifier.width(8.dp))
                    IconKey(R.drawable.ic_focus_skip, ctx.getString(R.string.focus_skip), FocusOp.SKIP, mode, p, enabled = !ended)
                }
                FocusMode.TIMER -> {
                    Spacer(GlanceModifier.width(8.dp))
                    TextKey(ctx.getString(R.string.focus_add_min), FocusOp.ADD_MINUTE, mode, p, enabled = !ended)
                }
                FocusMode.STOPWATCH -> Unit
            }
        }
    }
}

private fun caption(ctx: Context, live: FocusLive, mode: FocusMode, running: Boolean, ended: Boolean): String = when (mode) {
    FocusMode.POMO -> {
        val phase = ctx.getString(
            when (live.pomo.phase) { "short" -> R.string.phase_short; "long" -> R.string.phase_long; else -> R.string.phase_work },
        )
        when {
            ended -> ctx.getString(if (live.pomo.phase == "work") R.string.work_done_title else R.string.break_done_title)
            else -> "$phase · ${ctx.getString(R.string.focus_round, live.pomo.round, live.cfg.every)}" +
                if (!running && live.pomo.remaining != null) " · ${ctx.getString(R.string.focus_paused)}" else ""
        }
    }
    FocusMode.TIMER -> when {
        ended -> ctx.getString(R.string.timer_done_title)
        else -> ctx.getString(R.string.timer_of, durLabel(ctx, live.timer.duration)) +
            if (!running && live.timer.remaining != null) " · ${ctx.getString(R.string.focus_paused)}" else ""
    }
    FocusMode.STOPWATCH -> when {
        running -> ctx.getString(R.string.focus_tab_sw_title)
        live.stopwatch.elapsed > 0 -> "${ctx.getString(R.string.focus_tab_sw_title)} · ${ctx.getString(R.string.focus_paused)}"
        else -> ctx.getString(R.string.focus_tab_sw_title)
    }
}

private fun durLabel(ctx: Context, ms: Long): String {
    val min = ms / 60_000
    val sec = (ms / 1000) % 60
    return if (sec == 0L) ctx.getString(R.string.min_short, min.toInt()) else "%d:%02d".format(min, sec)
}

/** Живые часы: Chronometer сам тикает на рабочем столе, без перерисовки виджета каждую секунду. */
private fun chrono(context: Context, ms: Long, countDown: Boolean, running: Boolean, color: Color, sizeSp: Float): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.focus_chrono)
    val now = SystemClock.elapsedRealtime()
    rv.setChronometer(R.id.chrono, if (countDown) now + ms else now - ms, null, running)
    rv.setChronometerCountDown(R.id.chrono, countDown)
    rv.setTextColor(R.id.chrono, color.toArgb())
    rv.setTextViewTextSize(R.id.chrono, TypedValue.COMPLEX_UNIT_SP, sizeSp)
    return rv
}

@Composable
private fun androidx.glance.layout.RowScope.Tab(label: String, mode: FocusMode, current: FocusMode, p: OktoPalette) {
    val on = mode == current
    Box(
        GlanceModifier.defaultWeight().height(26.dp).cornerRadius(8.dp)
            .background(if (on) p.key else Color.Transparent)
            .clickable(actionRunCallback<FocusAction>(params(FocusOp.MODE, mode))),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, maxLines = 1, style = TextStyle(color = cp(if (on) p.ink else p.muted), fontSize = 10.sp, fontFamily = FontFamily.Monospace))
    }
}

@Composable
private fun IconKey(icon: Int, label: String, op: FocusOp, mode: FocusMode, p: OktoPalette, enabled: Boolean) {
    val tint = if (enabled) p.keyInk else p.keyInk.copy(alpha = 0.35f)
    val m = GlanceModifier.size(44.dp).background(p.key).cornerRadius(12.dp)
    Box(if (enabled) m.clickable(actionRunCallback<FocusAction>(params(op, mode))) else m, contentAlignment = Alignment.Center) {
        Image(ImageProvider(icon), label, GlanceModifier.size(20.dp), colorFilter = ColorFilter.tint(cp(tint)))
    }
}

@Composable
private fun TextKey(label: String, op: FocusOp, mode: FocusMode, p: OktoPalette, enabled: Boolean) {
    val m = GlanceModifier.height(44.dp).background(p.key).cornerRadius(12.dp).padding(horizontal = 12.dp)
    Box(if (enabled) m.clickable(actionRunCallback<FocusAction>(params(op, mode))) else m, contentAlignment = Alignment.Center) {
        Text(label, maxLines = 1, style = TextStyle(color = cp(if (enabled) p.keyInk else p.muted), fontSize = 13.sp, fontWeight = FontWeight.Medium))
    }
}

enum class FocusOp { MODE, TOGGLE, RESET, SKIP, ADD_MINUTE, FINISH }

private val KeyOp = ActionParameters.Key<String>("focusOp")
private val KeyMode = ActionParameters.Key<String>("focusMode")
private fun params(op: FocusOp, mode: FocusMode) = actionParametersOf(KeyOp to op.name, KeyMode to mode.name)

class FocusAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val op = parameters[KeyOp]?.let { runCatching { FocusOp.valueOf(it) }.getOrNull() } ?: return
        val mode = parameters[KeyMode]?.let { runCatching { FocusMode.valueOf(it) }.getOrNull() } ?: return
        when (op) {
            FocusOp.MODE -> FocusWidgetMode.set(context, mode)
            FocusOp.TOGGLE -> FocusRepository.update(context) { l, now -> l.toggle(mode, now) to null }
            FocusOp.RESET -> FocusRepository.update(context) { l, now -> l.reset(mode, now) to null }
            FocusOp.SKIP -> FocusRepository.update(context) { l, now -> l.advance(now, natural = false) }
            FocusOp.ADD_MINUTE -> FocusRepository.update(context) { l, now -> l.addMinute(now) to null }
            // Время вышло: помодоро закрывает фазу (с сессией), таймер начинается заново.
            FocusOp.FINISH -> FocusRepository.update(context) { l, now ->
                when {
                    mode == FocusMode.POMO && l.ended(FocusMode.POMO, now) -> l.advance(now, natural = true)
                    mode == FocusMode.TIMER -> l.reset(FocusMode.TIMER, now).toggle(FocusMode.TIMER, now) to null
                    else -> l to null
                }
            }
        }
        updateFocusWidgets(context)
    }
}
