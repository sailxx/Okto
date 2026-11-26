<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import NoteThumb from '../components/NoteThumb.svelte';
  import { store } from '../lib/store.svelte';
  import { isImage } from '../lib/files';
  import { toKey } from '../lib/date';

  let query = $state('');
  let pinnedOnly = $state(false);
  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return store.notes.filter((n) =>
      (!pinnedOnly || n.pinned) && (!q || `${n.title}\n${n.body}`.toLowerCase().includes(q)));
  });
  const dateFormat = $derived(new Intl.DateTimeFormat(store.data.settings.lang, { month: 'short', day: 'numeric' }));

  function stamp(date: Date) {
    const now = new Date();
    if (toKey(date) === toKey(now)) return store.t('today');
    now.setDate(now.getDate() - 1);
    if (toKey(date) === toKey(now)) return store.t('yesterday');
    return dateFormat.format(date);
  }
</script>

<div class="page wide">
  <div class="page-head">
    <h1 class="page-title">{store.t('notes')}</h1>
    <button type="button" class="add-note" onclick={() => store.openNewNote()}>
      <Icon name="plus" size={18} /><span>{store.t('newNote')}</span>
    </button>
  </div>

  {#if store.notes.length}
    <div class="tools">
      <div class="filters">
        <button type="button" aria-pressed={!pinnedOnly} onclick={() => (pinnedOnly = false)}>{store.t('notesAll')}</button>
        <button type="button" aria-pressed={pinnedOnly} onclick={() => (pinnedOnly = true)}>{store.t('notesPinned')}</button>
      </div>
      <label class="search">
        <Icon name="search" size={17} />
        <input type="search" aria-label={store.t('notesSearch')} placeholder={store.t('notesSearch')} maxlength="100" bind:value={query} />
      </label>
    </div>
  {/if}

  {#if shown.length}
    <ul class="notes">
      {#each shown as n (n.id)}
        {@const lines = n.body.trim().split('\n')}
        {@const headline = n.title.trim() || lines[0]}
        {@const preview = (n.title.trim() ? n.body : lines.slice(1).join(' ')).trim().replace(/\s+/g, ' ')}
        {@const date = new Date(n.updatedAt)}
        {@const photo = n.attachments.find((attachment) => isImage(attachment.type))}
        <li>
          <button type="button" class="note" style:--c={n.color ?? undefined} onclick={() => store.openNote(n)}>
            {#if photo}<span class="thumb"><NoteThumb id={photo.id} name={photo.name} /></span>{/if}
            <span class="txt">
              <span class="nt">{headline || n.attachments[0]?.name || store.t('noteTitlePh')}</span>
              {#if preview}<span class="nb">{preview}</span>{/if}
            </span>
            <span class="meta">
              {#if n.updatedAt && Number.isFinite(date.getTime())}<time datetime={date.toISOString()}>{stamp(date)}</time>{/if}
              {#if n.pinned || n.attachments.length}
                <span class="marks">
                  {#if n.attachments.length}
                    <span class="attachment" title={store.t('noteFiles')(n.attachments.length)}>
                      <Icon name="clip" size={13} />{n.attachments.length}
                    </span>
                  {/if}
                  {#if n.pinned}<span class="pin" title={store.t('notesPinned')}><Icon name="pin" size={14} /></span>{/if}
                </span>
              {/if}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="empty">
      <p>{store.notes.length ? store.t(pinnedOnly && !query.trim() ? 'notesPinnedEmpty' : 'notesNone') : store.t('notesEmpty')}</p>
      {#if !store.notes.length}<small>{store.t('notesEmptyHint')}</small>{/if}
    </div>
  {/if}
</div>

<style>
  .page-head { gap: 12px; flex-wrap: wrap; }
  .add-note {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px;
    padding: 0 13px; border-radius: var(--r-key); background: var(--primary); color: var(--on-primary);
    font-size: 14px; font-weight: 600; box-shadow: 0 2px 0 var(--key-edge);
  }
  .add-note:active { transform: translateY(1px); }
  .tools { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 12px; }
  .filters { display: flex; flex-wrap: wrap; gap: 6px; }
  .filters button {
    min-height: 44px; padding: 0 12px; border: 1px solid var(--line); border-radius: var(--r-key);
    font: 600 12px var(--mono); color: var(--ink);
  }
  .filters button[aria-pressed='true'] { border-color: var(--primary); background: var(--primary); color: var(--on-primary); }
  .search {
    flex: 1 1 180px; display: flex; align-items: center; gap: 9px; min-height: 44px;
    padding: 0 11px; border: 1px solid var(--line); border-radius: var(--r-key); background: var(--soft); color: var(--muted);
  }
  .search:focus-within { border-color: var(--accent); }
  .search input {
    flex: 1; min-width: 0; min-height: 42px; border: 0; padding: 0; background: none; outline: none;
    font: inherit; font-size: 16px; color: var(--ink);
  }
  .notes { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .note {
    display: flex; align-items: center; gap: 12px; width: 100%; min-height: 68px; padding: 10px 13px;
    border: 1px solid color-mix(in srgb, var(--c, var(--line)) 27%, var(--line));
    border-radius: 12px; background: color-mix(in srgb, var(--c, var(--soft)) 14%, var(--soft));
    text-align: left; color: var(--ink);
  }
  .note:hover { border-color: color-mix(in srgb, var(--c, var(--ink)) 50%, var(--line)); }
  .thumb { flex: 0 0 44px; height: 44px; overflow: hidden; border-radius: 7px; }
  .txt { flex: 1; display: grid; gap: 3px; min-width: 0; }
  .nt, .nb { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .nt { font-size: 16px; font-weight: 700; line-height: 1.25; }
  .nb { color: var(--muted); font-size: 14px; line-height: 1.35; }
  .meta { display: grid; justify-items: end; gap: 5px; color: var(--muted); font: 500 11px var(--mono); white-space: nowrap; }
  .marks, .attachment { display: inline-flex; align-items: center; gap: 5px; }
  .pin { display: inline-flex; color: var(--ink); }
  .empty { margin-top: 14px; padding: 28px 16px; border: 1px solid var(--line); border-radius: 12px; text-align: center; }
  .empty p { margin: 0; font-weight: 600; }
  .empty small { display: block; margin-top: 5px; color: var(--muted); }
</style>
