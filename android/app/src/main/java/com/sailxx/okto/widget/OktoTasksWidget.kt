package com.sailxx.okto.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
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
import androidx.glance.layout.width
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextDecoration
import androidx.glance.text.TextStyle
import com.sailxx.okto.R
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.Status
import com.sailxx.okto.data.WidgetItem
import com.sailxx.okto.data.WidgetState
import com.sailxx.okto.ui.QuickAddActivity
import kotlin.math.roundToInt

const val OKTO_URL = "https://sailxx.github.io/Okto/"

class OktoTasksWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        OktoRepository.refreshIfStale(context)
        provideContent {
            val state by OktoRepository.state.collectAsState()
            WidgetBody(state, textSizes())
        }
    }
}

@Composable
private fun WidgetBody(s: WidgetState, t: TextSizes) {
    val p = s.palette
    Column(
        modifier = GlanceModifier.fillMaxSize().background(p.bg).cornerRadius(24.dp).padding(10.dp),
    ) {
        when (s.status) {
            Status.LOADING -> Centered { Logo(p) }
            Status.SIGNED_OUT -> SignedOut(p)
            Status.READY -> {
                Header(s, t)
                Spacer(GlanceModifier.height(8.dp))
                TaskList(s, t)
            }
        }
    }
}

/** «Колодец» с крупным моно-счётчиком 03/07 и сегментной шкалой — как карточки на главной Okto. */
@Composable
private fun Header(s: WidgetState, t: TextSizes) {
    val p = s.palette
    val ctx = LocalContext.current
    Row(
        modifier = GlanceModifier.fillMaxWidth().background(p.well).cornerRadius(16.dp).padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(GlanceModifier.defaultWeight()) {
            val label = ctx.getString(R.string.tasks_today) + if (s.offline) " · OFFLINE" else ""
            Text(label, style = TextStyle(color = cp(p.wellDim), fontSize = 10.sp, fontFamily = FontFamily.Monospace), maxLines = 1)
            Text(
                "%02d/%02d".format(s.doneToday, s.totalToday),
                style = TextStyle(color = cp(p.wellInk), fontSize = t.counter, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace),
            )
            Spacer(GlanceModifier.height(6.dp))
            Segments(s.doneToday, s.totalToday, p)
        }
        Spacer(GlanceModifier.width(10.dp))
        Column {
            KeyButton(R.drawable.ic_add, ctx.getString(R.string.add_task), p.accent, p.onAccent, actionStartActivity<QuickAddActivity>())
            Spacer(GlanceModifier.height(8.dp))
            KeyButton(R.drawable.ic_sync, ctx.getString(R.string.sync), p.key, p.keyInk, actionRunCallback<RefreshAction>())
        }
    }
}

/** До 10 сегментов (лимит детей в RemoteViews); при большем числе задач шкала масштабируется. */
@Composable
private fun Segments(done: Int, total: Int, p: OktoPalette) {
    val n = total.coerceIn(1, 10)
    val filled = if (total == 0) 0 else (done.toFloat() * n / total).roundToInt()
    Row(GlanceModifier.fillMaxWidth().height(4.dp)) {
        repeat(n) { i ->
            Box(GlanceModifier.defaultWeight().fillMaxHeight().padding(end = if (i < n - 1) 3.dp else 0.dp)) {
                Box(GlanceModifier.fillMaxSize().background(if (i < filled) p.wellInk else p.wellGhost).cornerRadius(2.dp)) {}
            }
        }
    }
}

@Composable
private fun TaskList(s: WidgetState, t: TextSizes) {
    val p = s.palette
    val ctx = LocalContext.current
    if (s.items.isEmpty()) {
        Centered {
            Text(ctx.getString(R.string.empty), style = TextStyle(color = cp(p.muted), fontSize = t.meta, fontFamily = FontFamily.Monospace))
        }
        return
    }
    LazyColumn(GlanceModifier.fillMaxSize()) {
        items(s.items, itemId = { (it.taskId + it.date).hashCode().toLong() }) { TaskCard(it, p, t) }
    }
}

/** Задача — карточка, залитая цветом её списка; выполненная — нейтральная. */
@Composable
private fun TaskCard(item: WidgetItem, p: OktoPalette, t: TextSizes) {
    val ctx = LocalContext.current
    val tint = item.color?.takeIf { !item.done }
    val card = tint?.let { lerp(p.bg, it, if (p.isDark) 0.24f else 0.16f) } ?: p.key
    Box(GlanceModifier.fillMaxWidth().padding(bottom = 6.dp)) {
        Row(
            modifier = GlanceModifier.fillMaxWidth().background(card).cornerRadius(14.dp)
                .padding(end = 12.dp, top = 2.dp, bottom = 2.dp)
                .clickable(actionStartActivity(oktoIntent(ctx, "#/tasks"))),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CheckButton(item.taskId, item.occurrence, item.done, if (item.done) p.muted else tint ?: p.ink, t.check)
            Column(GlanceModifier.defaultWeight()) {
                Text(
                    item.title,
                    maxLines = 2,
                    style = TextStyle(
                        color = cp(if (item.done) p.muted else p.ink),
                        fontSize = t.title,
                        fontWeight = FontWeight.Medium,
                        textDecoration = if (item.done) TextDecoration.LineThrough else TextDecoration.None,
                    ),
                )
                Text(
                    item.meta,
                    maxLines = 1,
                    style = TextStyle(
                        color = cp(if (item.overdue) p.red else p.muted),
                        fontSize = t.meta,
                        fontFamily = FontFamily.Monospace,
                    ),
                )
            }
        }
    }
}
