package com.sailxx.okto.data

import android.content.Context
import android.util.Log
import androidx.compose.ui.graphics.Color
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.firestore
import com.sailxx.okto.R
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.tasks.await
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID

enum class Status { LOADING, SIGNED_OUT, READY }

data class WidgetItem(
    val taskId: String,
    val occurrence: String?,   // дата повтора — только для повторяющихся задач
    val date: String,
    val start: String?,
    val title: String,
    val meta: String,
    val overdue: Boolean,
    val done: Boolean,
    val color: Color?,
    val priority: Int,
)

data class WidgetState(
    val status: Status,
    val palette: OktoPalette,
    val items: List<WidgetItem> = emptyList(),
    val doneToday: Int = 0,
    val totalToday: Int = 0,
    val offline: Boolean = false,
    val email: String? = null,
)

/**
 * Единый источник данных для виджета и приложения.
 * Читает/пишет те же документы Firestore, что и веб-Okto, поэтому всё синхронизируется в обе стороны.
 * Firestore на Android кэширует данные на диске, так что виджет работает и офлайн.
 */
object OktoRepository {
    private const val TAG = "OktoRepository"

    private val _state = MutableStateFlow(WidgetState(Status.LOADING, OktoPalettes.DARK))
    val state: StateFlow<WidgetState> = _state.asStateFlow()

    private val mutex = Mutex()
    private val liveScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var tasks = mutableMapOf<String, OktoTask>()
    private var listColors = emptyMap<String, Color>()
    private var firstListId = ""
    private var themeName: String? = null
    private var syncedAt = 0L

    private fun userRef(): DocumentReference? =
        Firebase.auth.currentUser?.let { Firebase.firestore.collection("users").document(it.uid) }

    suspend fun refreshIfStale(context: Context, maxAgeMs: Long = 60_000) {
        if (_state.value.status == Status.READY && System.currentTimeMillis() - syncedAt < maxAgeMs) return
        refresh(context)
    }

    suspend fun refresh(context: Context) = mutex.withLock {
        val ref = userRef()
        if (ref == null) {
            tasks.clear()
            _state.value = WidgetState(Status.SIGNED_OUT, OktoPalettes.forTheme(context, themeName))
            return@withLock
        }
        var offline = false
        try {
            coroutineScope {
                val t = async { ref.collection("tasks").whereEqualTo("deleted", false).get().await() }
                val l = async { ref.collection("lists").get().await() }
                val s = async { ref.collection("settings").document("main").get().await() }

                val taskSnap = t.await()
                tasks = taskSnap.documents.mapNotNull(OktoTask::fromDoc).associateBy { it.id }.toMutableMap()
                offline = taskSnap.metadata.isFromCache

                val lists = l.await().documents
                    .filter { it.getBoolean("deleted") != true }
                    .sortedBy { it.getLong("order") ?: 0L }
                listColors = lists.mapNotNull { d -> OktoPalettes.parseHex(d.getString("color"))?.let { d.id to it } }.toMap()
                firstListId = lists.firstOrNull()?.id ?: ""

                themeName = s.await().getString("theme")
            }
            syncedAt = System.currentTimeMillis()
        } catch (e: Exception) {
            Log.w(TAG, "refresh failed", e)
            offline = true
        }
        publish(context, offline)
    }

    /**
     * Живая подписка на Firestore, пока открыт Okto: правки с сайта сразу попадают в виджет.
     * [onChange] вызывается после каждого обновления состояния.
     */
    fun listen(context: Context, onChange: suspend () -> Unit): List<ListenerRegistration> {
        val ref = userRef() ?: return emptyList()
        val app = context.applicationContext
        val tasksReg = ref.collection("tasks").whereEqualTo("deleted", false)
            .addSnapshotListener { snap, e ->
                if (snap == null) {
                    Log.w(TAG, "tasks listener failed", e)
                    return@addSnapshotListener
                }
                liveScope.launch {
                    mutex.withLock {
                        tasks = snap.documents.mapNotNull(OktoTask::fromDoc).associateBy { it.id }.toMutableMap()
                        syncedAt = System.currentTimeMillis()
                        publish(app, snap.metadata.isFromCache)
                    }
                    onChange()
                }
            }
        val settingsReg = ref.collection("settings").document("main")
            .addSnapshotListener { snap, _ ->
                val theme = snap?.getString("theme") ?: return@addSnapshotListener
                liveScope.launch {
                    mutex.withLock {
                        if (theme == themeName) return@launch
                        themeName = theme
                        publish(app)
                    }
                    onChange()
                }
            }
        return listOf(tasksReg, settingsReg)
    }

