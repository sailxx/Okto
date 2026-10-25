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

  const ALL: { route: Route; icon: string; label: 'navHome' | 'navCalls' | 'navCalendar' | 'navNotes' | 'navHabits' | 'navHealth' | 'navFinance' | 'navFocus' }[] = [
    { route: 'home', icon: 'home', label: 'navHome' },
    { route: 'habits', icon: 'habit', label: 'navHabits' },
    { route: 'calls', icon: 'call', label: 'navCalls' },
    { route: 'calendar', icon: 'calendar', label: 'navCalendar' },
    { route: 'notes', icon: 'note', label: 'navNotes' },
    { route: 'health', icon: 'heart', label: 'navHealth' },
    { route: 'finance', icon: 'wallet', label: 'navFinance' },
    { route: 'focus', icon: 'focus', label: 'navFocus' },
  ];
  let tabbarEl = $state<HTMLElement>();
  let sideNavEl = $state<HTMLElement>();
  const last = new WeakMap<HTMLElement, { x: number; y: number }>();

  /* The glass lens glides to the current section and stretches along the move. */
  function glide(nav: HTMLElement | undefined) {
    const g = nav?.querySelector<HTMLElement>(':scope > .glide');
    const cur = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !g) return;
    if (!cur || !cur.offsetWidth) { g.style.opacity = '0'; return; }
    const x = cur.offsetLeft, y = cur.offsetTop;
    g.style.width = `${cur.offsetWidth}px`;
    g.style.height = `${cur.offsetHeight}px`;
    g.style.transform = `translate(${x}px, ${y}px)`;
    g.style.opacity = '1';
    const prev = last.get(nav);
    last.set(nav, { x, y });
    if (prev && (prev.x !== x || prev.y !== y) && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const vertical = nav === sideNavEl;
      const d = Math.hypot(x - prev.x, y - prev.y) / (vertical ? cur.offsetHeight : cur.offsetWidth);
      const k = 1 + Math.min(0.7, d * 0.22);
      const mid = vertical ? `scale(${2 - k}, ${k})` : `scale(${k}, ${2 - k})`;
      g.firstElementChild?.animate([{ transform: 'scale(1)' }, { transform: mid, offset: 0.4 }, { transform: 'scale(1)' }], { duration: 560, easing: 'ease-out' });
    }
    requestAnimationFrame(() => g.classList.add('ready'));
  }

  $effect(() => {
    void router.route; void items; void folded;
    glide(tabbarEl); glide(sideNavEl);
  });

  $effect(() => {
    if (!tabbarEl || !sideNavEl) return;
    const ro = new ResizeObserver(() => { glide(tabbarEl); glide(sideNavEl); });
    ro.observe(tabbarEl); ro.observe(sideNavEl);
    return () => ro.disconnect();
  });

  const folded = $derived(store.device.sideFolded);
  const items = $derived(ALL.filter((it) => store.shows(it.route)));
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = $derived(`${new Intl.DateTimeFormat(store.lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' }).format(store.now).replace('.', '').toUpperCase()} ${pad(store.now.getDate())}.${pad(store.now.getMonth() + 1)}`);
</script>

{#snippet brand()}
  <a class="brand" href="#/" aria-label="Okto">
    <i class="led" aria-hidden="true"></i>
    <span>okto</span>
  </a>
{/snippet}


<header class="mobile-top">
  {@render brand()}
  <div class="top-actions">
    <button class="icon-btn" type="button" aria-label={store.t('settings')} onclick={onSettings}><Icon name="settings" /></button>
  </div>
</header>

<nav class="tabbar" aria-label="Okto" bind:this={tabbarEl}>
  <span class="glide" aria-hidden="true"><i></i></span>
  {#each items as it}
    <button class="tab" type="button" aria-label={store.t(it.label)} title={store.t(it.label)} aria-current={router.route === it.route ? 'page' : undefined} onclick={() => router.go(it.route)}>
      <Icon name={it.icon} />
    </button>
  {/each}
</nav>

<!-- Home stays clean; Tasks and Calls have their own add buttons. -->
{#if router.route === 'calendar'}
  <button class="fab" type="button" aria-label={store.t('newTask')} onclick={() => store.openNewTask()}><Icon name="plus" /></button>
{/if}

<aside class="side">
  {@render brand()}
  <div class="side-clock">{stamp}</div>
  <div class="side-nav" bind:this={sideNavEl}>
  <span class="glide" aria-hidden="true"><i></i></span>
  {#each items as it, i}
    <button class="side-link" type="button" title={store.t(it.label)} aria-label={store.t(it.label)} aria-current={router.route === it.route ? 'page' : undefined} onclick={() => router.go(it.route)}>
      <Icon name={it.icon} />
      <span>{store.t(it.label)}</span>
      <kbd>{i + 1}</kbd>
    </button>
  {/each}
  </div>
  <button class="side-new" type="button" title={store.t('newTask')} aria-label={store.t('newTask')} onclick={() => store.openNewTask()}><Icon name="plus" /><span>{store.t('newTask')}</span><kbd class="nk">N</kbd></button>
  <div class="side-foot">
    <button class="icon-btn" type="button" title={store.t('settings')} aria-label={store.t('settings')} onclick={onSettings}><Icon name="settings" /></button>
    <button class="icon-btn side-fold" type="button" title={folded ? store.t('sideUnfold') : store.t('sideFold')} aria-label={folded ? store.t('sideUnfold') : store.t('sideFold')} aria-expanded={!folded} onclick={() => store.setDevice({ sideFolded: !folded })}><Icon name="left" /></button>
  </div>
</aside>

<style>
  .nk { font-family: var(--mono); font-size: 11px; opacity: .6; margin-left: 4px; }
</style>
