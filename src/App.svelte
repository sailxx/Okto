<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from './components/Nav.svelte';
  import Toast from './components/Toast.svelte';
  import Settings from './components/Settings.svelte';
  import TaskEditor from './components/TaskEditor.svelte';
  import Home from './screens/Home.svelte';
  import Tasks from './screens/Tasks.svelte';
  import Calendar from './screens/Calendar.svelte';
  import Focus from './screens/Focus.svelte';
  import { store } from './lib/store.svelte';
  import { router } from './lib/router.svelte';
  import { sync } from './lib/sync.svelte';
  import { unlockAudio } from './lib/alerts';
  import './styles/shell.css';

  let settingsOpen = $state(false);
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
    return () => { clearInterval(timer); mq.removeEventListener('change', onScheme); document.removeEventListener('visibilitychange', onVisible); };
  });

</script>

<div class="shell">
  <Nav onSettings={() => (settingsOpen = true)} />
  <div class="main">
    {#if router.route === 'home'}<Home />
    {:else if router.route === 'tasks'}<Tasks />
    {:else if router.route === 'calendar'}<Calendar />
    {:else}<Focus />{/if}
  </div>
</div>

{#if store.editor}<TaskEditor />{/if}
{#if settingsOpen}<Settings onclose={() => (settingsOpen = false)} />{/if}
<Toast />
