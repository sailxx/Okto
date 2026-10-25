// Phones: drag the screen sideways to move between sections in tab-bar order.
// Like turning pages: drag left to open the next section (Home → Tasks → … → Focus), drag right
// for the previous one. The screen follows the finger, then slides out and the new one slides in.
import { tick } from 'svelte';
import { router, type Route } from './router.svelte';

const ORDER: Route[] = ['home', 'habits', 'calls', 'calendar', 'notes', 'health', 'finance', 'focus'];
// Places with their own drag gestures, where a sideways drag must not change the section.
const OWN = 'input, textarea, select, [contenteditable], .editing, .ev, .tabbar, .mobile-top';
const LOCK = 10; // px before the direction is decided
const EASE = 'cubic-bezier(.2,.9,.25,1)';

export function sectionSwipe(shown: (r: Route) => boolean): () => void {
  let x0 = 0, y0 = 0, dx = 0, axis: 'x' | 'y' | null = null, live = false, busy = false;
  let rowOnly = false; // started on a task row: it owns the leftward drag
  let samples: { x: number; t: number }[] = [];
  let main: HTMLElement | null = null;

  const target = (dir: 1 | -1) => {
    const list = ORDER.filter(shown);
    const i = list.indexOf(router.route);
    return i < 0 ? undefined : list[i + dir];
  };

  const ownGesture = (el: Element | null) => {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.matches(OWN)) return true;
      // Real sideways scrollers (chips and the like) keep the drag.
      if (el.scrollWidth - el.clientWidth > 8 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
    }
    return false;
  };

  const style = (t: string, x: number, o: number) => {
    if (!main) return;
    main.style.transition = t;
    main.style.transform = x ? `translate3d(${x}px,0,0)` : '';
    main.style.opacity = o === 1 ? '' : String(o);
  };
  const done = () => {
    if (main) { main.style.transition = ''; main.style.transform = ''; main.style.opacity = ''; main.style.willChange = ''; }
    busy = false;
  };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // A swipe must not also click whatever it started on.
  const swallow = () => {
    const stop = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
    document.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', stop, { capture: true }), 400);
  };

  // The old screen (a static copy) and the new one slide side by side, like pages.
  async function go(next: Route, dir: 1 | -1, v: number) {
    if (!main) return;
    busy = true;
    const w = window.innerWidth, r = main.getBoundingClientRect();
    // The copy sits in a clipping layer: anything poking past the screen edge would make the
    // phone browser zoom out mid-swipe.
    const layer = document.createElement('div');
    Object.assign(layer.style, { position: 'fixed', inset: '0', overflow: 'hidden', pointerEvents: 'none', zIndex: '2' });
    const ghost = main.cloneNode(true) as HTMLElement;
    Object.assign(ghost.style, {
      position: 'absolute', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, margin: '0',
      background: 'var(--bg)', transition: 'none', transform: `translate3d(${dx}px,0,0)`, opacity: '', willChange: 'transform',
    });
    layer.append(ghost);
    document.body.append(layer);
    router.go(next);
    await tick();
    window.scrollTo(0, 0);
    style('none', dx - dir * w, 1);
    void main.offsetWidth; // commit the start positions before animating
    // Finish at the finger's pace: a fast flick lands quickly, a slow drag glides.
    const ms = Math.round(Math.min(360, Math.max(200, (w - Math.abs(dx)) / Math.max(Math.abs(v), 1.4))));
    const t = `transform ${ms}ms ${EASE}`;
    ghost.style.transition = t;
    ghost.style.transform = `translate3d(${dir * w}px,0,0)`;
    style(t, 0, 1);
    await wait(ms + 20);
    layer.remove();
    done();
  }

  function start(e: TouchEvent) {
    live = false; axis = null; dx = 0;
    if (busy || e.touches.length !== 1 || matchMedia('(min-width: 900px)').matches) return;
    if (document.querySelector('dialog[open]')) return;
    const el = e.target as Element;
    if (ownGesture(el)) return;
    const row = el.closest?.('.row-wrap');
    if (row?.querySelector('.swipe-actions.show')) return; // an open row closes first
    rowOnly = Boolean(row);
    main = document.querySelector<HTMLElement>('.main');
    if (!main || !el.closest?.('.shell')) return; // empty space below a short screen counts too
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    samples = [{ x: x0, t: e.timeStamp }];
    live = true;
  }

  function move(e: TouchEvent) {
    if (!live) return;
    const x = e.touches[0].clientX, y = e.touches[0].clientY;
    dx = x - x0;
    if (!axis) {
      const ady = Math.abs(y - y0), adx = Math.abs(dx);
      if (adx < LOCK && ady < LOCK) return;
      axis = adx > ady ? 'x' : 'y';
      if (axis === 'y' || (rowOnly && dx < 0)) { live = false; return; }
      x0 += Math.sign(dx) * LOCK; dx = x - x0; // no jump when the drag picks up
      if (main) main.style.willChange = 'transform';
    }
    samples.push({ x, t: e.timeStamp });
    if (samples.length > 6) samples.shift();
    const off = target(dx < 0 ? 1 : -1) ? dx : dx / 4; // rubber band past the ends
    style('none', off, 1);
  }

  function end(e: TouchEvent) {
    if (!live) return;
    live = false;
    if (axis !== 'x') return;
    swallow();
    const w = window.innerWidth;
    const first = samples[0], last = samples[samples.length - 1];
    const v = last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0; // px/ms
    const dir: 1 | -1 = dx > 0 ? 1 : -1;
    const next = e.type === 'touchend' ? target(dir > 0 ? -1 : 1) : undefined;
    const far = Math.abs(dx) > w * 0.25, flick = Math.abs(v) > 0.35 && Math.sign(v) === dir;
    if (next && (far || flick)) { void go(next, dir, v); return; }
    busy = true;
    style(`transform 280ms ${EASE}`, 0, 1);
    setTimeout(done, 290);
  }

  document.addEventListener('touchstart', start, { passive: true });
  document.addEventListener('touchmove', move, { passive: true });
  document.addEventListener('touchend', end, { passive: true });
  document.addEventListener('touchcancel', end, { passive: true });
  return () => {
    document.removeEventListener('touchstart', start);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
    document.removeEventListener('touchcancel', end);
  };
}
