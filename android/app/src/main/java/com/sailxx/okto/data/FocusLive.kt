package com.sailxx.okto.data

import android.content.Context
import android.util.Log
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Source
import com.google.firebase.firestore.firestore
import com.sailxx.okto.notify.FocusAlarm
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.tasks.await

enum class FocusMode { POMO, TIMER, STOPWATCH }

data class PomoClock(val phase: String, val round: Int, val remaining: Long?, val endsAt: Long?)
data class TimerClock(val duration: Long, val endsAt: Long?, val remaining: Long?)
data class StopwatchClock(val elapsed: Long, val startedAt: Long?)
data class PomoCfg(val work: Int, val short: Int, val long: Int, val every: Int) {
    fun minutes(phase: String) = when (phase) { "short" -> short; "long" -> long; else -> work }
}

/** Сессия фокуса, которую записывает виджет, когда первым замечает конец фазы «Фокус». */
data class FocusSession(val id: String, val start: Long, val minutes: Int)

/**
 * Помодоро, таймер и секундомер — те же, что на сайте: документ users/{uid}/live/focus.
 * Время хранится абсолютным (endsAt/startedAt, мс), поэтому часы идут сами и совпадают на всех устройствах.
 * Логика повторяет store.svelte.ts (pomoStart/pomoAdvance/timerStart/…), новое состояние побеждает по updatedAt.
 */
