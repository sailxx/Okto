package com.sailxx.okto.data

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Размеры текста в виджетах, в пикселях шрифта (sp).
 * [fixed] — не учитывать системный масштаб шрифта: 19 остаётся 19 при любых настройках телефона.
 */
data class WidgetText(
    val title: Int = 19,
    val meta: Int = 14,
    val counter: Int = 32,
    val fixed: Boolean = false,
) {
    /** Размер в sp с поправкой на системный масштаб, если [fixed]. */
    fun sp(px: Int, fontScale: Float): Float = if (fixed) px / fontScale else px.toFloat()

    companion object {
        val TITLE = 11..30
        val META = 9..22
        val COUNTER = 18..60

        val PRESETS = listOf(
            "S" to WidgetText(14, 11, 24),
            "M" to WidgetText(),
            "L" to WidgetText(23, 16, 42),
            "XL" to WidgetText(28, 20, 54),
        )
    }
}

object WidgetTextStore {
    private const val PREFS = "widget_text"

    private val _state = MutableStateFlow<WidgetText?>(null)
    val state: StateFlow<WidgetText?> = _state.asStateFlow()

    fun load(context: Context): WidgetText = _state.value ?: run {
        val sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val d = WidgetText()
        WidgetText(
            title = sp.getInt("title", d.title).coerceIn(WidgetText.TITLE),
            meta = sp.getInt("meta", d.meta).coerceIn(WidgetText.META),
            counter = sp.getInt("counter", d.counter).coerceIn(WidgetText.COUNTER),
            fixed = sp.getBoolean("fixed", d.fixed),
        ).also { _state.value = it }
    }

    fun save(context: Context, t: WidgetText) {
        val v = t.copy(
            title = t.title.coerceIn(WidgetText.TITLE),
            meta = t.meta.coerceIn(WidgetText.META),
            counter = t.counter.coerceIn(WidgetText.COUNTER),
        )
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putInt("title", v.title)
            .putInt("meta", v.meta)
            .putInt("counter", v.counter)
            .putBoolean("fixed", v.fixed)
            .apply()
        _state.value = v
    }
}
