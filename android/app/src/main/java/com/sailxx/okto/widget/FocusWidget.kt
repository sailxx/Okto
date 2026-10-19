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
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import com.sailxx.okto.R
import com.sailxx.okto.data.AppLang
import com.sailxx.okto.data.FocusLive
import com.sailxx.okto.data.FocusMode
import com.sailxx.okto.data.FocusRepository
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.WidgetState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Какой режим показывает виджет. Пока не выбран — тот, что идёт, иначе помодоро.
 * Это поток, а не просто настройка: Glance перерисовывает виджет, только когда меняется то,
 * что он наблюдает, и без потока вкладки не переключались.
 */
object FocusWidgetMode {
    private const val PREFS = "focus_widget"
    private val chosen = MutableStateFlow<FocusMode?>(null)
    @Volatile private var loaded = false

    fun flow(context: Context): StateFlow<FocusMode?> {
        if (!loaded) {
            loaded = true
            chosen.value = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("mode", null)
                ?.let { runCatching { FocusMode.valueOf(it) }.getOrNull() }
        }
        return chosen.asStateFlow()
    }

    fun resolve(chosen: FocusMode?, live: FocusLive?): FocusMode =
        chosen ?: FocusMode.entries.firstOrNull { live?.running(it) == true } ?: FocusMode.POMO

    fun set(context: Context, mode: FocusMode) {
        loaded = true
        chosen.value = mode
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("mode", mode.name).apply()
    }
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
            val chosen by FocusWidgetMode.flow(context).collectAsState()
            Frame(state, padding = 12) { Focus(state, live ?: FocusLive.DEFAULT, FocusWidgetMode.resolve(chosen, live)) }
        }
    }
}

@Composable
private fun Focus(s: WidgetState, live: FocusLive, mode: FocusMode) {
    val p = s.palette
    val app = LocalContext.current
    val ctx = AppLang.wrap(app)
    val now = System.currentTimeMillis()
    val running = live.running(mode)
    val ended = live.ended(mode, now)
    val started = live.started(mode)
    val (ms, down) = when (mode) {
        FocusMode.POMO -> live.pomoLeft(now) to true
        FocusMode.TIMER -> live.timerLeft(now) to true
        FocusMode.STOPWATCH -> live.swAt(now) to false
    }
    val fit = FocusFit(LocalSize.current.width.value, LocalSize.current.height.value, hours = ms >= 3_600_000, timer = mode == FocusMode.TIMER)

    Column(GlanceModifier.fillMaxSize()) {
        Row(GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Tab(ctx.getString(R.string.focus_tab_pomo), FocusMode.POMO, mode, p, fit.caption)
            Spacer(GlanceModifier.width(4.dp))
            Tab(ctx.getString(R.string.focus_tab_timer), FocusMode.TIMER, mode, p, fit.caption)
            Spacer(GlanceModifier.width(4.dp))
            Tab(ctx.getString(R.string.focus_tab_sw), FocusMode.STOPWATCH, mode, p, fit.caption)
            if (fit.caption) {
                Text(
                    caption(ctx, live, mode, running, ended, started, fit.presets),
                    GlanceModifier.defaultWeight().padding(start = 8.dp),
                    maxLines = 1,
                    style = TextStyle(color = cp(if (ended) p.red else p.muted), fontSize = fit.captionSp.sp, textAlign = TextAlign.End),
                )
            }
        }
        Row(
            GlanceModifier.fillMaxWidth().defaultWeight().padding(start = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Высота задана явно: без неё блок часов забирал всё место.
            AndroidRemoteViews(
                chrono(app, if (ended) 0 else ms, down, running && !ended, if (ended) p.red else p.ink, fit.digits),
                GlanceModifier.defaultWeight().height(fit.digitsBox.dp)
                    .clickable(actionStartActivity(oktoIntent(ctx, "#/focus"))),
            )
            if (fit.adjust) {
                Column {
                    SmallKey("+1", FocusOp.ADD_MINUTE, mode, p, enabled = !ended, height = fit.adjKey)
                    Spacer(GlanceModifier.height(6.dp))
                    SmallKey("−1", FocusOp.SUB_MINUTE, mode, p, enabled = !ended && ms > 60_000, height = fit.adjKey)
                }
            }
        }
        if (fit.presets) {
            Row(GlanceModifier.fillMaxWidth().padding(bottom = 6.dp)) {
                PRESETS.forEachIndexed { i, min ->
                    if (i > 0) Spacer(GlanceModifier.width(6.dp))
                    Preset(
                        if (fit.presetUnits) ctx.getString(R.string.min_short, min) else "$min",
                        min, p, on = !started && live.timer.duration == min * 60_000L,
                    )
                }
            }
        }
        Row(GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconKey(R.drawable.ic_focus_reset, ctx.getString(R.string.focus_reset), FocusOp.RESET, mode, p, enabled = started && !ended, size = fit.key)
            Spacer(GlanceModifier.width(8.dp))
            val label = when {
                ended && mode == FocusMode.POMO -> ctx.getString(R.string.focus_next)
                ended -> ctx.getString(R.string.focus_again)
                running -> ctx.getString(R.string.focus_pause)
                else -> ctx.getString(R.string.focus_start)
            }
            val icon = if (running && !ended) R.drawable.ic_focus_pause else R.drawable.ic_focus_play
            Box(
                GlanceModifier.defaultWeight().height(fit.key.dp).background(p.accent).cornerRadius(14.dp)
                    .clickable(actionRunCallback<FocusAction>(params(if (ended) FocusOp.FINISH else FocusOp.TOGGLE, mode))),
                contentAlignment = Alignment.Center,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(ImageProvider(icon), null, GlanceModifier.size(18.dp), colorFilter = ColorFilter.tint(cp(p.onAccent)))
                    Spacer(GlanceModifier.width(6.dp))
                    Text(label, maxLines = 1, style = TextStyle(color = cp(p.onAccent), fontSize = fit.keySp.sp, fontWeight = FontWeight.Medium))
                }
            }
            if (mode == FocusMode.POMO) {
                Spacer(GlanceModifier.width(8.dp))
                IconKey(R.drawable.ic_focus_skip, ctx.getString(R.string.focus_skip), FocusOp.SKIP, mode, p, enabled = !ended, size = fit.key)
            }
        }
    }
}

