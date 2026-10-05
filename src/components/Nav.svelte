<script lang="ts" module>
  export const FLAGS = {
    ru: '<svg class="flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039a6"/><rect y="13.33" width="30" height="6.67" fill="#d52b1e"/></svg>',
    en: '<svg class="flag" viewBox="0 0 60 40" aria-hidden="true"><clipPath id="fc"><rect width="60" height="40"/></clipPath><g clip-path="url(#fc)"><rect width="60" height="40" fill="#012169"/><path d="M0 0l60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0l60 40M60 0L0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#c8102e" stroke-width="7"/></g></svg>',
  };
</script>

<script lang="ts">
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { router, type Route } from '../lib/router.svelte';

  let { onSettings }: { onSettings: () => void } = $props();

  const items: { route: Route; icon: string; label: 'navHome' | 'navTasks' | 'navCalendar' | 'navFocus' }[] = [
    { route: 'home', icon: 'home', label: 'navHome' },
    { route: 'tasks', icon: 'tasks', label: 'navTasks' },
    { route: 'calendar', icon: 'calendar', label: 'navCalendar' },
    { route: 'focus', icon: 'focus', label: 'navFocus' },
  ];
  const other = $derived(store.lang === 'ru' ? 'en' : 'ru');
  const toggleLang = () => store.updateSettings({ lang: other });
  const pad = (n: number) => String(n).padStart(2, '0');
  const clock = $derived(`${pad(store.now.getHours())}:${pad(store.now.getMinutes())}`);
  const stamp = $derived(`${new Intl.DateTimeFormat(store.lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' }).format(store.now).replace('.', '').toUpperCase()} ${pad(store.now.getDate())}.${pad(store.now.getMonth() + 1)}`);
</script>

{#snippet brand()}
  <a class="brand" href="#/" aria-label="Okto">
    <i class="led" aria-hidden="true"></i>
    <span>okto</span>
  </a>
{/snippet}

{#snippet langBtn()}
  <button class="icon-btn lang" type="button" onclick={toggleLang} aria-label={store.lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}>
    {@html FLAGS[other]}<span>{other.toUpperCase()}</span>
  </button>
{/snippet}

<header class="mobile-top">
  {@render brand()}
  <div class="top-actions">
    <span class="clock">{stamp} · {clock}</span>
    {@render langBtn()}
    <button class="icon-btn" type="button" aria-label={store.t('settings')} onclick={onSettings}><Icon name="settings" /></button>
  </div>
</header>

<nav class="tabbar" aria-label="Okto">
  {#each items as it}
    <button class="tab" type="button" aria-current={router.route === it.route ? 'page' : undefined} onclick={() => router.go(it.route)}>
      <Icon name={it.icon} />
      <span>{store.t(it.label)}</span>
    </button>
  {/each}
</nav>

<!-- Home stays clean; Tasks has its own add button. -->
{#if router.route === 'calendar'}
  <button class="fab" type="button" aria-label={store.t('newTask')} onclick={() => store.openNewTask()}><Icon name="plus" /></button>
{/if}

<aside class="side">
  {@render brand()}
  <div class="side-clock">{stamp} · {clock}</div>
  {#each items as it, i}
    <button class="side-link" type="button" aria-current={router.route === it.route ? 'page' : undefined} onclick={() => router.go(it.route)}>
      <Icon name={it.icon} />
      <span>{store.t(it.label)}</span>
      <kbd>{i + 1}</kbd>
    </button>
  {/each}
  <button class="side-new" type="button" onclick={() => store.openNewTask()}><Icon name="plus" />{store.t('newTask')}<kbd class="nk">N</kbd></button>
  <div class="side-foot">
    {@render langBtn()}
    <button class="icon-btn" type="button" aria-label={store.t('settings')} onclick={onSettings}><Icon name="settings" /></button>
  </div>
</aside>

<style>
  .nk { font-family: var(--mono); font-size: 11px; opacity: .6; margin-left: 4px; }
  @media (max-width: 400px) { .top-actions :global(.lang span) { display: none; } .clock { margin-right: 2px; } }
</style>
