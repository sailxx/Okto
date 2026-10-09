package com.sailxx.okto.data

import android.content.Context
import android.content.res.Configuration
import androidx.compose.ui.graphics.Color

/**
 * Цвета тем Okto (взяты из CSS-переменных веб-версии).
 * bg/ink/muted — фон и текст, well* — «колодец» с крупными цифрами, key — кнопки, accent — основная кнопка.
 */
data class OktoPalette(
    val isDark: Boolean,
    val bg: Color,
    val ink: Color,
    val muted: Color,
    val line: Color,
    val key: Color,
    val keyInk: Color,
    val well: Color,
    val wellInk: Color,
    val wellDim: Color,
    val accent: Color,
    val onAccent: Color,
    val red: Color,
) {
    val wellGhost: Color get() = wellInk.copy(alpha = 0.14f)
}

private fun c(hex: Long) = Color(0xFF000000 or hex)

object OktoPalettes {
    val LIGHT = OktoPalette(false, c(0xffffff), c(0x141414), c(0x5f5f5c), c(0xe4e4e1), c(0xf3f3f1), c(0x141414), c(0xf1f1ef), c(0x111111), c(0x5a5a57), c(0x141414), c(0xffffff), c(0xd33a3f))
    val DARK = OktoPalette(true, c(0x141414), c(0xededed), c(0x8e8e8e), c(0x2a2a2a), c(0x262626), c(0xededed), c(0x0a0a0a), c(0xf2f2f2), c(0x8a8a8a), c(0xededed), c(0x141414), c(0xef5a5f))

