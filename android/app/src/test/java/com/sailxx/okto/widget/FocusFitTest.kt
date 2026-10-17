package com.sailxx.okto.widget

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Цифры виджета «Фокус» растут вместе с ним и не вылезают за края. */
class FocusFitTest {
    @Test fun wideWidgetGetsBigDigitsAndCaption() {
        val fit = FocusFit(390f, 250f, hours = false)
        assertTrue("digits ${fit.digits}", fit.digits >= 90f)
        assertTrue(fit.caption)
        assertEquals(52f, fit.key)
    }

    @Test fun digitsNeverWiderThanWidget() {
        val fit = FocusFit(200f, 400f, hours = false)
        assertTrue(fit.digits * 2.75f <= 200f - 32f + 0.5f)
        val hours = FocusFit(250f, 400f, hours = true)
        assertTrue(hours.digits * 3.6f <= 250f - 32f + 0.5f)
    }

    @Test fun smallestWidgetDropsCaptionButKeepsReadableDigits() {
        val fit = FocusFit(180f, 110f, hours = false)
        assertFalse(fit.caption)
        assertTrue(fit.digits >= 22f)
        assertTrue("fits: ${24 + 26 + fit.digitsBox + fit.key}", 24 + 26 + fit.digitsBox + fit.key <= 112f)
        assertEquals(36f, fit.key)
    }
}
