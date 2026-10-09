package com.sailxx.okto.widget

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import com.sailxx.okto.data.OktoRepository

val KeyTaskId = ActionParameters.Key<String>("taskId")
val KeyDate = ActionParameters.Key<String>("date")

/** Тап по кружку: отметить задачу (оптимистично — виджет обновляется сразу, запись уходит в Firestore). */
class ToggleTaskAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val taskId = parameters[KeyTaskId] ?: return
        OktoRepository.toggle(context, taskId, parameters[KeyDate])
        updateOktoWidgets(context)
    }
}

class RefreshAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        OktoRepository.refresh(context)
        updateOktoWidgets(context)
    }
}
