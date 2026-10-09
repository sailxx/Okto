package com.sailxx.okto.calendar

import android.accounts.Account
import android.content.Context
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.google.android.gms.auth.GoogleAuthUtil
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.Scope
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.sailxx.okto.R
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.OktoTask
import com.sailxx.okto.data.Status
import com.sailxx.okto.widget.OKTO_URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

/**
 * Задачи Okto в Google Календаре: отдельный календарь «Okto» в аккаунте пользователя,
 * одно событие на задачу (повторы — через RRULE). Пишет только приложение, в одну сторону.
 *
 * Доступ — scope calendar.app.created: только к календарям, которые создало само приложение.
 * Разрешение выдаётся один раз в «Настройках виджета», дальше токены Play Services выдаёт молча.
 */
object GoogleCalendar {
    private const val TAG = "GoogleCalendar"
    private const val API = "https://www.googleapis.com/calendar/v3"
    private val SCOPE = Scope("https://www.googleapis.com/auth/calendar.app.created")

    private const val PREFS = "google_calendar"
    private const val K_ENABLED = "enabled"
    private const val K_CALENDAR = "calendarId"
    private const val K_SYNCED = "synced"      // JSON {eventId: hash} — что уже лежит в календаре
    private const val K_NEEDS_AUTH = "needsAuth"

    enum class State { OFF, ON, NEEDS_AUTH }

    private val _state = MutableStateFlow(State.OFF)
    val state: StateFlow<State> = _state.asStateFlow()

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun load(context: Context): State {
        val p = prefs(context)
        _state.value = when {
            !p.getBoolean(K_ENABLED, false) -> State.OFF
            p.getBoolean(K_NEEDS_AUTH, false) -> State.NEEDS_AUTH
            else -> State.ON
        }
        return _state.value
    }

    fun authorizationRequest(): AuthorizationRequest {
        val b = AuthorizationRequest.builder().setRequestedScopes(listOf(SCOPE))
        // Тот же аккаунт, что вошёл в Okto, — иначе при нескольких аккаунтах на телефоне спросит, какой взять
        Firebase.auth.currentUser?.email?.let { b.setAccount(Account(it, "com.google")) }
        return b.build()
    }

    /** Включить после того, как пользователь выдал доступ в «Настройках виджета». */
    fun enable(context: Context) {
        prefs(context).edit().putBoolean(K_ENABLED, true).putBoolean(K_NEEDS_AUTH, false).apply()
        load(context)
        request(context, delayMs = 0)
    }

    /** Выключить и удалить календарь «Okto» вместе со всеми событиями. */
    suspend fun disable(context: Context) {
        val p = prefs(context)
        val calendarId = p.getString(K_CALENDAR, null)
        p.edit().clear().apply()
        load(context)
        WorkManager.getInstance(context).cancelUniqueWork(WORK)
        if (calendarId == null) return
        runCatching {
            val token = token(context) ?: return
            call("DELETE", "$API/calendars/${enc(calendarId)}", token)
        }.onFailure { Log.w(TAG, "calendar delete failed", it) }
    }

    private var lastFingerprint = 0

    /** Задачи изменились (вызывает OktoRepository) — синхронизируем, только если есть что менять. */
    fun onTasks(context: Context, tasks: Collection<OktoTask>) {
        if (_state.value == State.OFF && load(context) == State.OFF) return
        val fp = tasks.filter { !it.deleted && it.date != null }.sortedBy { it.id }.hashCode() + ZoneId.systemDefault().hashCode()
        if (fp == lastFingerprint) return
        lastFingerprint = fp
        request(context)
    }

    /** Поставить синхронизацию в очередь; частые правки склеиваются в одну. */
    fun request(context: Context, delayMs: Long = 5_000) {
        if (!prefs(context).getBoolean(K_ENABLED, false)) return
        val work = OneTimeWorkRequestBuilder<CalendarWorker>()
            .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(WORK, ExistingWorkPolicy.REPLACE, work)
    }

    private const val WORK = "okto-google-calendar"

    private suspend fun token(context: Context): String? {
        val result: AuthorizationResult = Identity.getAuthorizationClient(context).authorize(authorizationRequest()).await()
        if (result.hasResolution()) {
            // Доступ отозван или сменился аккаунт — без пользователя не продолжить
            prefs(context).edit().putBoolean(K_NEEDS_AUTH, true).apply()
            load(context)
            return null
        }
        return result.accessToken
    }

