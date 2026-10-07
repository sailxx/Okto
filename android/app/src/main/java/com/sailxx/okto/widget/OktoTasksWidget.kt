package com.sailxx.okto.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.Action
import androidx.glance.action.actionParametersOf
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
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextDecoration
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.sailxx.okto.R
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.Status
import com.sailxx.okto.data.WidgetItem
import com.sailxx.okto.data.WidgetState
import com.sailxx.okto.ui.WidgetSettingsActivity
import com.sailxx.okto.ui.QuickAddActivity
import kotlin.math.roundToInt

const val OKTO_URL = "https://sailxx.github.io/Okto/"

class OktoTasksWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        OktoRepository.refreshIfStale(context)
        provideContent {
            val state by OktoRepository.state.collectAsState()
            WidgetBody(state)
        }
    }
}

private fun cp(c: Color) = ColorProvider(c)

@Composable
private fun WidgetBody(s: WidgetState) {
    val p = s.palette
    Column(
        modifier = GlanceModifier.fillMaxSize().background(p.bg).cornerRadius(24.dp).padding(10.dp),
    ) {
        when (s.status) {
            Status.LOADING -> Centered { Logo(p) }
            Status.SIGNED_OUT -> SignedOut(p)
            Status.READY -> {
                Header(s)
                Spacer(GlanceModifier.height(4.dp))
                TaskList(s)
            }
        }
    }
}

@Composable
private fun Centered(content: @Composable () -> Unit) {
    Box(GlanceModifier.fillMaxSize(), contentAlignment = Alignment.Center) { content() }
}

@Composable
private fun Logo(p: OktoPalette) {
    Text("● okto", style = TextStyle(color = cp(p.ink), fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace))
}

@Composable
private fun SignedOut(p: OktoPalette) {
    val ctx = LocalContext.current
    Centered {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Logo(p)
            Spacer(GlanceModifier.height(6.dp))
            Text(ctx.getString(R.string.sign_in_hint), style = TextStyle(color = cp(p.muted), fontSize = 13.sp))
            Spacer(GlanceModifier.height(12.dp))
            Box(
                modifier = GlanceModifier.background(p.accent).cornerRadius(10.dp)
                    .padding(horizontal = 16.dp, vertical = 10.dp)
                    .clickable(actionStartActivity<WidgetSettingsActivity>()),
            ) {
                Text(ctx.getString(R.string.sign_in), style = TextStyle(color = cp(p.onAccent), fontSize = 14.sp, fontWeight = FontWeight.Medium))
            }
        }
    }
}

/** «Колодец» с крупным моно-счётчиком 03/07 и сегментной шкалой — как карточки на главной Okto. */
@Composable
private fun Header(s: WidgetState) {
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
                style = TextStyle(color = cp(p.wellInk), fontSize = 32.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace),
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
private fun KeyButton(icon: Int, description: String, bg: Color, ink: Color, onClick: Action) {
    Box(
        modifier = GlanceModifier.size(40.dp).background(bg).cornerRadius(12.dp).clickable(onClick),
        contentAlignment = Alignment.Center,
    ) {
        Image(ImageProvider(icon), description, GlanceModifier.size(20.dp), colorFilter = ColorFilter.tint(cp(ink)))
    }
}

@Composable
private fun TaskList(s: WidgetState) {
    val p = s.palette
    val ctx = LocalContext.current
    if (s.items.isEmpty()) {
        Centered {
            Text(ctx.getString(R.string.empty), style = TextStyle(color = cp(p.muted), fontSize = 12.sp, fontFamily = FontFamily.Monospace))
        }
        return
    }
    LazyColumn(GlanceModifier.fillMaxSize()) {
        items(s.items, itemId = { (it.taskId + it.date).hashCode().toLong() }) { TaskRow(it, p) }
    }
}

@Composable
private fun TaskRow(item: WidgetItem, p: OktoPalette) {
    val ctx = LocalContext.current
    val openOkto = oktoIntent(ctx, "#/tasks")
    val toggleParams = if (item.occurrence != null) {
        actionParametersOf(KeyTaskId to item.taskId, KeyDate to item.occurrence)
    } else {
        actionParametersOf(KeyTaskId to item.taskId)
    }
    Row(
        modifier = GlanceModifier.fillMaxWidth().padding(vertical = 4.dp).clickable(actionStartActivity(openOkto)),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = GlanceModifier.size(40.dp).clickable(actionRunCallback<ToggleTaskAction>(toggleParams)),
            contentAlignment = Alignment.Center,
        ) {
            Image(
                provider = ImageProvider(if (item.done) R.drawable.ic_checked else R.drawable.ic_unchecked),
                contentDescription = ctx.getString(if (item.done) R.string.mark_undone else R.string.mark_done),
                modifier = GlanceModifier.size(22.dp),
                colorFilter = ColorFilter.tint(cp(if (item.done) p.muted else item.color ?: p.ink)),
            )
        }
        Spacer(GlanceModifier.width(4.dp))
        Column(GlanceModifier.defaultWeight()) {
            Text(
                item.title,
                maxLines = 2,
                style = TextStyle(
                    color = cp(if (item.done) p.muted else p.ink),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (item.done) TextDecoration.LineThrough else TextDecoration.None,
                ),
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                item.color?.takeIf { !item.done }?.let {
                    Image(ImageProvider(R.drawable.ic_dot), null, GlanceModifier.size(6.dp), colorFilter = ColorFilter.tint(cp(it)))
                    Spacer(GlanceModifier.width(5.dp))
                }
                Text(
                    item.meta,
                    maxLines = 1,
                    style = TextStyle(
                        color = cp(if (item.overdue) p.red else p.muted),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                    ),
                )
            }
        }
    }
}
