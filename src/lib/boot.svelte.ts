// Power-on self-test played on every launch: displays light every segment,
// then each digit settles to its live value. About a second; skipped under reduced motion.
export type BootPhase = 'off' | 'test' | 'settle' | 'on';

class Boot {
  phase = $state<BootPhase>('off');
  settleAt = 0;

  start() {
    const root = document.documentElement;
    const set = (p: BootPhase) => { this.phase = p; root.dataset.boot = p; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { set('on'); return; }
    set('off');
    setTimeout(() => set('test'), 90);
    setTimeout(() => { this.settleAt = performance.now(); set('settle'); }, 420);
    setTimeout(() => set('on'), 1150);
  }
}

export const boot = new Boot();
