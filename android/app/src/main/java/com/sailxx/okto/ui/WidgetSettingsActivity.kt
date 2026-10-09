package com.sailxx.okto.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.appwidget.GlanceAppWidgetManager
import com.google.android.gms.auth.api.identity.Identity
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.sailxx.okto.R
import com.sailxx.okto.calendar.GoogleCalendar
import com.sailxx.okto.data.AppIcon
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.WidgetItem
import com.sailxx.okto.data.WidgetText
import com.sailxx.okto.data.WidgetTextStore
import com.sailxx.okto.data.signInWithGoogle
import com.sailxx.okto.data.signOut
import com.sailxx.okto.widget.oktoIntent
import com.sailxx.okto.widget.updateOktoWidgets
import com.sailxx.okto.widget.OktoWidgetReceiver
import com.sailxx.okto.widget.SyncWorker
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class WidgetSettingsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        SyncWorker.schedule(this)
        setContent { MainScreen(this) }
    }
}

@Composable
private fun MainScreen(activity: ComponentActivity) {
    val ctx = LocalContext.current
    val state by OktoRepository.state.collectAsState()
    val p = state.palette
    val scope = rememberCoroutineScope()
    var signedIn by remember { mutableStateOf(Firebase.auth.currentUser != null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    suspend fun sync() {
        OktoRepository.refresh(ctx)
        updateOktoWidgets(ctx)
    }
    LaunchedEffect(signedIn) { sync() }

    Column(
        Modifier
            .fillMaxSize()
            .background(p.bg)
            .systemBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(9.dp).clip(CircleShape).background(p.ink))
            Spacer(Modifier.width(8.dp))
            BasicText("okto", style = TextStyle(color = p.ink, fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace))
        }
        Spacer(Modifier.height(28.dp))
        BasicText(ctx.getString(R.string.app_title), style = TextStyle(color = p.ink, fontSize = 34.sp, fontWeight = FontWeight.Bold))
        Spacer(Modifier.height(4.dp))
        MonoLabel(state.email ?: ctx.getString(R.string.not_signed_in), p.muted)
        Spacer(Modifier.height(20.dp))

        // Та же карточка, что на главной Okto
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(p.well)
                .padding(14.dp),
        ) {
            MonoLabel(ctx.getString(R.string.tasks_today), p.wellDim)
            BasicText(
                "%02d/%02d".format(state.doneToday, state.totalToday),
                style = TextStyle(color = p.wellInk, fontSize = 52.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace),
            )
        }
        Spacer(Modifier.height(20.dp))

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            if (!signedIn) {
                OktoKeyWide(ctx.getString(R.string.sign_in_google), p, primary = true, enabled = !busy) {
                    scope.launch {
                        busy = true
                        error = runCatching { signInWithGoogle(activity) }.exceptionOrNull()?.localizedMessage
                        signedIn = Firebase.auth.currentUser != null
                        busy = false
                    }
                }
                BasicText(ctx.getString(R.string.sign_in_explain), style = TextStyle(color = p.muted, fontSize = 13.sp))
            } else {
                OktoKeyWide(ctx.getString(R.string.pin_widget), p, primary = true) {
                    scope.launch {
                        GlanceAppWidgetManager(ctx).requestPinGlanceAppWidget(OktoWidgetReceiver::class.java)
                    }
                }
                OktoKeyWide(ctx.getString(R.string.sync_now), p, enabled = !busy) {
                    scope.launch { busy = true; sync(); busy = false }
                }
                CalendarKey(activity, p)
                OktoKeyWide(ctx.getString(R.string.open_okto), p) {
                    ctx.startActivity(oktoIntent(ctx))
                }
                OktoKeyWide(ctx.getString(R.string.sign_out), p) {
                    signOut()
                    signedIn = false
                }
            }
            error?.let { BasicText(it, style = TextStyle(color = p.red, fontSize = 13.sp)) }
        }
        Spacer(Modifier.height(28.dp))
        TextSizePicker(p, state.items.firstOrNull())
        Spacer(Modifier.height(28.dp))
        IconPicker(p)
    }
}

