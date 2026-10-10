package com.sailxx.okto.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.actionParametersOf
import androidx.glance.action.clickable
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.sailxx.okto.R
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.WidgetText
import com.sailxx.okto.data.WidgetTextStore
import com.sailxx.okto.ui.WidgetSettingsActivity
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

private val updateLock = Mutex()

/**
 * Перерисовать все виджеты Okto: задачи, «Следующая», «Быстрая задача», «Серия».
 *
 * Каждый виджет обновляется строго по id своего приёмника, а не через `updateAll`: тот ищет id по
 * сохранённой связке «виджет → приёмник», и при сбое связки содержимое одного виджета рисовалось
 * на другом (маленькая «Серия» показывала копию большого списка). Вызовы идут по очереди.
 */
suspend fun updateOktoWidgets(context: Context) = updateLock.withLock {
    val app = context.applicationContext
    refresh(app, OktoTasksWidget(), OktoWidgetReceiver::class.java)
    refresh(app, NextTaskWidget(), NextTaskWidgetReceiver::class.java)
    refresh(app, QuickAddWidget(), QuickAddWidgetReceiver::class.java)
    refresh(app, StreakWidget(), StreakWidgetReceiver::class.java)
}

private suspend fun refresh(context: Context, widget: GlanceAppWidget, receiver: Class<*>) {
    val ids = AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, receiver))
    val manager = GlanceAppWidgetManager(context)
    for (id in ids) {
        try {
            widget.update(context, manager.getGlanceIdBy(id))
        } catch (e: Exception) {
            Log.w("OktoWidgets", "update failed for ${receiver.simpleName} #$id", e)
        }
    }
}

internal fun cp(c: Color) = ColorProvider(c)

/** Размеры текста из настроек, уже в sp. */
internal class TextSizes(t: WidgetText, fontScale: Float) {
    val title: TextUnit = t.sp(t.title, fontScale).sp
    val meta: TextUnit = t.sp(t.meta, fontScale).sp
    val counter: TextUnit = t.sp(t.counter, fontScale).sp

    /** Кружок растёт вместе с названием, чтобы при крупном тексте строки не выглядели пустыми. */
    val check: Dp = (t.title * 1.45f).coerceIn(22f, 40f).dp
}

@Composable
internal fun textSizes(): TextSizes {
    val ctx = LocalContext.current
    val text by WidgetTextStore.state.collectAsState()
    return TextSizes(text ?: WidgetTextStore.load(ctx), ctx.resources.configuration.fontScale)
}

@Composable
internal fun Centered(content: @Composable () -> Unit) {
    Box(GlanceModifier.fillMaxSize(), contentAlignment = Alignment.Center) { content() }
}

@Composable
internal fun Logo(p: OktoPalette) {
    Text("● okto", style = TextStyle(color = cp(p.ink), fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace))
}

@Composable
internal fun SignedOut(p: OktoPalette) {
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

/** Кружок-галочка: тап отмечает задачу (для повторяющейся — только [occurrence]). */
@Composable
internal fun CheckButton(taskId: String, occurrence: String?, done: Boolean, tint: Color, size: Dp) {
    val ctx = LocalContext.current
    val params = if (occurrence != null) {
        actionParametersOf(KeyTaskId to taskId, KeyDate to occurrence)
    } else {
        actionParametersOf(KeyTaskId to taskId)
    }
    Box(
        modifier = GlanceModifier.size(size + 16.dp).clickable(actionRunCallback<ToggleTaskAction>(params)),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            provider = ImageProvider(if (done) R.drawable.ic_checked else R.drawable.ic_unchecked),
            contentDescription = ctx.getString(if (done) R.string.mark_undone else R.string.mark_done),
            modifier = GlanceModifier.size(size),
            colorFilter = ColorFilter.tint(cp(tint)),
        )
    }
}
