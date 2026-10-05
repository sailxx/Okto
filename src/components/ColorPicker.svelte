<script lang="ts">
  import { COLORS } from '../lib/model';
  let { value = $bindable() }: { value: string } = $props();
</script>

<div class="colors">
  {#each COLORS as c}
    <button type="button" class="color-opt" style:--c={c} aria-label={c} aria-pressed={value === c} onclick={() => (value = c)}></button>
  {/each}
</div>
