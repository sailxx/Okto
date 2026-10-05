<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';

  let { title, onclose, children, head }: { title: string; onclose: () => void; children: Snippet; head?: Snippet } = $props();
  let dialog: HTMLDialogElement;

  onMount(() => {
    dialog.showModal();
    (document.activeElement as HTMLElement | null)?.blur();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  class="sheet"
  bind:this={dialog}
  aria-label={title}
  onclose={onclose}
  onclick={(e) => { if (e.target === dialog) dialog.close(); }}
>
  <div class="sheet-head">
    <h2>{title}</h2>
    <div class="sheet-tools">
      {@render head?.()}
      <button class="icon-btn" type="button" aria-label={store.t('close')} onclick={() => dialog.close()}><Icon name="close" /></button>
    </div>
  </div>
  {@render children()}
</dialog>

<style>
  .sheet-tools { display: flex; align-items: center; gap: 4px; }
</style>