data class FocusLive(
    val pomo: PomoClock,
    val timer: TimerClock,
    val stopwatch: StopwatchClock,
    val cfg: PomoCfg,
    val updatedAt: Long,
) {
    fun pomoTotal(phase: String = pomo.phase) = cfg.minutes(phase) * 60_000L
    fun pomoLeft(now: Long) = pomo.endsAt?.let { it - now } ?: pomo.remaining ?: pomoTotal()
    fun timerLeft(now: Long) = timer.endsAt?.let { it - now } ?: timer.remaining ?: timer.duration
    fun swAt(now: Long) = stopwatch.elapsed + (stopwatch.startedAt?.let { (now - it).coerceAtLeast(0) } ?: 0)

    fun running(mode: FocusMode) = when (mode) {
        FocusMode.POMO -> pomo.endsAt != null
        FocusMode.TIMER -> timer.endsAt != null
        FocusMode.STOPWATCH -> stopwatch.startedAt != null
    }

    /** Время вышло, а сайт ещё не перевёл фазу или не сбросил таймер. */
    fun ended(mode: FocusMode, now: Long) = when (mode) {
        FocusMode.POMO -> pomo.endsAt?.let { it <= now } == true
        FocusMode.TIMER -> timer.endsAt?.let { it <= now } == true
        FocusMode.STOPWATCH -> false
    }

    /** Есть что сбрасывать. */
    fun started(mode: FocusMode) = when (mode) {
        FocusMode.POMO -> pomo.endsAt != null || pomo.remaining != null
        FocusMode.TIMER -> timer.endsAt != null || timer.remaining != null
        FocusMode.STOPWATCH -> stopwatch.startedAt != null || stopwatch.elapsed > 0
    }

    private fun stamp(now: Long) = maxOf(now, updatedAt + 1)

    fun toggle(mode: FocusMode, now: Long): FocusLive = when (mode) {
        FocusMode.POMO -> if (pomo.endsAt != null) {
            copy(pomo = pomo.copy(remaining = (pomo.endsAt - now).coerceAtLeast(0), endsAt = null), updatedAt = stamp(now))
        } else {
            copy(pomo = pomo.copy(endsAt = now + pomoLeft(now), remaining = null), updatedAt = stamp(now))
        }
        FocusMode.TIMER -> if (timer.endsAt != null) {
            copy(timer = timer.copy(remaining = (timer.endsAt - now).coerceAtLeast(0), endsAt = null), updatedAt = stamp(now))
        } else {
            val left = timerLeft(now).takeIf { it > 0 } ?: timer.duration
            copy(timer = timer.copy(endsAt = now + left, remaining = null), updatedAt = stamp(now))
        }
        FocusMode.STOPWATCH -> if (stopwatch.startedAt != null) {
            copy(stopwatch = StopwatchClock(swAt(now), null), updatedAt = stamp(now))
        } else {
            copy(stopwatch = stopwatch.copy(startedAt = now), updatedAt = stamp(now))
        }
    }

    fun reset(mode: FocusMode, now: Long): FocusLive = when (mode) {
        FocusMode.POMO -> copy(pomo = pomo.copy(endsAt = null, remaining = null), updatedAt = stamp(now))
        FocusMode.TIMER -> copy(timer = timer.copy(endsAt = null, remaining = null), updatedAt = stamp(now))
        FocusMode.STOPWATCH -> copy(stopwatch = StopwatchClock(0, null), updatedAt = stamp(now))
    }

    fun addMinute(now: Long): FocusLive {
        val t = if (timer.endsAt != null) timer.copy(endsAt = timer.endsAt + 60_000) else timer.copy(remaining = timerLeft(now).coerceAtLeast(0) + 60_000)
        val left = t.endsAt?.let { it - now } ?: t.remaining ?: t.duration
        return copy(timer = t.copy(duration = minOf(24 * 3_600_000L, maxOf(t.duration, left))), updatedAt = stamp(now))
    }

    /** Минус минута, но не меньше минуты. Не запущенный таймер укорачивает саму длительность. */
    fun subMinute(now: Long): FocusLive {
        val t = when {
            timer.endsAt != null -> timer.copy(endsAt = maxOf(timer.endsAt - 60_000, minOf(timer.endsAt, now + 60_000)))
            timer.remaining != null -> timer.copy(remaining = maxOf(timer.remaining - 60_000, minOf(timer.remaining, 60_000)))
            else -> timer.copy(duration = maxOf(timer.duration - 60_000, minOf(timer.duration, 60_000)))
        }
        return copy(timer = t, updatedAt = stamp(now))
    }

    /** Пресет: новый таймер на [minutes] мин, ещё не запущен. */
    fun setTimer(minutes: Int, now: Long): FocusLive =
        copy(timer = TimerClock(minutes.coerceIn(1, 24 * 60) * 60_000L, null, null), updatedAt = stamp(now))

    /**
     * Следующая фаза помодоро. [natural] — фаза дошла до конца: тогда законченный «Фокус» даёт сессию
     * с id по endsAt — его же выберет сайт, так что сессия не задвоится. Автостарт следующей фазы — только на сайте.
     */
    fun advance(now: Long, natural: Boolean): Pair<FocusLive, FocusSession?> {
        val finished = pomo.phase
        val session = if (natural && finished == "work" && pomo.endsAt != null) {
            FocusSession("pomo-${pomo.endsAt}", pomo.endsAt - cfg.work * 60_000L, cfg.work)
        } else null
        val next = if (finished == "work") {
            pomo.copy(phase = if (pomo.round % cfg.every == 0) "long" else "short", remaining = null, endsAt = null)
        } else {
            pomo.copy(phase = "work", round = if (finished == "long") 1 else pomo.round + 1, remaining = null, endsAt = null)
        }
        return copy(pomo = next, updatedAt = stamp(now)) to session
    }

    fun toMap(): Map<String, Any?> = mapOf(
        "pomo" to mapOf("phase" to pomo.phase, "round" to pomo.round, "remaining" to pomo.remaining, "endsAt" to pomo.endsAt),
        "timer" to mapOf("duration" to timer.duration, "endsAt" to timer.endsAt, "remaining" to timer.remaining),
        "stopwatch" to mapOf("elapsed" to stopwatch.elapsed, "startedAt" to stopwatch.startedAt),
        "cfg" to mapOf("work" to cfg.work, "short" to cfg.short, "long" to cfg.long, "every" to cfg.every),
        "updatedAt" to updatedAt,
    )

    companion object {
        val DEFAULT = FocusLive(
            PomoClock("work", 1, null, null), TimerClock(5 * 60_000L, null, null), StopwatchClock(0, null),
            PomoCfg(25, 5, 15, 4), 0,
        )

        private fun long(v: Any?): Long? = (v as? Number)?.toLong()?.takeIf { it >= 0 }
        private fun int(v: Any?, min: Int, max: Int, def: Int) = (v as? Number)?.toInt()?.takeIf { it in min..max } ?: def

        fun fromMap(m: Map<String, Any?>?): FocusLive? {
            if (m == null) return null
            val p = m["pomo"] as? Map<*, *> ?: return null
            val t = m["timer"] as? Map<*, *> ?: return null
            val s = m["stopwatch"] as? Map<*, *> ?: return null
            val c = m["cfg"] as? Map<*, *>
            val phase = (p["phase"] as? String)?.takeIf { it in setOf("work", "short", "long") } ?: return null
            return FocusLive(
                PomoClock(phase, int(p["round"], 1, 12, 1), long(p["remaining"]), long(p["endsAt"])),
                TimerClock(long(t["duration"])?.takeIf { it >= 1000 } ?: DEFAULT.timer.duration, long(t["endsAt"]), long(t["remaining"])),
                StopwatchClock(long(s["elapsed"]) ?: 0, long(s["startedAt"])),
                PomoCfg(int(c?.get("work"), 1, 600, 25), int(c?.get("short"), 1, 600, 5), int(c?.get("long"), 1, 600, 15), int(c?.get("every"), 1, 12, 4)),
                long(m["updatedAt"]) ?: 0,
            )
        }
    }
}

