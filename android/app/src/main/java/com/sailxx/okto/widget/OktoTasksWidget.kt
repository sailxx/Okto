package com.sailxx.okto.widget

import android.content.Context
import androidx.glance.ColorFilter
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.layout.Spacer
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.compose.ui.unit.sp
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
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
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
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
            Status.READY -> TaskList(s, t)
        }
    }
}

@Composable
private fun TaskList(s: WidgetState, t: TextSizes) {
    val p = s.palette
    val ctx = LocalContext.current
    if (s.items.isEmpty()) {
        Centered {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(ctx.getString(R.string.empty), style = TextStyle(color = cp(p.muted), fontSize = t.meta, fontFamily = FontFamily.Monospace))
                SyncRow(s, t)
            }
        }
        return
    }
    LazyColumn(GlanceModifier.fillMaxSize()) {
        items(s.items, itemId = { (it.taskId + it.date).hashCode().toLong() }) { TaskCard(it, p, t) }
        item(itemId = SYNC_ROW_ID) { SyncRow(s, t) }
    }
}

private const val SYNC_ROW_ID = Long.MIN_VALUE

/** Последняя строка списка: «↻ ОБНОВЛЕНО 14:36» или «↻ OFFLINE · 14:36»; тап — синхронизировать. */
@Composable
private fun SyncRow(s: WidgetState, t: TextSizes) {
    val p = s.palette
    val ctx = LocalContext.current
    val time = s.syncedAt.takeIf { it > 0 }?.let {
        Instant.ofEpochMilli(it).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm"))
    }
    val label = when {
        s.offline -> "OFFLINE" + (time?.let { " · $it" } ?: "")
        time != null -> ctx.getString(R.string.synced_at, time)
        else -> ctx.getString(R.string.sync)
    }
    Row(
        GlanceModifier.fillMaxWidth().padding(vertical = 8.dp).clickable(actionRunCallback<RefreshAction>()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Image(ImageProvider(R.drawable.ic_sync), ctx.getString(R.string.sync), GlanceModifier.size(14.dp), colorFilter = ColorFilter.tint(cp(p.muted)))
        Spacer(GlanceModifier.width(6.dp))
        Text(label.uppercase(), maxLines = 1, style = TextStyle(color = cp(if (s.offline) p.red else p.muted), fontSize = 11.sp, fontFamily = FontFamily.Monospace))
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
