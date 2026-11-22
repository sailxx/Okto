import { androidSend } from './android';
import { store } from './store.svelte';

export function syncAndroidSchedule() {
  const enabled = store.device.notify;
  const clock: Record<string, { time: number; title: string; body: string; tag: string }> = {};
  if (enabled) {
    const timer = store.device.timer.endsAt;
    if (timer) clock.timer = {
      time: timer, title: store.t('timerDoneTitle'), body: store.t('timerDoneBody'), tag: `planner-focus-timer-${timer}`,
    };
    const p = store.device.pomo;
    if (p.endsAt) {
      const cfg = store.pomoCfg();
      const work = p.phase === 'work';
      const next = p.round % cfg.every === 0 ? 'long' : 'short';
      clock.pomodoro = {
        time: p.endsAt,
        title: work ? store.t('workDoneTitle') : store.t('breakDoneTitle'),
        body: work ? store.t('workDoneBody')(cfg[next]) : store.t('breakDoneBody'),
        tag: `planner-focus-pomodoro-${p.endsAt}`,
      };
    }
  }
  const tasks = enabled ? store.tasks.filter((task) => task.reminder !== null && task.start).map((task) => {
    const { id, title, date, start, duration, reminder, repeat, done, doneDates, skipDates, kind } = task;
    return { id, title, date, start, duration, reminder, repeat, done, doneDates, skipDates, kind };
  }) : [];
  androidSend({ type: 'reminders', enabled, tasks, clock });
}
