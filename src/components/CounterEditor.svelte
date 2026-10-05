<script lang="ts">
  import { untrack } from 'svelte';
  import Sheet from './Sheet.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import { store } from '../lib/store.svelte';
  import { COLORS } from '../lib/model';

  let { id, onclose }: { id: string | null; onclose: () => void } = $props();
  const existing = untrack(() => (id ? store.data.counters[id] : null));
  const used = new Set(store.counters.map((c) => c.color));

  let name = $state(existing?.name ?? '');
  let target = $state(String(existing?.target ?? 50));
  let color = $state(existing?.color ?? (COLORS.find((c) => !used.has(c)) || COLORS[0]));
  let armed = $state(false);
  let targetEl: HTMLInputElement;
  const canDelete = Boolean(existing) && store.counters.length > 1;

  function save(e: SubmitEvent) {
    const n = parseInt(target, 10);
    if (!Number.isInteger(n) || n < 1 || n > 999999) {
      e.preventDefault();
      targetEl.setCustomValidity(store.t('invalidGoal'));
      targetEl.reportValidity();
      return;
    }
    const rec = store.saveCounter(existing ? { ...$state.snapshot(existing), name: name.trim(), target: n, color } : { name: name.trim(), target: n, color });
    if (!existing) store.setDevice({ activeCounter: rec.id });
  }
  function remove() {
    if (!armed) { armed = true; return; }
    store.deleteCounter(id!);
    onclose();
  }
</script>

<Sheet title={existing ? store.t('editTag') : store.t('newTag')} {onclose}>
  <form method="dialog" onsubmit={save}>
    <label class="field"><span>{store.t('name')}</span>
      <input type="text" maxlength="24" autocomplete="off" bind:value={name} placeholder={store.lang === 'ru' ? 'Например, отжимания' : 'e.g. Push‑ups'} />
    </label>
    <label class="field"><span>{store.t('goal')}</span>
      <input type="number" min="1" max="999999" inputmode="numeric" bind:value={target} bind:this={targetEl} oninput={() => targetEl.setCustomValidity('')} />
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
