package com.sailxx.okto.widget

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import com.sailxx.okto.data.OktoRepository
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.delay

val KeyTaskId = ActionParameters.Key<String>("taskId")
val KeyDate = ActionParameters.Key<String>("date")

/**
 * Кадры отметки задачи. Виджет не умеет анимации, поэтому кружок перерисовывается
 * несколько раз подряд: кольцо густеет → круг заливается → появляется галочка.
 */
object CheckAnim {
    const val RING = 1
    const val FILL = 2
    const val CHECK = 3
    private val frames = ConcurrentHashMap<String, Int>()
    fun key(taskId: String, occurrence: String?) = if (occurrence != null) "$taskId@$occurrence" else taskId
    fun frame(taskId: String, occurrence: String?): Int = frames[key(taskId, occurrence)] ?: 0
    internal fun set(key: String, frame: Int) { if (frame == 0) frames.remove(key) else frames[key] = frame }
    internal fun running(key: String) = frames.containsKey(key)
}

/** Тап по кружку: отметить задачу (оптимистично — виджет обновляется сразу, запись уходит в Firestore). */
class ToggleTaskAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val taskId = parameters[KeyTaskId] ?: return
        val occurrence = parameters[KeyDate]
        val key = CheckAnim.key(taskId, occurrence)
        if (CheckAnim.running(key)) return
        // Отметку «выполнено» проигрываем на месте, и только потом задача уезжает вниз списка.
        if (!OktoRepository.isDone(taskId, occurrence)) {
            for ((frame, pause) in listOf(CheckAnim.RING to 70L, CheckAnim.FILL to 70L, CheckAnim.CHECK to 380L)) {
                CheckAnim.set(key, frame)
                updateOktoWidgets(context)
                delay(pause)
            }
        }
        OktoRepository.toggle(context, taskId, occurrence)
        CheckAnim.set(key, 0)
        updateOktoWidgets(context)
    }
}

class RefreshAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        OktoRepository.refresh(context)
        updateOktoWidgets(context)
    }
}
