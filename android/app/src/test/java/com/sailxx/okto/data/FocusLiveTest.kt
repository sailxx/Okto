package com.sailxx.okto.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Логика часов виджета должна совпадать с store.svelte.ts на сайте. */
class FocusLiveTest {
    private val base = FocusLive.DEFAULT.copy(updatedAt = 1_000)
    private val now = 10_000_000L

    @Test fun pomoStartPauseResume() {
        val run = base.toggle(FocusMode.POMO, now)
        assertEquals(now + 25 * 60_000L, run.pomo.endsAt)
        assertTrue(run.updatedAt > base.updatedAt)
        val paused = run.toggle(FocusMode.POMO, now + 60_000)
        assertNull(paused.pomo.endsAt)
        assertEquals(24 * 60_000L, paused.pomo.remaining)
        assertEquals(now + 120_000 + 24 * 60_000L, paused.toggle(FocusMode.POMO, now + 120_000).pomo.endsAt)
    }

    @Test fun naturalEndOfFocusGivesOneSessionAndBreak() {
        val run = base.toggle(FocusMode.POMO, now)
        val end = run.pomo.endsAt!!
        assertTrue(run.ended(FocusMode.POMO, end))
        val (next, session) = run.advance(end + 5, natural = true)
        assertEquals("short", next.pomo.phase)
        assertNull(next.pomo.endsAt)
        assertEquals("pomo-$end", session!!.id)
        assertEquals(25, session.minutes)
        assertEquals(end - 25 * 60_000L, session.start)
    }

    @Test fun roundsAndLongBreak() {
        val fourth = base.copy(pomo = PomoClock("work", 4, null, null))
        assertEquals("long", fourth.advance(now, natural = false).first.pomo.phase)
        val afterLong = base.copy(pomo = PomoClock("long", 4, null, null)).advance(now, natural = false).first
        assertEquals("work", afterLong.pomo.phase)
        assertEquals(1, afterLong.pomo.round)
        val afterShort = base.copy(pomo = PomoClock("short", 2, null, null)).advance(now, natural = false).first
        assertEquals(3, afterShort.pomo.round)
        assertNull(base.advance(now, natural = false).second)
    }

    @Test fun timerStartsAgainAfterTimeIsUp() {
        val run = base.toggle(FocusMode.TIMER, now)
        assertEquals(now + 5 * 60_000L, run.timer.endsAt)
        val again = run.reset(FocusMode.TIMER, now + 400_000).toggle(FocusMode.TIMER, now + 400_000)
        assertEquals(now + 400_000 + 5 * 60_000L, again.timer.endsAt)
    }

    @Test fun addMinuteStretchesDuration() {
        val run = base.toggle(FocusMode.TIMER, now).addMinute(now)
        assertEquals(now + 6 * 60_000L, run.timer.endsAt)
        assertEquals(6 * 60_000L, run.timer.duration)
        val paused = base.addMinute(now)
        assertEquals(6 * 60_000L, paused.timer.remaining)
    }

    @Test fun subMinuteNeverBelowOneMinute() {
        assertEquals(4 * 60_000L, base.subMinute(now).timer.duration)
        val run = base.toggle(FocusMode.TIMER, now).subMinute(now)
        assertEquals(now + 4 * 60_000L, run.timer.endsAt)
        // Осталось 1:30 → 1:00; осталось 0:30 → не трогаем.
        assertEquals(now + 3 * 60_000L + 30_000, run.subMinute(now + 2 * 60_000L + 30_000).timer.endsAt)
        assertEquals(now + 4 * 60_000L, run.subMinute(now + 3 * 60_000L + 30_000).timer.endsAt)
        val short = base.setTimer(1, now)
        assertEquals(60_000L, short.subMinute(now).timer.duration)
    }

    @Test fun presetStopsAndSetsTimer() {
        val p = base.toggle(FocusMode.TIMER, now).setTimer(25, now + 1_000)
        assertEquals(TimerClock(25 * 60_000L, null, null), p.timer)
        assertFalse(p.started(FocusMode.TIMER))
    }

    @Test fun stopwatch() {
        val run = base.toggle(FocusMode.STOPWATCH, now)
        assertEquals(3_000L, run.swAt(now + 3_000))
        val paused = run.toggle(FocusMode.STOPWATCH, now + 3_000)
        assertEquals(StopwatchClock(3_000, null), paused.stopwatch)
        assertFalse(paused.reset(FocusMode.STOPWATCH, now).started(FocusMode.STOPWATCH))
    }

    @Test fun mapRoundTrip() {
        val run = base.toggle(FocusMode.TIMER, now).toggle(FocusMode.STOPWATCH, now)
        assertEquals(run, FocusLive.fromMap(run.toMap()))
        assertNull(FocusLive.fromMap(mapOf("pomo" to mapOf("phase" to "nap"))))
    }
}
