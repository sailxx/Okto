<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from '../lib/store.svelte';
  import Icon from './Icon.svelte';

  let { href, onclose }: { href: string | null; onclose: () => void } = $props();
  let dialog: HTMLDialogElement;
  const ru = $derived(store.lang === 'ru');

  onMount(() => dialog.showModal());
</script>

<dialog bind:this={dialog} aria-labelledby="tray-connect-title" onclose={onclose}>
  <div class="heading">
    <h2 id="tray-connect-title">{ru ? 'Подключить Okto Tray' : 'Connect Okto Tray'}</h2>
    <button class="icon-btn" aria-label={store.t('close')} onclick={() => dialog.close()}><Icon name="close" size={18} /></button>
  </div>
  {#if href}
    <p>{ru
      ? 'Выбери аккаунт Google, чтобы открыть свои задачи Okto в трее Windows.'
      : 'Choose your Google account to see your Okto tasks in the Windows tray.'}</p>
    <a class="continue" href={href} referrerpolicy="no-referrer">{ru ? 'Продолжить с Google' : 'Continue with Google'}</a>
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
