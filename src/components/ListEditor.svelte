<script lang="ts">
  import { untrack } from 'svelte';
  import Sheet from './Sheet.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import { store } from '../lib/store.svelte';
  import { COLORS } from '../lib/model';

  let { id, onclose }: { id: string | null; onclose: () => void } = $props();
  const existing = untrack(() => (id ? store.lists.find((l) => l.id === id) ?? null : null));
  const used = new Set(store.lists.map((l) => l.color));

  let name = $state(existing?.name ?? '');
  let color = $state(existing?.color ?? (COLORS.find((c) => !used.has(c)) || COLORS[0]));
  let armed = $state(false);
  const canDelete = Boolean(existing) && store.lists.length > 1;

  function save() {
    const trimmed = name.trim() || store.t('newList');
    store.saveList(existing ? { ...$state.snapshot(existing), name: trimmed, color } : { name: trimmed, color });
  }
  function remove() {
    if (!armed) { armed = true; return; }
    store.deleteList(existing!.id);
    onclose();
  }
</script>

<Sheet title={existing ? store.t('editList') : store.t('newList')} {onclose}>
  <form method="dialog" onsubmit={save}>
    <label class="field"><span>{store.t('name')}</span>
      <input type="text" maxlength="40" autocomplete="off" bind:value={name} placeholder={store.lang === 'ru' ? 'Например, учёба' : 'e.g. Study'} />
    </label>
    <div class="group">
      <span class="label">{store.t('color')}</span>
      <ColorPicker bind:value={color} />
    </div>
    <div class="row-btns" class:single={!canDelete}>
      {#if canDelete}<button class="line-btn danger" type="button" onclick={remove}>{armed ? store.t('sure') : store.t('delete')}</button>{/if}
      <button class="solid-btn" value="save">{store.t('save')}</button>
    </div>
  </form>
</Sheet>
