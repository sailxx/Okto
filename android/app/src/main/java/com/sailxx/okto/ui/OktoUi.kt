package com.sailxx.okto.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sailxx.okto.data.OktoPalette

/** Мелкая моно-подпись капсом: «ЗАДАЧИ · СЕГОДНЯ». */
@Composable
fun MonoLabel(text: String, color: Color, modifier: Modifier = Modifier) {
    BasicText(
        text.uppercase(),
        modifier,
        style = TextStyle(color = color, fontSize = 11.sp, fontFamily = FontFamily.Monospace, letterSpacing = 1.sp),
    )
}

/** Кнопка-«клавиша» Okto. primary — светлая заливка, как «New task». */
@Composable
fun OktoKey(
    text: String,
    p: OktoPalette,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(10.dp)
    Box(
        modifier = modifier
            .clip(shape)
            .background(if (primary) p.accent else p.key)
            .border(1.dp, if (primary) Color.Transparent else p.line, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 13.dp),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(
            text,
            style = TextStyle(
                color = (if (primary) p.onAccent else p.keyInk).copy(alpha = if (enabled) 1f else 0.5f),
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
            ),
        )
    }
}

@Composable
fun OktoKeyWide(text: String, p: OktoPalette, primary: Boolean = false, enabled: Boolean = true, onClick: () -> Unit) =
    OktoKey(text, p, Modifier.fillMaxWidth(), primary, enabled, onClick)
