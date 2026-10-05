<script lang="ts">
  import { store } from '../lib/store.svelte';

  // Keep the last message rendered while the toast fades out.
  let last = $state<typeof store.toastMsg>(null);
  $effect(() => { if (store.toastMsg) last = store.toastMsg; });
</script>

<div class="toast" class:visible={Boolean(store.toastMsg)} role="status" aria-live="polite">
  {#if last}
    <span>{last.text}</span>
    {#if last.action}
      <button type="button" onclick={() => { last?.action?.(); store.toastMsg = null; }}>{last.label}</button>
    {/if}
  {/if}
</div>
