<script lang="ts">
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { sync } from '../lib/sync.svelte';

  const status = $derived(
    sync.state === 'off' ? store.t('syncOff')
      : sync.state === 'signed-out' ? store.t('syncSignedOut')
      : sync.state === 'syncing' ? store.t('syncing')
      : sync.state === 'offline' ? store.t('offline')
      : sync.state === 'error' ? store.t('syncError')
      : store.t('synced'),
  );
</script>

<div class="group">
  <span class="label">{store.t('account')}</span>
  {#if sync.user}
    <div class="acct">
      <div class="who">
        <b>{sync.user.name || sync.user.email}</b>
        <span class="state" data-state={sync.state}><Icon name="sync" size={15} />{status}</span>
      </div>
      <button class="text-btn" type="button" onclick={() => sync.signOut()}>{store.t('signOut')}</button>
    </div>
  {:else}
    <p class="sub">{status}</p>
    {#if sync.state !== 'off'}
      <button class="line-btn google" type="button" onclick={() => sync.signIn()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285f4" stroke="none"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34a853" stroke="none"/><path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z" fill="#fbbc05" stroke="none"/><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.7 9.4 6 12 6z" fill="#ea4335" stroke="none"/></svg>
        {store.t('signIn')}
      </button>
    {/if}
  {/if}
</div>

<style>
  .acct { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; }
  .who { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .who b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .state { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 14px; font-weight: 500; }
  .state[data-state='synced'] { color: #30a46c; }
  .state[data-state='error'] { color: var(--red); }
  .google { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; }
  .google svg { width: 20px; height: 20px; }
  .sub { margin-top: 0; }
</style>
