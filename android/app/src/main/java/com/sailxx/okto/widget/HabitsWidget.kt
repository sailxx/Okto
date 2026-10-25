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
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextDecoration
import androidx.glance.text.TextStyle
import com.sailxx.okto.R
import com.sailxx.okto.data.AppLang
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.WidgetItem
import com.sailxx.okto.data.WidgetState

/** Привычки на сегодня: счётчик «выполнено из всех» и кружки, которые отмечаются прямо на экране. */
class HabitsWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        OktoRepository.refreshIfStale(context)
        provideContent {
            val state by OktoRepository.state.collectAsState()
            Frame(state, padding = 10) { Habits(state, textSizes()) }
        }
    }
}

/** В строке и столбце RemoteViews не больше 10 детей: на виджете помещается не больше шести привычек. */
private const val MAX_HABITS = 6

@Composable
private fun Habits(s: WidgetState, t: TextSizes) {
    val p = s.palette
    val ctx = AppLang.wrap(LocalContext.current)
    val done = s.habits.count { it.done }
    Column(GlanceModifier.fillMaxSize()) {
        Row(
            GlanceModifier.fillMaxWidth().padding(horizontal = 4.dp).clickable(actionStartActivity(oktoIntent(ctx, "#/habits"))),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(ctx.getString(R.string.habits_caption), maxLines = 1, modifier = GlanceModifier.defaultWeight(), style = TextStyle(color = cp(p.muted), fontSize = 10.sp, fontFamily = FontFamily.Monospace))
            if (s.habits.isNotEmpty()) {
                Text("$done/${s.habits.size}", maxLines = 1, style = TextStyle(color = cp(p.ink), fontSize = t.meta, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace))
            }
        }
        Spacer(GlanceModifier.height(4.dp))
        if (s.habits.isEmpty()) {
            Centered {
                Text(ctx.getString(R.string.habits_empty), style = TextStyle(color = cp(p.muted), fontSize = t.meta, fontFamily = FontFamily.Monospace))
            }
        } else {
            s.habits.take(MAX_HABITS).forEach { HabitRow(it, s, t) }
        }
    }
}

@Composable
private fun HabitRow(item: WidgetItem, s: WidgetState, t: TextSizes) {
    val p = s.palette
    val ctx = AppLang.wrap(LocalContext.current)
    val done = item.done || CheckAnim.frame(item.taskId, item.occurrence) == CheckAnim.CHECK
    val tint = item.color?.takeIf { !done }
    val card = tint?.let { lerp(p.bg, it, if (p.isDark) 0.24f else 0.16f) } ?: p.key
    Row(
        GlanceModifier.fillMaxWidth().padding(bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            GlanceModifier.fillMaxWidth().background(card).cornerRadius(14.dp).padding(end = 12.dp)
                .clickable(actionStartActivity(oktoIntent(ctx, "#/habits"))),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CheckButton(item.taskId, item.occurrence, item.done, if (item.done) p.muted else item.color ?: p.ink, t.check)
            Text(
                item.title,
                maxLines = 1,
                modifier = GlanceModifier.defaultWeight(),
                style = TextStyle(
                    color = cp(if (done) p.muted else p.ink),
                    fontSize = t.title,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (done) TextDecoration.LineThrough else TextDecoration.None,
                ),
            )
            item.start?.let {
                Text(it, maxLines = 1, style = TextStyle(color = cp(p.muted), fontSize = t.meta, fontFamily = FontFamily.Monospace))
            }
        }
    }
}
