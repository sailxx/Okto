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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import com.google.android.gms.auth.api.identity.Identity
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.sailxx.okto.R
import com.sailxx.okto.calendar.GoogleCalendar
import com.sailxx.okto.data.AppIcon
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.data.signInWithGoogle
import com.sailxx.okto.data.signOut
import com.sailxx.okto.widget.oktoIntent
import com.sailxx.okto.widget.OktoTasksWidget
import com.sailxx.okto.widget.OktoWidgetReceiver
import com.sailxx.okto.widget.SyncWorker
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
        OktoTasksWidget().updateAll(ctx)
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