object FocusRepository {
    private const val TAG = "FocusRepository"
    private val _state = MutableStateFlow<FocusLive?>(null)
    /** null — ещё не загружено. */
    val state: StateFlow<FocusLive?> = _state.asStateFlow()
    private val mutex = Mutex()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private fun userRef(): DocumentReference? =
        Firebase.auth.currentUser?.let { Firebase.firestore.collection("users").document(it.uid) }

    private fun liveRef() = userRef()?.collection("live")?.document("focus")

    /** Свежий документ с сервера, без сети — из кэша Firestore. */
    suspend fun refresh(context: Context): FocusLive? = mutex.withLock {
        val ref = liveRef() ?: return@withLock null.also { _state.value = null }
        val snap = runCatching { ref.get().await() }.getOrNull() ?: runCatching { ref.get(Source.CACHE).await() }.getOrNull()
        val live = FocusLive.fromMap(snap?.data) ?: _state.value ?: FocusLive.DEFAULT
        accept(context, live)
        live
    }

    /** Подписка, пока открыт Okto: старт и пауза на сайте сразу видны в виджете. */
    fun listen(context: Context, onChange: suspend () -> Unit): ListenerRegistration? {
        val app = context.applicationContext
        return liveRef()?.addSnapshotListener { snap, e ->
            val live = FocusLive.fromMap(snap?.data)
            if (live == null) {
                if (e != null) Log.w(TAG, "live listener failed", e)
                return@addSnapshotListener
            }
            scope.launch {
                mutex.withLock { accept(app, live) }
                onChange()
            }
        }
    }

    private fun accept(context: Context, live: FocusLive) {
        val cur = _state.value
        if (cur != null && cur.updatedAt > live.updatedAt) return
        _state.value = live
        FocusAlarm.schedule(context, live)
    }

    /** Действие из виджета: сразу меняет состояние на экране, запись уходит в Firestore (офлайн — из очереди). */
    suspend fun update(context: Context, change: (FocusLive, Long) -> Pair<FocusLive, FocusSession?>) {
        val app = context.applicationContext
        val ref = liveRef() ?: return
        val cur = _state.value ?: refresh(app) ?: return
        val (next, session) = mutex.withLock { change(_state.value ?: cur, System.currentTimeMillis()) }
        mutex.withLock { accept(app, next) }
        ref.set(next.toMap()).addOnFailureListener { Log.w(TAG, "live write failed", it) }
        if (session != null) {
            userRef()?.collection("sessions")?.document(session.id)?.set(
                mapOf(
                    "id" to session.id, "start" to session.start, "minutes" to session.minutes, "taskId" to null,
                    "updatedAt" to System.currentTimeMillis(), "deleted" to false,
                ),
            )?.addOnFailureListener { Log.w(TAG, "session write failed", it) }
        }
    }
}
