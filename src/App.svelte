<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from './components/Nav.svelte';
  import Toast from './components/Toast.svelte';
  import Settings from './components/Settings.svelte';
  import TaskEditor from './components/TaskEditor.svelte';
  import ProfileSheet from './components/ProfileSheet.svelte';
  import Home from './screens/Home.svelte';
  import Calendar from './screens/Calendar.svelte';
  import Calls from './screens/Calls.svelte';
  import Notes from './screens/Notes.svelte';
  import NoteEditor from './components/NoteEditor.svelte';
  import Focus from './screens/Focus.svelte';
  import Habits from './screens/Habits.svelte';
  import Health from './screens/Health.svelte';
  import Finance from './screens/Finance.svelte';
  import Tray from './screens/Tray.svelte';
  import TrayConnect from './components/TrayConnect.svelte';
  import { store } from './lib/store.svelte';
  import { router } from './lib/router.svelte';
  import { sync } from './lib/sync.svelte';
  import { readAndroidPermission, unlockAudio } from './lib/alerts';
  import { liveSync, runLiveAction } from './lib/liveNotify';
  import { androidSend, connectAndroidUi, isBundledAndroid } from './lib/android';
  import { syncAndroidSchedule } from './lib/androidPlanner';
  import { boot } from './lib/boot.svelte';
  import { gcFiles } from './lib/files';
  import { sectionSwipe } from './lib/swipe';
  import { rgbOf } from './lib/tone';
  import { trayAuthorizationUrl } from './lib/trayConnect';
  import './styles/shell.css';

  // Compact view for the Windows tray popup (windows/Tray.cs).
  const tray = location.hash.startsWith('#/tray');
  const trayConnectRoute = /^#\/connect-tray(?:\?|$)/;
  let connectingTray = $state(trayConnectRoute.test(location.hash));
  let trayConnectUrl = $state(trayAuthorizationUrl(location.hash));
  let settingsOpen = $state(false);
  let welcome = $state(false);
  let systemDark = $state(matchMedia('(prefers-color-scheme: dark)').matches);
  let hidden = $state(document.hidden);
  // Phone header (logo, settings) shows only at the very top of the page.
  let topHidden = $state(false);

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
    requestAnimationFrame(() => {
      // The theme's own --bg, not body's colour: body fades between themes for 300ms.
      const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
      meta?.setAttribute('content', bg);
      // Dark or light casing, whatever the theme: the glass bar reads it.
      const [r, g, b] = rgbOf(bg);
      root.dataset.tone = (r * 299 + g * 587 + b * 114) / 1000 < 128 ? 'dark' : 'light';
      if (isBundledAndroid) {
        const color = `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
        androidSend({ type: 'theme', color, light: root.dataset.tone === 'light' });
      }
    });
  });

  $effect(() => {
    if (!(router.route === 'focus' && store.pomoRunning())) document.title = store.t('appTitle');
  });

  // Live Focus notification: follows the clock, Focus state and language.
  $effect(() => {
    void store.now;
    liveSync(hidden);
  });
  $effect(() => { if (isBundledAndroid) syncAndroidSchedule(); });

  // A switched-off section is not reachable, even from an old link.
  $effect(() => {
    if (!store.shows(router.route)) router.go('home');
  });
  $effect(() => {
    if (welcome && store.data.settings.onboarded) welcome = false;
  });

  onMount(() => {
    type TrayWebView = EventTarget & { postMessage(value: string): void };
    const webview = tray ? (window as Window & { chrome?: { webview?: TrayWebView } }).chrome?.webview : undefined;
    const receiveTraySignIn = async (event: Event) => {
      const data = (event as MessageEvent).data;
      if (data?.type !== 'okto-tray-google-sign-in' || typeof data.idToken !== 'string') return;
      const status = await sync.completeTraySignIn(data.idToken);
      if (typeof data.requestId === 'string' && /^[a-f0-9]{32}$/.test(data.requestId))
        webview?.postMessage(`okto-tray-auth-result:${data.requestId}:${status}`);
    };
    if (webview) {
      webview.addEventListener('message', receiveTraySignIn);
      document.documentElement.dataset.oktoTrayAuth = '2';
    }
    const updateTrayConnect = () => {
      connectingTray = trayConnectRoute.test(location.hash);
      trayConnectUrl = trayAuthorizationUrl(location.hash);
    };
    window.addEventListener('hashchange', updateTrayConnect);
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => { systemDark = mq.matches; };
    mq.addEventListener('change', onScheme);
    const timer = setInterval(() => store.tick(), 250);
    const onScroll = () => { const y = window.scrollY; if (y > 24) topHidden = true; else if (y < 6) topHidden = false; };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const onVisible = () => { hidden = document.hidden; if (!hidden) store.tick(); };
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('pointerdown', unlockAudio, { once: true });
    if (!store.storageOk) store.toast(store.t('storageFail'));
    store.tick();
    if (isBundledAndroid) {
      connectAndroidUi(() => { store.flush(); hidden = true; liveSync(true); }, runLiveAction, (hash) => {
        if (hash === '#/habits') router.tab = 'habits';
        if (hash === '#/tasks') router.tab = 'tasks';
        if (location.hash !== hash) location.hash = hash;
      });
      void readAndroidPermission('ready').catch(console.error);
      window.addEventListener('okto-android-resume', () => {
        hidden = false;
        store.tick();
        void readAndroidPermission('permission').catch(console.error);
      });
    }
    sync.start();
    boot.start();
    const gc = setTimeout(() => gcFiles(store.attachedFiles()), 15_000);
    // First launch: ask for a name once the power-on animation has played.
    if (!tray && !connectingTray && !store.data.settings.onboarded) setTimeout(() => { welcome = !connectingTray && !store.data.settings.onboarded; }, 1300);
    // Keyboard: 1–5 switch the visible sections in menu order, N adds a task.
    const onKey = (e: KeyboardEvent) => {
      if (tray || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (document.querySelector('dialog[open]') || (e.target as Element)?.matches?.('input, textarea, select, [contenteditable]')) return;
      const routes = (['home', 'habits', 'calls', 'calendar', 'notes', 'health', 'finance', 'focus'] as const).filter((r) => store.shows(r));
      const n = Number(e.key);
      if (n >= 1 && n <= routes.length) { e.preventDefault(); router.go(routes[n - 1]); }
      else if ((e.key === 'n' || e.key === 'т') && router.route !== 'focus' && router.route !== 'health') { e.preventDefault(); if (router.route === 'finance') document.querySelector<HTMLInputElement>('.page form input')?.focus(); else if (router.route === 'habits' && router.tab === 'habits') store.openNewHabit(); else if (router.route === 'calls') store.openNewCall(); else if (router.route === 'notes') store.openNewNote(); else store.openNewTask(); }
    };
    document.addEventListener('keydown', onKey);
    const stopSwipe = sectionSwipe((r) => store.shows(r));
    return () => {
      stopSwipe();
      clearInterval(timer);
      clearTimeout(gc);
      mq.removeEventListener('change', onScheme);
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', updateTrayConnect);
      webview?.removeEventListener('message', receiveTraySignIn);
    };
  });

</script>

{#if tray}
  <Tray />
{:else}
<div class="shell" class:side-folded={store.device.sideFolded} class:top-hidden={topHidden} class:no-top={router.route !== 'home'} class:cal-full={router.route === 'calendar' && store.device.calExpanded} class:focusing={router.route === 'focus' && store.device.focusMode === 'pomodoro' && Boolean(store.device.pomo.endsAt)}>
  <Nav onSettings={() => (settingsOpen = true)} />
  <div class="main">
    {#if router.route === 'home'}<Home />
    {:else if router.route === 'calls'}<Calls />
    {:else if router.route === 'calendar'}<Calendar />
    {:else if router.route === 'notes'}<Notes />
    {:else if router.route === 'habits'}<Habits />
    {:else if router.route === 'health'}<Health />
    {:else if router.route === 'finance'}<Finance />
    {:else}<Focus />{/if}
  </div>
</div>

{#if store.editor}<TaskEditor />{/if}
{#if store.noteEditor}<NoteEditor />{/if}
{#if settingsOpen}<Settings onclose={() => (settingsOpen = false)} />{/if}
{#if welcome}<ProfileSheet welcome onclose={() => (welcome = false)} />{/if}
{#if connectingTray}
  <TrayConnect href={trayConnectUrl} onclose={() => {
    connectingTray = false;
    history.replaceState(history.state, '', location.pathname + location.search);
  }} />
{/if}
{/if}
<Toast />