    /** Привести календарь «Okto» в соответствие с задачами. true — готово, false — стоит повторить позже. */
    suspend fun sync(context: Context, tasks: Collection<OktoTask>): Boolean = withContext(Dispatchers.IO) {
        val p = prefs(context)
        if (!p.getBoolean(K_ENABLED, false)) return@withContext true
        val token = token(context) ?: return@withContext true
        try {
            val calendarId = ensureCalendar(context, token)
            val synced = p.getString(K_SYNCED, null)?.let(::JSONObject) ?: JSONObject()
            val zone = ZoneId.systemDefault()
            val untitled = context.getString(R.string.untitled)

            val desired = tasks.filter { !it.deleted && it.date != null }
                .associate { eventId(it.id) to event(it, zone, untitled) }

            for ((id, body) in desired) {
                val hash = hash(body.toString())
                if (synced.optString(id) == hash) continue
                put(calendarId, id, body, token)
                synced.put(id, hash)
                p.edit().putString(K_SYNCED, synced.toString()).apply()
            }
            for (id in synced.keys().asSequence().toList()) {
                if (id in desired) continue
                val code = call("DELETE", "$API/calendars/${enc(calendarId)}/events/$id", token).code
                if (code !in 200..299 && code != 404 && code != 410) error("delete $id: HTTP $code")
                synced.remove(id)
                p.edit().putString(K_SYNCED, synced.toString()).apply()
            }
            true
        } catch (e: HttpError) {
            if (e.code == 401) runCatching { GoogleAuthUtil.clearToken(context, token) }
            Log.w(TAG, "sync failed", e)
            false
        } catch (e: Exception) {
            Log.w(TAG, "sync failed", e)
            false
        }
    }

    private fun ensureCalendar(context: Context, token: String): String {
        val p = prefs(context)
        p.getString(K_CALENDAR, null)?.let { id ->
            val r = call("GET", "$API/calendars/${enc(id)}", token)
            if (r.code in 200..299) return id
            if (r.code != 404) throw HttpError(r.code, r.body)
        }
        // Календаря ещё нет или его удалили в Google Календаре — создаём заново и выкладываем всё с нуля
        val body = JSONObject()
            .put("summary", "Okto")
            .put("description", OKTO_URL)
            .put("timeZone", ZoneId.systemDefault().id)
        val r = call("POST", "$API/calendars", token, body)
        if (r.code !in 200..299) throw HttpError(r.code, r.body)
        val id = JSONObject(r.body).getString("id")
        p.edit().putString(K_CALENDAR, id).remove(K_SYNCED).apply()
        return id
    }

    /** Обновить событие, а если его ещё нет — создать с нашим id. */
    private fun put(calendarId: String, id: String, body: JSONObject, token: String) {
        val base = "$API/calendars/${enc(calendarId)}/events"
        var r = call("PUT", "$base/$id", token, body)
        if (r.code == 404) r = call("POST", base, token, JSONObject(body.toString()).put("id", id))
        if (r.code !in 200..299) throw HttpError(r.code, r.body)
    }

    /** id события Google: только символы base32hex (0-9, a-v) — кодируем id задачи в hex. */
    internal fun eventId(taskId: String): String =
        "okto" + taskId.toByteArray().joinToString("") { "%02x".format(it) }

    internal fun event(task: OktoTask, zone: ZoneId, untitled: String): JSONObject {
        val date = LocalDate.parse(task.date)
        val time = task.start?.let { runCatching { LocalTime.parse(it) }.getOrNull() }
        val done = task.repeat == null && task.done
        val e = JSONObject()
            .put("summary", (if (done) "✓ " else "") + task.title.ifBlank { untitled })
            .put("status", "confirmed")
            .put("transparency", if (task.kind == "call") "opaque" else "transparent")
            // Напоминания уже присылает Okto — не дублируем уведомлениями календаря
            .put("reminders", JSONObject().put("useDefault", false))
            .put("source", JSONObject().put("title", "Okto").put("url", OKTO_URL + "#/tasks"))
            .put("extendedProperties", JSONObject().put("private", JSONObject().put("oktoId", task.id)))
        if (task.link.isNotBlank()) e.put("description", task.link).put("location", task.link)

        if (time != null) {
            val start = LocalDateTime.of(date, time)
            val end = start.plusMinutes(task.duration.takeIf { it > 0 }?.toLong() ?: 30L)
            e.put("start", JSONObject().put("dateTime", start.format(LOCAL)).put("timeZone", zone.id))
            e.put("end", JSONObject().put("dateTime", end.format(LOCAL)).put("timeZone", zone.id))
        } else {
            e.put("start", JSONObject().put("date", date.toString()))
            e.put("end", JSONObject().put("date", date.plusDays(1).toString()))
        }
        recurrence(task, date, time, zone)?.let { e.put("recurrence", it) }
        return e
    }