/** Задачи в Google Календаре: включение просит доступ к календарю, выключение удаляет календарь «Okto». */
@Composable
private fun CalendarKey(activity: ComponentActivity, p: OktoPalette) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) { GoogleCalendar.load(ctx) }
    val state by GoogleCalendar.state.collectAsState()
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val consent = rememberLauncherForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
        busy = false
        runCatching { Identity.getAuthorizationClient(activity).getAuthorizationResultFromIntent(result.data) }
            .onSuccess { GoogleCalendar.enable(ctx) }
            .onFailure { error = ctx.getString(R.string.calendar_denied) }
    }

    val label = ctx.getString(
        when (state) {
            GoogleCalendar.State.OFF -> R.string.calendar_on
            GoogleCalendar.State.ON -> R.string.calendar_off
            GoogleCalendar.State.NEEDS_AUTH -> R.string.calendar_reauth
        }
    )
    OktoKeyWide(label, p, primary = state == GoogleCalendar.State.NEEDS_AUTH, enabled = !busy) {
        error = null
        scope.launch {
            busy = true
            if (state == GoogleCalendar.State.ON) {
                GoogleCalendar.disable(ctx)
                busy = false
                return@launch
            }
            runCatching { Identity.getAuthorizationClient(activity).authorize(GoogleCalendar.authorizationRequest()).await() }
                .onSuccess { r ->
                    val pending = r.pendingIntent
                    if (r.hasResolution() && pending != null) {
                        consent.launch(IntentSenderRequest.Builder(pending.intentSender).build())
                        return@launch
                    }
                    GoogleCalendar.enable(ctx)
                }
                .onFailure { error = it.localizedMessage }
            busy = false
        }
    }
    BasicText(
        ctx.getString(if (state == GoogleCalendar.State.OFF) R.string.calendar_explain else R.string.calendar_explain_on),
        style = TextStyle(color = p.muted, fontSize = 13.sp),
    )
    error?.let { BasicText(it, style = TextStyle(color = p.red, fontSize = 13.sp)) }
}

/** Размеры текста виджетов: превью, пресеты и пошаговая настройка по 1 sp. */
@Composable
private fun TextSizePicker(p: OktoPalette, sample: WidgetItem?) {
    val ctx = LocalContext.current
    val stored by WidgetTextStore.state.collectAsState()
    val t = stored ?: WidgetTextStore.load(ctx)
    val fontScale = LocalDensity.current.fontScale
    fun set(v: WidgetText) = WidgetTextStore.save(ctx, v)

    // Виджеты перерисовываются, когда размер перестал меняться, а не на каждый тап
    LaunchedEffect(t) {
        delay(400)
        updateOktoWidgets(ctx)
    }

    MonoLabel(ctx.getString(R.string.text_size), p.muted)
    Spacer(Modifier.height(10.dp))

    // Превью: колодец со счётчиком и одна задача-карточка, как в виджете
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(p.bg).border(1.dp, p.line, RoundedCornerShape(24.dp)).padding(10.dp),
    ) {
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(p.well).padding(12.dp)) {
            MonoLabel(ctx.getString(R.string.tasks_today), p.wellDim)
            BasicText(
                "03/07",
                style = TextStyle(color = p.wellInk, fontSize = t.sp(t.counter, fontScale).sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace),
            )
        }
        Spacer(Modifier.height(8.dp))
        val tint = sample?.color ?: SampleColor
        Row(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(lerp(p.bg, tint, if (p.isDark) 0.24f else 0.16f))
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val check = (t.title * 1.45f).coerceIn(22f, 40f).dp
            Box(Modifier.size(check).border(2.dp, tint, CircleShape))
            Spacer(Modifier.width(12.dp))
            Column {
                BasicText(
                    sample?.title ?: ctx.getString(R.string.text_sample_title),
                    maxLines = 2,
                    style = TextStyle(color = p.ink, fontSize = t.sp(t.title, fontScale).sp, fontWeight = FontWeight.Medium),
                )
                BasicText(
                    sample?.meta ?: ctx.getString(R.string.text_sample_meta),
                    maxLines = 1,
                    style = TextStyle(color = p.muted, fontSize = t.sp(t.meta, fontScale).sp, fontFamily = FontFamily.Monospace),
                )
            }
        }
    }
    Spacer(Modifier.height(12.dp))

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        WidgetText.PRESETS.forEach { (name, preset) ->
            val selected = t.title == preset.title && t.meta == preset.meta && t.counter == preset.counter
            OktoKey(name, p, Modifier.weight(1f), primary = selected) { set(preset.copy(fixed = t.fixed)) }
        }
    }
    Spacer(Modifier.height(6.dp))
    SizeStepper(ctx.getString(R.string.text_title), t.title, WidgetText.TITLE, p) { set(t.copy(title = it)) }
    SizeStepper(ctx.getString(R.string.text_meta), t.meta, WidgetText.META, p) { set(t.copy(meta = it)) }
    SizeStepper(ctx.getString(R.string.text_counter), t.counter, WidgetText.COUNTER, p) { set(t.copy(counter = it)) }
    Spacer(Modifier.height(6.dp))
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable { set(t.copy(fixed = !t.fixed)) }.padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicText(ctx.getString(R.string.text_fixed), Modifier.weight(1f), style = TextStyle(color = p.ink, fontSize = 15.sp))
        Spacer(Modifier.width(12.dp))
        Switch(t.fixed, p)
    }
    BasicText(ctx.getString(R.string.text_fixed_hint), style = TextStyle(color = p.muted, fontSize = 13.sp))
}

