package com.sailxx.okto.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Цифры виджета «Фокус» растут вместе с ним и не вылезают за края. */
class FocusFitTest {
    @Test fun wideWidgetGetsBigDigitsAndCaption() {
        val fit = FocusFit(390f, 250f, hours = false, timer = false)
        assertTrue("digits ${fit.digits}", fit.digits >= 90f)
        assertTrue(fit.caption)
        assertFalse(fit.presets)
        assertEquals(44f, fit.key)
    }

    @Test fun timerGetsPresetsAndAdjustOnFourByTwo() {
        val fit = FocusFit(360f, 232f, hours = false, timer = true)
        assertTrue(fit.presets)
        assertTrue(fit.adjust)
        assertTrue("digits ${fit.digits}", fit.digits >= 70f)
        assertTrue(fit.digits * 2.75f + FocusFit.ADJ_KEY + 4 <= 360f - 32f + 0.5f)
        assertTrue("fits: ${2 * fit.adjKey + 6} in ${fit.digitsBox}", 2 * fit.adjKey + 6 <= 232f - 24 - 26 - fit.key - 6 - FocusFit.PRESET_ROW)
    }

    @Test fun lowTimerDropsPresetsFirst() {
        val fit = FocusFit(300f, 150f, hours = false, timer = true)
        assertFalse(fit.presets)
        assertTrue(fit.adjust)
    }

    @Test fun digitsNeverWiderThanWidget() {
        val fit = FocusFit(200f, 400f, hours = false, timer = false)
        assertTrue(fit.digits * 2.75f <= 200f - 32f + 0.5f)
        val hours = FocusFit(250f, 400f, hours = true, timer = false)
        assertTrue(hours.digits * 3.6f <= 250f - 32f + 0.5f)
    }

    @Test fun smallestWidgetDropsCaptionButKeepsReadableDigits() {
        val fit = FocusFit(180f, 110f, hours = false, timer = true)
        assertFalse(fit.caption)
        assertFalse(fit.presets)
        assertFalse(fit.adjust)
        assertTrue(fit.digits >= 22f)
        assertTrue("fits: ${24 + 26 + fit.digitsBox + fit.key}", 24 + 26 + fit.digitsBox + fit.key <= 112f)
        assertEquals(36f, fit.key)
    }
}
