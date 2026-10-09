package com.sailxx.okto.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
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
import com.sailxx.okto.data.HEAT_DAYS
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.Status
import com.sailxx.okto.data.WidgetState
import com.sailxx.okto.ui.QuickAddActivity

/** Каркас маленьких виджетов: фон темы, скругление и общие состояния «загрузка» / «не выполнен вход». */
@Composable
private fun Frame(s: WidgetState, padding: Int = 14, content: @Composable () -> Unit) {
    val p = s.palette
    Box(GlanceModifier.fillMaxSize().background(p.bg).cornerRadius(24.dp).padding(padding.dp)) {
        when (s.status) {
            Status.LOADING -> Centered { Logo(p) }
            Status.SIGNED_OUT -> SignedOut(p)
            Status.READY -> content()
        }
    }
}

@Composable
private fun MonoCaption(text: String, color: Color) {
    Text(text, maxLines = 1, style = TextStyle(color = cp(color), fontSize = 10.sp, fontFamily = FontFamily.Monospace))
}

// ===== «Следующая»: ближайшая задача со временем =====

class NextTaskWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        OktoRepository.refreshIfStale(context)
        provideContent {
            val state by OktoRepository.state.collectAsState()
            Frame(state, padding = 6) { NextTask(state, textSizes()) }
        }
    }
}

@Composable
private fun NextTask(s: WidgetState, t: TextSizes) {
    val p = s.palette
    val ctx = LocalContext.current
    val next = s.next
    if (next == null) {
        Column(
            GlanceModifier.fillMaxSize().padding(horizontal = 10.dp).clickable(actionStartActivity<QuickAddActivity>()),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            MonoCaption(ctx.getString(R.string.next_caption), p.muted)
            Text(ctx.getString(R.string.next_empty), maxLines = 2, style = TextStyle(color = cp(p.muted), fontSize = t.meta))
        }
        return
    }
    val tint = next.color ?: p.ink
    Row(
        GlanceModifier.fillMaxSize().clickable(actionStartActivity(oktoIntent(ctx, "#/tasks"))),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Spacer(GlanceModifier.width(8.dp))
        Box(GlanceModifier.width(4.dp).fillMaxHeight().padding(vertical = 6.dp)) {
            Box(GlanceModifier.fillMaxSize().background(tint).cornerRadius(2.dp)) {}
        }
        Spacer(GlanceModifier.width(10.dp))
        Column(GlanceModifier.defaultWeight()) {
            Text(next.meta, maxLines = 1, style = TextStyle(color = cp(p.muted), fontSize = t.meta, fontFamily = FontFamily.Monospace))
            Text(next.title, maxLines = 2, style = TextStyle(color = cp(p.ink), fontSize = t.title, fontWeight = FontWeight.Medium))
        }
        CheckButton(next.taskId, next.occurrence, done = false, tint = tint, size = t.check)
    }
}

// ===== «Быстрая задача»: одна кнопка =====

class QuickAddWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        OktoRepository.refreshIfStale(context)
        provideContent {
            val state by OktoRepository.state.collectAsState()
            QuickAddButton(state.palette)
        }
    }
}

@Composable
private fun QuickAddButton(p: OktoPalette) {
    val ctx = LocalContext.current
    Box(
        GlanceModifier.fillMaxSize().background(p.accent).cornerRadius(24.dp).clickable(actionStartActivity<QuickAddActivity>()),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Image(ImageProvider(R.drawable.ic_add), ctx.getString(R.string.add_task), GlanceModifier.size(36.dp), colorFilter = ColorFilter.tint(cp(p.onAccent)))
            Spacer(GlanceModifier.height(2.dp))
            MonoCaption(ctx.getString(R.string.quick_add_caption), p.onAccent)
        }
    }
}

// ===== «Серия»: дни подряд и тепловая карта за 4 недели =====

class StreakWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        OktoRepository.refreshIfStale(context)
        provideContent {
            val state by OktoRepository.state.collectAsState()
            Frame(state) { Streak(state, textSizes()) }
        }
    }
}

@Composable
private fun Streak(s: WidgetState, t: TextSizes) {
    val p = s.palette
    val ctx = LocalContext.current
    Column(GlanceModifier.fillMaxSize().clickable(actionStartActivity(oktoIntent(ctx, "#/")))) {
        MonoCaption(ctx.getString(R.string.streak_caption), p.muted)
        Row(verticalAlignment = Alignment.Bottom) {
            Text("${s.streak}", style = TextStyle(color = cp(p.ink), fontSize = t.counter, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace))
            Spacer(GlanceModifier.width(6.dp))
            Text(
                ctx.resources.getQuantityString(R.plurals.streak_days, s.streak),
                maxLines = 1,
                modifier = GlanceModifier.padding(bottom = 4.dp),
                style = TextStyle(color = cp(p.muted), fontSize = t.meta),
            )
        }
        Spacer(GlanceModifier.height(8.dp))
        // 4 строки по 7 дней: лимит RemoteViews — не больше 10 детей в строке/столбце
        Column(GlanceModifier.fillMaxWidth().defaultWeight()) {
            s.heat.takeLast(HEAT_DAYS).chunked(7).forEach { week ->
                Row(GlanceModifier.fillMaxWidth().defaultWeight()) {
                    week.forEach { n ->
                        Box(GlanceModifier.defaultWeight().fillMaxHeight().padding(2.dp)) {
                            Box(GlanceModifier.fillMaxSize().background(heatColor(n, p)).cornerRadius(4.dp)) {}
                        }
                    }
                }
            }
        }
    }
}

/** 0 — пустой день, -1 — был только фокус, дальше ярче с каждой выполненной задачей. */
private fun heatColor(n: Int, p: OktoPalette): Color = when {
    n == 0 -> p.line
    n < 0 -> lerp(p.bg, p.ink, 0.25f)
    else -> lerp(p.bg, p.ink, (0.25f + 0.15f * n).coerceAtMost(1f))
}