@Composable
private fun SizeStepper(label: String, value: Int, range: IntRange, p: OktoPalette, onChange: (Int) -> Unit) {
    val ctx = LocalContext.current
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        BasicText(label, Modifier.weight(1f), style = TextStyle(color = p.ink, fontSize = 15.sp))
        StepKey("−", ctx.getString(R.string.decrease), p, enabled = value > range.first) { onChange(value - 1) }
        BasicText(
            "$value",
            Modifier.width(56.dp),
            style = TextStyle(color = p.ink, fontSize = 17.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, textAlign = TextAlign.Center),
        )
        StepKey("+", ctx.getString(R.string.increase), p, enabled = value < range.last) { onChange(value + 1) }
    }
}

@Composable
private fun StepKey(text: String, description: String, p: OktoPalette, enabled: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(10.dp)
    Box(
        Modifier
            .size(44.dp)
            .clip(shape)
            .background(p.key)
            .border(1.dp, p.line, shape)
            .clickable(enabled = enabled, onClickLabel = description, onClick = onClick)
            .semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) {
        BasicText(text, style = TextStyle(color = p.keyInk.copy(alpha = if (enabled) 1f else 0.35f), fontSize = 20.sp, fontWeight = FontWeight.Medium))
    }
}

@Composable
private fun Switch(on: Boolean, p: OktoPalette) {
    Box(
        Modifier.size(width = 46.dp, height = 28.dp).clip(CircleShape).background(if (on) p.accent else p.line).padding(3.dp),
        contentAlignment = if (on) Alignment.CenterEnd else Alignment.CenterStart,
    ) {
        Box(Modifier.size(22.dp).clip(CircleShape).background(if (on) p.onAccent else p.bg))
    }
}

/** Цвет превью, когда задач ещё нет. */
private val SampleColor = Color(0xFF4A8FE0)

@Composable
private fun IconPicker(p: OktoPalette) {
    val ctx = LocalContext.current
    var icon by remember { mutableStateOf(AppIcon.current(ctx)) }
    MonoLabel(ctx.getString(R.string.app_icon), p.muted)
    Spacer(Modifier.height(10.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        AppIcon.entries.forEach { option ->
            val selected = option == icon
            Column(
                Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .border(2.dp, if (selected) p.ink else p.line, RoundedCornerShape(16.dp))
                    .clickable(enabled = !selected) {
                        AppIcon.set(ctx, option)
                        icon = option
                    }
                    .padding(horizontal = 18.dp, vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Image(
                    painterResource(option.preview),
                    contentDescription = null,
                    Modifier.size(64.dp).clip(CircleShape).background(IconBg),
                )
                Spacer(Modifier.height(8.dp))
                BasicText(ctx.getString(option.label), style = TextStyle(color = p.ink, fontSize = 14.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal))
            }
        }
    }
    Spacer(Modifier.height(8.dp))
    BasicText(ctx.getString(R.string.icon_hint), style = TextStyle(color = p.muted, fontSize = 13.sp))
}

/** Фон значка, как @color/icon_bg */
private val IconBg = Color(0xFF17181B)