    /** Отметить/снять отметку. Для повторяющейся задачи — только конкретный день, как в Okto. */
    suspend fun toggle(context: Context, taskId: String, occurrence: String?) {
        val ref = userRef() ?: return
        val now = System.currentTimeMillis()
        val patch: Map<String, Any?> = mutex.withLock {
            val task = tasks[taskId] ?: return
            val p = if (task.repeat != null && occurrence != null) {
                val nowDone = occurrence !in task.doneDates
                tasks[taskId] = task.copy(
                    doneDates = if (nowDone) task.doneDates + occurrence else task.doneDates - occurrence,
                )
                mapOf(
                    "doneDates" to if (nowDone) FieldValue.arrayUnion(occurrence) else FieldValue.arrayRemove(occurrence),
                    "updatedAt" to now,
                )
            } else {
                val nowDone = !task.done
                tasks[taskId] = task.copy(done = nowDone)
                mapOf("done" to nowDone, "doneAt" to if (nowDone) now else null, "updatedAt" to now)
            }
            publish(context)
            p
        }
        // Не ждём ответа сервера: офлайн запись уйдёт, когда появится сеть.
        ref.collection("tasks").document(taskId).update(patch)
            .addOnFailureListener { Log.w(TAG, "toggle failed", it) }
    }

    /** Новая задача в первом списке пользователя — с теми же полями, что создаёт веб-Okto. */
    suspend fun addTask(context: Context, title: String, date: String?): Boolean {
        val ref = userRef() ?: return false
        val now = System.currentTimeMillis()
        val id = UUID.randomUUID().toString().replace("-", "").take(16)
        val data = hashMapOf<String, Any?>(
            "id" to id,
            "title" to title.trim().take(200),
            "note" to "",
            "listId" to firstListId,
            "priority" to 0,
            "color" to null,
            "kind" to "task",
            "link" to "",
            "date" to date,
            "start" to null,
            "duration" to 30,
            "subtasks" to emptyList<Any>(),
            "attachments" to emptyList<Any>(),
            "repeat" to null,
            "reminder" to null,
            "done" to false,
            "doneAt" to null,
            "doneDates" to emptyList<String>(),
            "skipDates" to emptyList<String>(),
            "focusMinutes" to 0,
            "createdAt" to now,
            "updatedAt" to now,
            "deleted" to false,
        )
        ref.collection("tasks").document(id).set(data)
            .addOnFailureListener { Log.w(TAG, "add failed", it) }
        mutex.withLock {
            tasks[id] = OktoTask.fromMap(id, data)
            publish(context)
        }
        return true
    }

    /** Собирает список для виджета: задачи на сегодня + просроченные, выполненные — внизу. */
    private fun publish(context: Context, offline: Boolean = _state.value.offline) {
        val today = LocalDate.now()
        val t = today.toString()
        val items = mutableListOf<WidgetItem>()
        var done = 0
        var total = 0
        for (task in tasks.values) {
            val date = task.date ?: continue
            if (task.deleted) continue
            when {
                task.repeat != null -> {
                    if (!task.occursOn(t)) continue
                    val d = task.isDoneOn(t)
                    total++; if (d) done++
                    items += item(context, task, t, t, d, today)
                }
                date == t -> {
                    total++; if (task.done) done++
                    items += item(context, task, null, t, task.done, today)
                }
                date < t && !task.done -> items += item(context, task, null, date, false, today)
            }
        }
        items.sortWith(
            compareBy<WidgetItem>({ it.done }, { it.date }, { it.start ?: "99:99" }, { -it.priority }, { it.title.lowercase() })
        )
        _state.value = WidgetState(
            status = Status.READY,
            palette = OktoPalettes.forTheme(context, themeName),
            items = items,
            doneToday = done,
            totalToday = total,
            offline = offline,
            email = Firebase.auth.currentUser?.email,
        )
    }

    private fun item(context: Context, task: OktoTask, occurrence: String?, date: String, done: Boolean, today: LocalDate) =
        WidgetItem(
            taskId = task.id,
            occurrence = occurrence,
            date = date,
            start = task.start,
            title = task.title.ifBlank { context.getString(R.string.untitled) },
            meta = metaLabel(context, task, date, today),
            overdue = !done && date < today.toString(),
            done = done,
            color = OktoPalettes.parseHex(task.color) ?: listColors[task.listId],
            priority = task.priority,
        )

    /** «СЕГОДНЯ · 12:00», «ВЧЕРА», «3 ОКТ. · ЗВОНОК 14:00–14:30 · ↻» — моно-подписи как в Okto. */
    private fun metaLabel(context: Context, task: OktoTask, date: String, today: LocalDate): String {
        val d = LocalDate.parse(date)
        val parts = mutableListOf(
            when (ChronoUnit.DAYS.between(d, today)) {
                0L -> context.getString(R.string.today)
                1L -> context.getString(R.string.yesterday)
                else -> d.format(DateTimeFormatter.ofPattern("d MMM", Locale.getDefault()))
            }
        )
        val start = task.start
        if (task.kind == "call") {
            parts += context.getString(R.string.call) +
                (start?.let { " $it–${endTime(it, task.duration)}" } ?: "")
        } else if (start != null) {
            parts += start
        }
        if (task.repeat != null) parts += "↻"
        if (task.priority > 0) parts += "!".repeat(task.priority)
        return parts.joinToString(" · ").uppercase()
    }

    private fun endTime(start: String, minutes: Int): String = runCatching {
        LocalTime.parse(start).plusMinutes(minutes.toLong()).format(DateTimeFormatter.ofPattern("HH:mm"))
    }.getOrDefault("")
}
