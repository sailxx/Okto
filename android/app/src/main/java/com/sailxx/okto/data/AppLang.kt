package com.sailxx.okto.data

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

/**
 * Язык интерфейса Okto (настройка «Язык» на сайте, поле lang в settings/main).
 * Виджеты, экраны и уведомления показывают его, а не язык системы. Пока настройка не пришла — язык системы.
 */
object AppLang {
    private const val PREFS = "app_lang"
    private val SUPPORTED = setOf("ru", "en")

    @Volatile private var cached: String? = null

    fun get(context: Context): String? = cached ?: context.applicationContext
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("lang", null)
        ?.takeIf { it in SUPPORTED }.also { cached = it }

    /** Запоминает язык; true — если он изменился. */
    fun set(context: Context, lang: String?): Boolean {
        val v = lang?.takeIf { it in SUPPORTED } ?: return false
        if (v == get(context)) return false
        cached = v
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("lang", v).apply()
        return true
    }

    fun locale(context: Context): Locale = get(context)?.let { Locale.forLanguageTag(it) } ?: Locale.getDefault()

    fun isRu(context: Context): Boolean = locale(context).language == "ru"

    /** Контекст, строки которого берутся на языке Okto. */
    fun wrap(context: Context): Context {
        val lang = get(context) ?: return context
        if (context.resources.configuration.locales[0].language == lang) return context
        val conf = Configuration(context.resources.configuration).apply { setLocale(Locale.forLanguageTag(lang)) }
        return context.createConfigurationContext(conf)
    }
}