    private val byName = mapOf(
        "light" to LIGHT,
        "dark" to DARK,
        "soft" to OktoPalette(false, c(0xf2f2f7), c(0x1d1d1f), c(0x6e6e73), c(0xe5e5ea), c(0xffffff), c(0x1d1d1f), c(0xffffff), c(0x1d1d1f), c(0x8e8e93), c(0x007aff), c(0xffffff), c(0xff3b30)),
        "softdark" to OktoPalette(true, c(0x1c1c1e), c(0xf2f2f7), c(0x98989f), c(0x2c2c2e), c(0x333336), c(0xf2f2f7), c(0x2a2a2c), c(0xf2f2f7), c(0x8e8e93), c(0x0a84ff), c(0xffffff), c(0xff453a)),
        "paper" to OktoPalette(false, c(0xe9e2d1), c(0x2a251b), c(0x645a49), c(0xd6ccb6), c(0xf6f0e1), c(0x2a251b), c(0x2b2820), c(0xf1e6c8), c(0xa69b80), c(0x2a251b), c(0xe9e2d1), c(0xd33a3f)),
        "mint" to OktoPalette(false, c(0xe1eae3), c(0x14241a), c(0x4a5f52), c(0xc9d8cd), c(0xf1f6f2), c(0x14241a), c(0xcbd9c4), c(0x142313), c(0x415539), c(0x14241a), c(0xe1eae3), c(0xd33a3f)),
        "midnight" to OktoPalette(true, c(0x0f141d), c(0xe2e7f0), c(0x8590a6), c(0x212a39), c(0x1b2331), c(0xe2e7f0), c(0x070a0f), c(0xdfe7f5), c(0x7a879c), c(0xe2e7f0), c(0x0f141d), c(0xf0646a)),
        "oled" to OktoPalette(true, c(0x000000), c(0xf4f4f4), c(0x8d8d8d), c(0x1d1d1d), c(0x111111), c(0xf4f4f4), c(0x000000), c(0xffffff), c(0x8d8d8d), c(0xf4f4f4), c(0x000000), c(0xff5a5f)),
        "crimson" to OktoPalette(true, c(0x0a0a0a), c(0xf2eeee), c(0x8f8787), c(0x261a1a), c(0x1a1313), c(0xf2eeee), c(0x000000), c(0xff3b3f), c(0x8a5a5b), c(0xe5262d), c(0xffffff), c(0xff3b3f)),
        "amber" to OktoPalette(true, c(0x0d0b07), c(0xf3e7cf), c(0x9a8a6a), c(0x2a2416), c(0x1d1910), c(0xf3e7cf), c(0x050402), c(0xffb000), c(0x8c6d2c), c(0xffb000), c(0x1a1200), c(0xff6a3d)),
        "ocean" to OktoPalette(true, c(0x0b1a22), c(0xe2f1f5), c(0x7d9ba6), c(0x1a2e38), c(0x143039), c(0xe2f1f5), c(0x06121a), c(0x5fe0ef), c(0x5d8792), c(0x2ec4d6), c(0x04222a), c(0xff6b70)),
        "sakura" to OktoPalette(false, c(0xfbeff1), c(0x2b1a1f), c(0x7d5e66), c(0xefd6dc), c(0xfff8f9), c(0x2b1a1f), c(0xffffff), c(0x2b1a1f), c(0x96707a), c(0xd6336c), c(0xffffff), c(0xd6336c)),
        "nord" to OktoPalette(true, c(0x2e3440), c(0xeceff4), c(0xa3acbd), c(0x3b4252), c(0x3b4252), c(0xeceff4), c(0x262b35), c(0x88c0d0), c(0x7f8a9e), c(0x88c0d0), c(0x1f2530), c(0xbf616a)),
        "matrix" to OktoPalette(true, c(0x050a06), c(0xc8f5d2), c(0x5f8a69), c(0x12261a), c(0x0c1a10), c(0xc8f5d2), c(0x000000), c(0x39ff6a), c(0x2f7a45), c(0x39ff6a), c(0x001a08), c(0xff5f56)),
        "synthwave" to OktoPalette(true, c(0x1a1033), c(0xf4e9ff), c(0x9b86c4), c(0x2d1f52), c(0x2a1a4d), c(0xf4e9ff), c(0x0d0720), c(0xff4fd8), c(0x8a5fb0), c(0xff4fd8), c(0x1a0420), c(0xff5c7a)),
        "dracula" to OktoPalette(true, c(0x282a36), c(0xf8f8f2), c(0x9aa3c7), c(0x383a4a), c(0x343746), c(0xf8f8f2), c(0x21222c), c(0xbd93f9), c(0x7c84ad), c(0xbd93f9), c(0x21222c), c(0xff5555)),
        "solarized" to OktoPalette(false, c(0xfdf6e3), c(0x073642), c(0x657b83), c(0xeee8d5), c(0xfffbf0), c(0x073642), c(0xeee8d5), c(0x073642), c(0x839496), c(0x268bd2), c(0xffffff), c(0xdc322f)),
        "gameboy" to OktoPalette(false, c(0xc4cfa1), c(0x0f380f), c(0x306230), c(0xaebc86), c(0xd5deb3), c(0x0f380f), c(0x9bbc0f), c(0x0f380f), c(0x306230), c(0x0f380f), c(0xc4cfa1), c(0xa33b2b)),
        "latte" to OktoPalette(false, c(0xf3eadf), c(0x2b1d14), c(0x7a6352), c(0xe3d4c3), c(0xfbf6ef), c(0x2b1d14), c(0x3b2a1f), c(0xf3e3cf), c(0xa48a74), c(0x8b5a3c), c(0xffffff), c(0xc2410c)),
        "bordeauxlight" to OktoPalette(false, c(0xf7ecee), c(0x3a0d18), c(0x7d4a55), c(0xead2d7), c(0xfff8f9), c(0x3a0d18), c(0x6d1a2c), c(0xfbe6ea), c(0xc99aa4), c(0x8c1c34), c(0xffffff), c(0xd33a3f)),
        "bordeaux" to OktoPalette(true, c(0x2a0f16), c(0xf6e7ea), c(0xb08890), c(0x3d1a22), c(0x3a1820), c(0xf6e7ea), c(0x1a070c), c(0xf4c2cb), c(0x9a6772), c(0xb0213f), c(0xffffff), c(0xff6b6b)),
        "goldlight" to OktoPalette(false, c(0xf7f1e1), c(0x2e2410), c(0x7a6a45), c(0xe8dcbc), c(0xfffaf0), c(0x2e2410), c(0xf1e4c0), c(0x7a5a00), c(0x9c8550), c(0xb8860b), c(0xffffff), c(0xc0392b)),
        "golddark" to OktoPalette(true, c(0x14110a), c(0xf3ead2), c(0x9c8f6e), c(0x2a2414), c(0x221d11), c(0xf3ead2), c(0x0a0805), c(0xffd23f), c(0xa08a3c), c(0xffc61a), c(0x1a1300), c(0xff6a5c)),
    )

    /** Тема из настроек Okto; если не задана — по системной светлой/тёмной. */
    fun forTheme(context: Context, name: String?): OktoPalette =
        byName[name] ?: if (isSystemDark(context)) DARK else LIGHT

    private fun isSystemDark(context: Context) =
        (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

    fun parseHex(hex: String?): Color? = hex
        ?.removePrefix("#")
        ?.takeIf { it.length == 6 }
        ?.toLongOrNull(16)
        ?.let(::c)
}