/** Пресеты таймера под цифрами, минуты. */
private val PRESETS = listOf(1, 5, 10, 25)

/** Короткая подпись справа от вкладок: длинная («Работа · раунд 1 из 4») рядом с ними не помещается. */
private fun caption(ctx: Context, live: FocusLive, mode: FocusMode, running: Boolean, ended: Boolean, started: Boolean, presets: Boolean): String {
    val paused = started && !running
    return when (mode) {
        FocusMode.POMO -> {
            val phase = ctx.getString(
                when (live.pomo.phase) { "short" -> R.string.phase_short; "long" -> R.string.phase_long; else -> R.string.phase_work },
            )
            when {
                ended -> ctx.getString(if (live.pomo.phase == "work") R.string.work_done_title else R.string.break_done_title)
                paused -> "$phase · ${ctx.getString(R.string.focus_paused)}"
                else -> "$phase · ${live.pomo.round}/${live.cfg.every}"
            }
        }
        FocusMode.TIMER -> when {
            ended -> ctx.getString(R.string.timer_done_title)
            paused -> ctx.getString(R.string.focus_paused)
            // Не запущен и видны пресеты — длительность и так подсвечена.
            !started && presets -> ""
            else -> ctx.getString(R.string.timer_of, durLabel(ctx, live.timer.duration))
        }
        FocusMode.STOPWATCH -> if (paused) ctx.getString(R.string.focus_paused) else ""
    }
}

private fun durLabel(ctx: Context, ms: Long): String {
    val min = ms / 60_000
    val sec = (ms / 1000) % 60
    return if (sec == 0L) ctx.getString(R.string.min_short, min.toInt()) else "%d:%02d".format(min, sec)
}

/**
 * Размеры под фактический размер виджета (dp): цифры занимают всё свободное место по высоте,
 * но не шире виджета. «04:54» в sans-serif-medium с моноширинными цифрами — около 2,6 em, «1:04:54» — 3,4 em.
 * Таймер: справа от цифр столбик ±1 мин, под ними ряд пресетов — если цифрам после него хватает места.
 */
internal class FocusFit(width: Float, height: Float, hours: Boolean, timer: Boolean) {
    val key: Float = if (height < 130) 36f else 44f
    val keySp: Float = if (height < 130) 13f else 14f
    val captionSp: Float = 12f
    /** Вкладки по размеру текста и подпись справа; уже — вкладки делят строку поровну, без подписи. */
    val caption: Boolean = width >= 300
    // Рамка 12 + 12, вкладки 26, кнопки, зазор.
    private val free = height - 24 - 26 - key - 6
    val presets: Boolean = timer && (free - PRESET_ROW) / 1.15f >= 48f
    val presetUnits: Boolean = width >= 280
    private val forDigits = free - if (presets) PRESET_ROW else 0f
    val adjust: Boolean = timer && forDigits >= 50f
    val digits: Float = minOf(
        forDigits / 1.15f,
        (width - 32 - if (adjust) ADJ_KEY + 4 else 0f) / (if (hours) 3.6f else 2.75f),
    ).coerceIn(22f, 140f)
    val digitsBox: Float = digits * 1.15f
    /** Высота кнопок ±1: две с зазором 6 — не выше места под цифры. */
    val adjKey: Float = ((forDigits - 6) / 2).coerceIn(22f, 32f)

