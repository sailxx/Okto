package com.sailxx.okto.ui

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.sailxx.okto.R
import com.sailxx.okto.data.OktoPalette
import com.sailxx.okto.data.OktoRepository
import com.sailxx.okto.widget.updateOktoWidgets
import kotlinx.coroutines.launch
import java.time.LocalDate

/** Быстрое добавление задачи из виджета — нижняя панель поверх рабочего стола. */
class QuickAddActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Firebase.auth.currentUser == null) {
            startActivity(Intent(this, WidgetSettingsActivity::class.java))
            finish()
            return
        }
        enableEdgeToEdge()
        setContent { QuickAdd(onClose = ::finish) }
    }
}

private enum class When { TODAY, TOMORROW, NONE }

@Composable
private fun QuickAdd(onClose: () -> Unit) {
    val ctx = LocalContext.current
    val p = OktoRepository.state.collectAsState().value.palette
    val scope = rememberCoroutineScope()
    val focus = remember { FocusRequester() }
    var title by remember { mutableStateOf("") }
    var day by remember { mutableStateOf(When.TODAY) }

    LaunchedEffect(Unit) {
        focus.requestFocus()
        OktoRepository.refreshIfStale(ctx, maxAgeMs = 10 * 60_000)  // нужен id первого списка
    }

    fun save() {
        if (title.isBlank()) return
        scope.launch {
            val date = when (day) {
                When.TODAY -> LocalDate.now().toString()
                When.TOMORROW -> LocalDate.now().plusDays(1).toString()
                When.NONE -> null
            }
            OktoRepository.addTask(ctx, title, date)
            updateOktoWidgets(ctx)
            onClose()
        }
    }

    Box(
        Modifier
            .fillMaxSize()
            .background(Color(0x99000000))
            .clickable(remember { MutableInteractionSource() }, indication = null, onClick = onClose),
        contentAlignment = Alignment.BottomCenter,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                .background(p.bg)
                .clickable(remember { MutableInteractionSource() }, indication = null) {}
                .navigationBarsPadding()
                .imePadding()
                .padding(16.dp),
        ) {
            MonoLabel(ctx.getString(R.string.new_task), p.muted)
            Spacer(Modifier.height(10.dp))
            BasicTextField(
                value = title,
                onValueChange = { title = it.take(200) },
                singleLine = true,
                textStyle = TextStyle(color = p.ink, fontSize = 18.sp),
                cursorBrush = SolidColor(p.ink),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { save() }),
                modifier = Modifier
                    .fillMaxWidth()
                    .focusRequester(focus)
                    .clip(RoundedCornerShape(10.dp))
                    .background(p.well)
                    .padding(14.dp),
                decorationBox = { field ->
                    Box {
                        if (title.isEmpty()) {
                            BasicText(ctx.getString(R.string.task_hint), style = TextStyle(color = p.muted, fontSize = 18.sp))
                        }
                        field()
                    }
                },
            )
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Chip(ctx.getString(R.string.today_chip), day == When.TODAY, p) { day = When.TODAY }
                Chip(ctx.getString(R.string.tomorrow_chip), day == When.TOMORROW, p) { day = When.TOMORROW }
                Chip(ctx.getString(R.string.no_date_chip), day == When.NONE, p) { day = When.NONE }
                Spacer(Modifier.weight(1f))
                OktoKey(ctx.getString(R.string.add), p, primary = true, enabled = title.isNotBlank()) { save() }
            }
        }
    }
}

@Composable
private fun Chip(text: String, selected: Boolean, p: OktoPalette, onClick: () -> Unit) {
    val shape = RoundedCornerShape(8.dp)
    Box(
        Modifier
            .clip(shape)
            .background(if (selected) p.ink else p.key)
            .border(1.dp, p.line, shape)
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
    ) {
        MonoLabel(text, if (selected) p.bg else p.muted)
    }
}
