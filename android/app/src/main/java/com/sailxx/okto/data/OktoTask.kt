package com.sailxx.okto.data

import com.google.firebase.firestore.DocumentSnapshot
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.ChronoUnit

data class Repeat(val freq: String, val interval: Int, val until: String?)

/** Задача Okto в том виде, в каком веб-версия хранит её в Firestore: users/{uid}/tasks/{id}. */
data class OktoTask(
    val id: String,
    val title: String,
    val listId: String,
    val priority: Int,
    val color: String?,
    val kind: String,
    val link: String,
    val date: String?,      // "yyyy-MM-dd" или null (без даты)
    val start: String?,     // "HH:mm" или null
    val duration: Int,
    val repeat: Repeat?,
    val done: Boolean,
    val doneDates: List<String>,
    val skipDates: List<String>,
    val deleted: Boolean,
) {
    /** Порт функции повторов из Okto: выпадает ли задача на день [day]. */
    fun occursOn(day: String): Boolean {
        if (deleted || date == null || day < date) return false
        val r = repeat ?: return day == date
        if ((r.until != null && day > r.until) || day in skipDates) return false
        val from = LocalDate.parse(date)
        val to = LocalDate.parse(day)
        val days = ChronoUnit.DAYS.between(from, to)
        return when (r.freq) {
            "day" -> days % r.interval == 0L
            "weekday" -> to.dayOfWeek != DayOfWeek.SATURDAY && to.dayOfWeek != DayOfWeek.SUNDAY
            "week" -> days % (7L * r.interval) == 0L
            "month" -> {
                val months = (to.year - from.year) * 12 + (to.monthValue - from.monthValue)
                months % r.interval == 0 && to.dayOfMonth == minOf(from.dayOfMonth, to.lengthOfMonth())
            }
            else -> false
        }
    }

    fun isDoneOn(day: String): Boolean = if (repeat != null) day in doneDates else done

    companion object {
        private val FREQS = setOf("day", "weekday", "week", "month")
        private val ISO_DATE = Regex("""\d{4}-\d{2}-\d{2}""")

        fun fromDoc(doc: DocumentSnapshot): OktoTask? = doc.data?.let { fromMap(doc.id, it) }

        fun fromMap(id: String, m: Map<String, Any?>): OktoTask {
            val r = m["repeat"] as? Map<*, *>
            val freq = r?.get("freq") as? String
            val repeat = if (r != null && freq in FREQS) {
                Repeat(
                    freq = freq!!,
                    interval = ((r["interval"] as? Number)?.toInt() ?: 1).coerceIn(1, 99),
                    until = isoDate(r["until"]),
                )
            } else null
            return OktoTask(
                id = id,
                title = m["title"] as? String ?: "",
                listId = m["listId"] as? String ?: "",
                priority = (m["priority"] as? Number)?.toInt() ?: 0,
                color = m["color"] as? String,
                kind = if (m["kind"] == "call") "call" else "task",
                link = m["link"] as? String ?: "",
                date = isoDate(m["date"]),
                start = m["start"] as? String,
                duration = (m["duration"] as? Number)?.toInt() ?: 30,
                repeat = repeat,
                done = m["done"] == true,
                doneDates = strings(m["doneDates"]),
                skipDates = strings(m["skipDates"]),
                deleted = m["deleted"] == true,
            )
        }

        private fun isoDate(v: Any?): String? = (v as? String)?.takeIf { ISO_DATE.matches(it) }

        private fun strings(v: Any?): List<String> =
            (v as? List<*>)?.mapNotNull { isoDate(it) }?.distinct() ?: emptyList()
    }
}
