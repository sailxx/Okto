<script lang="ts">
  // First launch ("welcome") asks for a name; later the same sheet edits name and greeting.
  import { onMount } from 'svelte';
  import Sheet from './Sheet.svelte';
  import { store } from '../lib/store.svelte';

  let { welcome = false, onclose }: { welcome?: boolean; onclose: () => void } = $props();

  let name = $state(store.data.settings.name);
  let greeting = $state(store.data.settings.greeting);
  let auto = $state(!store.data.settings.greeting);
  let nameEl: HTMLInputElement;

  onMount(() => setTimeout(() => nameEl?.focus(), 80));

  function save() {
    store.updateSettings({ name: name.trim().slice(0, 40), greeting: auto ? '' : greeting.trim().slice(0, 80), onboarded: true });
  }
  function close() {
    if (welcome && !store.data.settings.onboarded) store.updateSettings({ onboarded: true });
    onclose();
  }
</script>

<Sheet title={welcome ? store.t('hello') : store.t('profile')} onclose={close}>
  <form method="dialog" onsubmit={save}>
    {#if welcome}<p class="sub lead">{store.t('helloSub')}</p>{/if}
    <label class="field"><span>{store.t('yourName')}</span>
      <input type="text" maxlength="40" autocomplete="given-name" bind:value={name} bind:this={nameEl} placeholder={store.t('namePh')} />
    </label>
    {#if !welcome}
      <div class="group">
        <span class="label">{store.t('greetingLabel')}</span>
        <label class="switch"><span>{store.t('greetingAuto')}</span><input type="checkbox" bind:checked={auto} /><i></i></label>
        {#if !auto}
          <label class="field"><input type="text" maxlength="80" bind:value={greeting} placeholder={store.t('greetingPh')} /></label>
        {/if}
      </div>
    {/if}
    <div class="row-btns" class:single={!welcome}>
      {#if welcome}<button class="line-btn" type="button" onclick={() => { store.updateSettings({ onboarded: true }); onclose(); }}>{store.t('skipName')}</button>{/if}
      <button class="solid-btn" value="save">{welcome ? store.t('begin') : store.t('save')}</button>
    </div>
  </form>
</Sheet>

<style>
  .lead { margin: 0 2px 16px; font-size: 15px; line-height: 1.45; }
</style>
