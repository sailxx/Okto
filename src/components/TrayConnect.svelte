<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from '../lib/store.svelte';
  import { sync } from '../lib/sync.svelte';
  import type { trayBrowserConnection } from '../lib/trayConnect';
  import Icon from './Icon.svelte';

  let { href, browser, onclose }: {
    href: string | null; browser: ReturnType<typeof trayBrowserConnection>; onclose: () => void;
  } = $props();
  let dialog: HTMLDialogElement;
  let pending = $state(false);
  let failed = $state(false);
  const ru = $derived(store.lang === 'ru');

  onMount(() => dialog.showModal());

  async function connect() {
    const connection = browser;
    if (pending || !connection) return;
    pending = true;
    failed = false;
    try {
      const token = await sync.trayBrowserCredential();
      if (!dialog.open || browser?.state !== connection.state) return;
      // A navigation to loopback keeps the token in the POST body, outside the URL.
      const form = document.createElement('form');
      form.method = 'post';
      form.action = connection.endpoint;
      for (const [name, value] of Object.entries({ state: connection.state, credential: token })) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      failed = code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request';
    } finally {
      pending = false;
    }
  }
</script>

<dialog bind:this={dialog} aria-labelledby="tray-connect-title" onclose={onclose}>
  <div class="heading">
    <h2 id="tray-connect-title">{ru ? 'Подключить Okto Tray' : 'Connect Okto Tray'}</h2>
    <button class="icon-btn" aria-label={store.t('close')} onclick={() => dialog.close()}><Icon name="close" size={18} /></button>
  </div>
  {#if href || browser}
    <p>{ru
      ? 'Выбери аккаунт Google, чтобы открыть свои задачи Okto в трее Windows.'
      : 'Choose your Google account to see your Okto tasks in the Windows tray.'}</p>
    {#if browser}
      <button type="button" class="continue" disabled={pending} onclick={connect}>
        {pending ? store.t('signingIn') : ru ? 'Продолжить с Google' : 'Continue with Google'}
      </button>
      {#if failed}<p role="alert">{store.t('signInFailed')}</p>{/if}
    {:else}
      <a class="continue" href={href} referrerpolicy="no-referrer">{ru ? 'Продолжить с Google' : 'Continue with Google'}</a>
    {/if}
  {:else}
    <p>{ru
      ? 'Открой вход из Okto Tray, чтобы получить новую ссылку для подключения.'
      : 'Open sign-in from Okto Tray to create a new connection link.'}</p>
    <button class="continue" onclick={() => dialog.close()}>{store.t('close')}</button>
  {/if}
</dialog>

<style>
  dialog {
    box-sizing: border-box;
    width: min(400px, calc(100% - 32px));
    margin: auto;
    padding: 22px;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--bg);
    color: var(--ink);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 35%);
    backdrop-filter: blur(8px);
  }
  .heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .heading h2 { margin: 0; font-size: 21px; line-height: 1.25; }
  .heading button { flex: 0 0 auto; }
  p { margin: 12px 0 20px; color: var(--muted); line-height: 1.5; }
  .continue {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: 11px;
    background: var(--ink);
    color: var(--bg);
    font-weight: 600;
    text-decoration: none;
  }
  .continue:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
</style>