    /** Повторы Okto → RRULE. Пропущенные дни — EXDATE. */
    internal fun recurrence(task: OktoTask, date: LocalDate, time: LocalTime?, zone: ZoneId): JSONArray? {
        val r = task.repeat ?: return null
        val rule = StringBuilder("RRULE:")
        rule.append(
            when (r.freq) {
                "day" -> "FREQ=DAILY;INTERVAL=${r.interval}"
                "weekday" -> "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
                "week" -> "FREQ=WEEKLY;INTERVAL=${r.interval}"
                // 29–31 число: в коротком месяце Okto берёт последний день — так же делает BYSETPOS
                else -> "FREQ=MONTHLY;INTERVAL=${r.interval}" +
                    if (date.dayOfMonth > 28) ";BYMONTHDAY=${date.dayOfMonth},-1;BYSETPOS=1" else ""
            }
        )
        r.until?.let { until ->
            val u = LocalDate.parse(until)
            rule.append(";UNTIL=")
            rule.append(
                if (time == null) u.format(BASIC_DATE)
                else u.atTime(23, 59, 59).atZone(zone).withZoneSameInstant(ZoneOffset.UTC).format(UTC)
            )
        }
        val out = JSONArray().put(rule.toString())
        val skips = task.skipDates.sorted().map(LocalDate::parse)
        if (skips.isNotEmpty()) {
            out.put(
                if (time == null) "EXDATE;VALUE=DATE:" + skips.joinToString(",") { it.format(BASIC_DATE) }
                else "EXDATE;TZID=${zone.id}:" + skips.joinToString(",") { it.atTime(time).format(BASIC_LOCAL) }
            )
        }
        return out
    }

    private val LOCAL = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
    private val BASIC_DATE = DateTimeFormatter.ofPattern("yyyyMMdd")
    private val BASIC_LOCAL = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss")
    private val UTC = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")

    private fun hash(s: String): String =
        MessageDigest.getInstance("SHA-1").digest(s.toByteArray()).joinToString("") { "%02x".format(it) }

    private fun enc(s: String) = URLEncoder.encode(s, "UTF-8")

    private class Response(val code: Int, val body: String)
    private class HttpError(val code: Int, body: String) : Exception("HTTP $code: ${body.take(300)}")

    private fun call(method: String, url: String, token: String, body: JSONObject? = null): Response {
        val c = URL(url).openConnection() as HttpURLConnection
        try {
            c.requestMethod = method
            c.connectTimeout = 15_000
            c.readTimeout = 20_000
            c.setRequestProperty("Authorization", "Bearer $token")
            if (body != null) {
                c.doOutput = true
                c.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                c.outputStream.use { it.write(body.toString().toByteArray()) }
            }
            val code = c.responseCode
            val text = (if (code < 400) c.inputStream else c.errorStream)?.bufferedReader()?.use { it.readText() } ?: ""
            if (code == 401) throw HttpError(code, text)
            return Response(code, text)
        } finally {
            c.disconnect()
        }
    }
}

class CalendarWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val ctx = applicationContext
        if (OktoRepository.state.value.status != Status.READY) OktoRepository.refresh(ctx)
        // Без входа или офлайн-кэш пуст — не трогаем календарь, чтобы не стереть события
        if (OktoRepository.state.value.status != Status.READY) return Result.success()
        val tasks = OktoRepository.tasks()
        if (tasks.isEmpty() && OktoRepository.state.value.offline) return Result.retry()
        return if (GoogleCalendar.sync(ctx, tasks)) Result.success() else Result.retry()
    }
}
