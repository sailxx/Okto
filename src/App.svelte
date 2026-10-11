<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from './components/Nav.svelte';
  import Toast from './components/Toast.svelte';
  import Settings from './components/Settings.svelte';
  import TaskEditor from './components/TaskEditor.svelte';
  import ProfileSheet from './components/ProfileSheet.svelte';
  import Home from './screens/Home.svelte';
  import Tasks from './screens/Tasks.svelte';
  import Calendar from './screens/Calendar.svelte';
  import Calls from './screens/Calls.svelte';
  import Notes from './screens/Notes.svelte';
  import NoteEditor from './components/NoteEditor.svelte';
  import Focus from './screens/Focus.svelte';
  import { store } from './lib/store.svelte';
  import { router } from './lib/router.svelte';
  import { sync } from './lib/sync.svelte';
  import { unlockAudio } from './lib/alerts';
  import { boot } from './lib/boot.svelte';
  import { gcFiles } from './lib/files';
  import './styles/shell.css';

  let settingsOpen = $state(false);
  let welcome = $state(false);
  let systemDark = $state(matchMedia('(prefers-color-scheme: dark)').matches);

  const pomodoro = $derived(router.route === 'focus' && store.device.focusMode === 'pomodoro');

  $effect(() => {
    const root = document.documentElement;
    const theme = store.data.settings.theme;
    root.dataset.theme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
    if (pomodoro) root.dataset.mode = 'pomodoro'; else delete root.dataset.mode;
    root.lang = store.lang;
    const tag = store.activeCounter()?.color;
    root.style.setProperty('--tag', tag ?? '#0090ff');
    const meta = document.querySelector('meta[name="theme-color"]');
    requestAnimationFrame(() => meta?.setAttribute('content', getComputedStyle(document.body).backgroundColor));
  });

  $effect(() => {
    if (!(router.route === 'focus' && store.pomoRunning())) document.title = store.t('appTitle');
  });

  // A switched-off section is not reachable, even from an old link.
  $effect(() => {
    if (!store.shows(router.route)) router.go('home');
  });

  onMount(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => { systemDark = mq.matches; };
    mq.addEventListener('change', onScheme);
    const timer = setInterval(() => store.tick(), 250);
    const onVisible = () => { if (!document.hidden) store.tick(); };
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('pointerdown', unlockAudio, { once: true });
    if (!store.storageOk) store.toast(store.t('storageFail'));
    store.tick();
    sync.start();
    boot.start();
    const gc = setTimeout(() => gcFiles(store.attachedFiles()), 15_000);
    // First launch: ask for a name once the power-on animation has played.
    if (!store.data.settings.onboarded) setTimeout(() => { welcome = !store.data.settings.onboarded; }, 1300);
    // Keyboard: 1–5 switch the visible sections in menu order, N adds a task.
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (document.querySelector('dialog[open]') || (e.target as Element)?.matches?.('input, textarea, select, [contenteditable]')) return;
      const routes = (['home', 'tasks', 'calls', 'calendar', 'notes', 'focus'] as const).filter((r) => store.shows(r));
      const n = Number(e.key);
      if (n >= 1 && n <= routes.length) { e.preventDefault(); router.go(routes[n - 1]); }
      else if ((e.key === 'n' || e.key === 'т') && router.route !== 'focus') { e.preventDefault(); if (router.route === 'calls') store.openNewCall(); else if (router.route === 'notes') store.openNewNote(); else store.openNewTask(); }
    };
    document.addEventListener('keydown', onKey);
    // Touch: drag the screen sideways to move between sections — swipe right goes forward,
    // swipe left goes back. The screen follows the finger and slides out/in.
    let sx = 0, sy = 0, st = 0, sOk = false, axis: 'x' | 'y' | null = null, busy = false;
    const blocked = (el: Element | null) => {
      for (; el && el !== document.body; el = el.parentElement) {
        if (el.matches('input, textarea, select, [contenteditable], .editing, .tags, .fold, .day-list, .tabbar, .row-wrap')) return true;
        if (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
      }
      return false;
    };
    const routes = () => (['home', 'tasks', 'calls', 'calendar', 'notes', 'focus'] as const).filter((r) => store.shows(r));
    const neighbour = (dx: number) => { const list = routes(); return list[list.indexOf(router.route) + (dx > 0 ? 1 : -1)]; };
    const main = () => document.querySelector<HTMLElement>('.main');
    const reset = (el: HTMLElement) => { el.style.transition = el.style.transform = el.style.opacity = ''; document.documentElement.style.overflowX = ''; busy = false; };
    const onTStart = (e: TouchEvent) => {
      axis = null;
      sOk = !busy && e.touches.length === 1 && router.route !== 'calendar' && !document.querySelector('dialog[open]') && !blocked(e.target as Element);
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    };
    const onTMove = (e: TouchEvent) => {
      if (!sOk) return;
      const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
      if (!axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
        if (axis === 'y') { sOk = false; return; }
        document.documentElement.style.overflowX = 'hidden';
      }
      const el = main();
      if (!el) return;
      const w = window.innerWidth, off = neighbour(dx) ? dx : dx * 0.25;
      el.style.transition = 'none';
      el.style.transform = `translateX(${off}px)`;
      el.style.opacity = String(1 - Math.min(Math.abs(off) / w, 1) * 0.6);
    };
    const onTEnd = (e: TouchEvent) => {
      const el = main();
      if (!sOk || axis !== 'x' || !el) { sOk = false; return; }
      sOk = false;
      const dx = (e.changedTouches[0]?.clientX ?? sx) - sx, w = window.innerWidth;
      const next = e.type === 'touchend' ? neighbour(dx) : undefined;
      const fast = Math.abs(dx) / Math.max(Date.now() - st, 1) > 0.5 && Math.abs(dx) > 30;
      busy = true;
      if (!next || (Math.abs(dx) < w * 0.3 && !fast)) {
        el.style.transition = 'transform 240ms cubic-bezier(.2,.8,.2,1), opacity 240ms ease';
        el.style.transform = 'translateX(0)'; el.style.opacity = '1';
        setTimeout(() => reset(el), 260);
        return;
      }
      const dir = dx > 0 ? 1 : -1;
      el.style.transition = 'transform 160ms ease-in, opacity 160ms ease-in';
      el.style.transform = `translateX(${dir * w}px)`; el.style.opacity = '0';
      setTimeout(() => {
        router.go(next);
        el.style.transition = 'none';
        el.style.transform = `translateX(${-dir * w * 0.3}px)`;
        setTimeout(() => {
          el.style.transition = 'transform 260ms cubic-bezier(.2,.8,.2,1), opacity 220ms ease-out';
          el.style.transform = 'translateX(0)'; el.style.opacity = '1';
          setTimeout(() => reset(el), 280);
        }, 50);
      }, 170);
    };
    document.addEventListener('touchstart', onTStart, { passive: true });
    document.addEventListener('touchmove', onTMove, { passive: true });
    document.addEventListener('touchend', onTEnd, { passive: true });
    document.addEventListener('touchcancel', onTEnd, { passive: true });
    return () => { document.removeEventListener('touchstart', onTStart); document.removeEventListener('touchmove', onTMove); document.removeEventListener('touchend', onTEnd); document.removeEventListener('touchcancel', onTEnd); clearInterval(timer); clearTimeout(gc); mq.removeEventListener('change', onScheme); document.removeEventListener('visibilitychange', onVisible); document.removeEventListener('keydown', onKey); };
  });

</script>

<div class="shell" class:side-folded={store.device.sideFolded} class:cal-full={router.route === 'calendar' && store.device.calExpanded} class:focusing={router.route === 'focus' && store.device.focusMode === 'pomodoro' && Boolean(store.device.pomo.endsAt)}>
  <Nav onSettings={() => (settingsOpen = true)} />
  <div class="main">
    {#if router.route === 'home'}<Home />
    {:else if router.route === 'tasks'}<Tasks />
    {:else if router.route === 'calls'}<Calls />
    {:else if router.route === 'calendar'}<Calendar />
    {:else if router.route === 'notes'}<Notes />
    {:else}<Focus />{/if}
  </div>
</div>

{#if store.editor}<TaskEditor />{/if}
{#if store.noteEditor}<NoteEditor />{/if}
{#if settingsOpen}<Settings onclose={() => (settingsOpen = false)} />{/if}
{#if welcome}<ProfileSheet welcome onclose={() => (welcome = false)} />{/if}
<Toast />