    companion object {
        const val PRESET_ROW = 36f
        const val ADJ_KEY = 44f
    }
}

/** Живые часы: Chronometer сам тикает на рабочем столе, без перерисовки виджета каждую секунду. */
private fun chrono(context: Context, ms: Long, countDown: Boolean, running: Boolean, color: Color, sizeDp: Float): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.focus_chrono)
    val now = SystemClock.elapsedRealtime()
    rv.setChronometer(R.id.chrono, if (countDown) now + ms else now - ms, null, running)
    rv.setChronometerCountDown(R.id.chrono, countDown)
    rv.setTextColor(R.id.chrono, color.toArgb())
    // dp, а не sp: размер подобран под место в виджете, системный масштаб шрифта его бы ломал.
    rv.setTextViewTextSize(R.id.chrono, TypedValue.COMPLEX_UNIT_DIP, sizeDp)
    return rv
}

@Composable
private fun androidx.glance.layout.RowScope.Tab(label: String, mode: FocusMode, current: FocusMode, p: OktoPalette, compact: Boolean) {
    val on = mode == current
    val m = if (compact) GlanceModifier.padding(horizontal = 10.dp) else GlanceModifier.defaultWeight()
    Box(
        m.height(26.dp).cornerRadius(13.dp)
            .background(if (on) p.accent else Color.Transparent)
            .clickable(actionRunCallback<FocusAction>(params(FocusOp.MODE, mode))),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, maxLines = 1, style = TextStyle(color = cp(if (on) p.onAccent else p.muted), fontSize = 10.sp, fontFamily = FontFamily.Monospace))
    }
}

@Composable
private fun IconKey(icon: Int, label: String, op: FocusOp, mode: FocusMode, p: OktoPalette, enabled: Boolean, size: Float) {
    val tint = if (enabled) p.keyInk else p.keyInk.copy(alpha = 0.35f)
    val m = GlanceModifier.size(size.dp).background(p.key).cornerRadius(12.dp)
    Box(if (enabled) m.clickable(actionRunCallback<FocusAction>(params(op, mode))) else m, contentAlignment = Alignment.Center) {
        Image(ImageProvider(icon), label, GlanceModifier.size(20.dp), colorFilter = ColorFilter.tint(cp(tint)))
    }
}

@Composable
private fun SmallKey(label: String, op: FocusOp, mode: FocusMode, p: OktoPalette, enabled: Boolean, height: Float) {
    val m = GlanceModifier.width(FocusFit.ADJ_KEY.dp).height(height.dp).background(p.key).cornerRadius(10.dp)
    Box(if (enabled) m.clickable(actionRunCallback<FocusAction>(params(op, mode))) else m, contentAlignment = Alignment.Center) {
        Text(label, maxLines = 1, style = TextStyle(color = cp(if (enabled) p.keyInk else p.muted), fontSize = 13.sp, fontWeight = FontWeight.Medium))
    }
}

/** Пресет таймера; выбранный — в рамке цвета текста (у Glance нет border: рамка — подложка с отступом). */
@Composable
private fun androidx.glance.layout.RowScope.Preset(label: String, minutes: Int, p: OktoPalette, on: Boolean) {
    Box(
        GlanceModifier.defaultWeight().height(30.dp).cornerRadius(10.dp).background(if (on) p.ink else p.key)
            .padding(if (on) 1.5.dp else 0.dp)
            .clickable(actionRunCallback<FocusAction>(params(FocusOp.PRESET, FocusMode.TIMER, minutes))),
    ) {
        Box(GlanceModifier.fillMaxSize().cornerRadius(9.dp).background(p.key), contentAlignment = Alignment.Center) {
            Text(label, maxLines = 1, style = TextStyle(color = cp(if (on) p.keyInk else p.muted), fontSize = 13.sp, fontWeight = FontWeight.Medium))
        }
    }
}

enum class FocusOp { MODE, TOGGLE, RESET, SKIP, ADD_MINUTE, SUB_MINUTE, PRESET, FINISH }

private val KeyOp = ActionParameters.Key<String>("focusOp")
private val KeyMode = ActionParameters.Key<String>("focusMode")
private val KeyMinutes = ActionParameters.Key<Int>("focusMinutes")
private fun params(op: FocusOp, mode: FocusMode, minutes: Int = 0) =
    actionParametersOf(KeyOp to op.name, KeyMode to mode.name, KeyMinutes to minutes)

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
            FocusOp.SUB_MINUTE -> FocusRepository.update(context) { l, now -> l.subMinute(now) to null }
            FocusOp.PRESET -> parameters[KeyMinutes]?.takeIf { it > 0 }?.let { min ->
                FocusRepository.update(context) { l, now -> l.setTimer(min, now) to null }
            }
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
