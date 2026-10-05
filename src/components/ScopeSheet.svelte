<script lang="ts">
  import Sheet from './Sheet.svelte';
  import { store, type Scope } from '../lib/store.svelte';

  let { onpick, onclose }: { onpick: (scope: Scope) => void; onclose: () => void } = $props();
</script>

<Sheet title={store.t('scopeTitle')} {onclose}>
  <form method="dialog" class="scope">
    <button class="line-btn" onclick={() => onpick('one')}>{store.t('scopeOne')}</button>
    <button class="line-btn" onclick={() => onpick('future')}>{store.t('scopeFuture')}</button>
    <button class="line-btn" onclick={() => onpick('all')}>{store.t('scopeAll')}</button>
  </form>
</Sheet>

<style>
  .scope { display: grid; gap: 8px; }
</style>
