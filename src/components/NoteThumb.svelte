<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getFile } from '../lib/files';

  let { id, name }: { id: string; name: string } = $props();
  let url = $state('');
  let alive = true;

  $effect(() => {
    const key = id;
    getFile(key).then((b) => { if (alive && b && key === id) url = URL.createObjectURL(b); });
  });
  onDestroy(() => { alive = false; if (url) URL.revokeObjectURL(url); });
</script>

{#if url}<img src={url} alt={name} loading="lazy" />{:else}<span class="ph" aria-hidden="true"></span>{/if}

<style>
  img, .ph { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ph { background: var(--soft); }
</style>
