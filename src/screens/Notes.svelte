<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import NoteThumb from '../components/NoteThumb.svelte';
  import { store } from '../lib/store.svelte';
  import { isImage } from '../lib/files';
  import type { Note } from '../lib/model';

  let query = $state('');
  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? store.notes.filter((n) => `${n.title}\n${n.body}`.toLowerCase().includes(q)) : store.notes;
  });
  const photos = (n: Note) => n.attachments.filter((a) => isImage(a.type));
  const files = (n: Note) => n.attachments.filter((a) => !isImage(a.type));
</script>

<div class="page wide">
  <div class="page-head">
    <div>
      <h1 class="page-title">{store.t('notes')}</h1>
      <p class="page-sub">{store.t('noteCount')(store.notes.length)}</p>
    </div>
    <button type="button" class="add-note" onclick={() => store.openNewNote()}><Icon name="plus" size={18} /><span>{store.t('newNote')}</span></button>
  </div>

  {#if store.notes.length}
    <label class="search">
      <Icon name="search" size={18} />
      <input type="search" placeholder={store.t('notesSearch')} maxlength="100" bind:value={query} />
    </label>
  {/if}

  {#if shown.length}
    <div class="masonry">
      {#each shown as n (n.id)}
        {@const ph = photos(n)}
        {@const fl = files(n)}
        <button type="button" class="note" style:--c={n.color ?? 'transparent'} class:colored={n.color} onclick={() => store.openNote(n)}>
          {#if ph.length}
            <span class="cover" class:multi={ph.length > 1}>
              {#each ph.slice(0, 4) as a (a.id)}<span class="cell"><NoteThumb id={a.id} name={a.name} /></span>{/each}
              {#if ph.length > 4}<b class="more">+{ph.length - 4}</b>{/if}
            </span>
          {/if}
          <span class="txt">
            {#if n.title}<span class="nt">{n.title}</span>{/if}
            {#if n.body}<span class="nb">{n.body}</span>{/if}
          </span>
          {#if n.pinned || fl.length}
            <span class="meta">
              {#if fl.length}<span><Icon name="clip" size={13} />{store.t('noteFiles')(fl.length)}</span>{/if}
              {#if n.pinned}<span class="pin" title={store.t('notePin')}><Icon name="pin" size={13} /></span>{/if}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  {:else}
    <div class="empty">
      <p class="hint label">{store.notes.length ? store.t('notesNone') : store.t('notesEmpty')}</p>
      {#if !store.notes.length}<p>{store.t('notesEmptyHint')}</p>{/if}
    </div>
  {/if}
</div>

<style>
  .add-note {
    display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto;
    height: 44px; padding: 0 16px 0 12px; border-radius: var(--r-key);
    background: var(--primary); color: var(--on-primary); font-weight: 600; font-size: 15px;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 25%), 0 2px 0 var(--key-edge);
    transition: transform 90ms var(--ease), filter 150ms ease;
  }
  .add-note:hover { filter: brightness(1.08); }
  .add-note:active { transform: translateY(2px); }
  .add-note :global(svg) { stroke-width: 2.4; }

  .search { display: flex; align-items: center; gap: 10px; margin: 18px 0 14px; height: 46px; padding: 0 14px; border-radius: var(--r-well); background: var(--soft); box-shadow: inset 0 0 0 1px var(--line); color: var(--muted); }
  .search input { flex: 1; min-width: 0; height: 100%; border: 0; background: none; outline: none; font: inherit; font-size: 16px; color: var(--ink); }

  .masonry { columns: 2 220px; column-gap: 12px; margin-top: 18px; }
  .search + .masonry { margin-top: 0; }
  .note {
    position: relative; display: flex; flex-direction: column; gap: 8px; width: 100%; margin: 0 0 12px; padding: 14px;
    break-inside: avoid; text-align: left; overflow: hidden;
    border-radius: 16px; background: var(--soft); box-shadow: inset 0 0 0 1px var(--line); color: var(--ink);
    transition: transform 120ms var(--ease), box-shadow 150ms ease;
  }
  .note:hover { box-shadow: inset 0 0 0 1px var(--key-edge), 0 8px 20px -14px rgb(0 0 0 / 45%); }
  .note:active { transform: scale(.985); }
  .note.colored { background: color-mix(in srgb, var(--c) 12%, var(--soft)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 40%, var(--line)); }
  .cover { display: grid; grid-template-columns: 1fr; gap: 3px; margin: -14px -14px 0; aspect-ratio: 16 / 10; position: relative; }
  .cover.multi { grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; }
  .cell { display: block; overflow: hidden; min-height: 0; }
  .more { position: absolute; right: 8px; bottom: 8px; padding: 2px 8px; border-radius: 999px; background: rgb(0 0 0 / 60%); color: #fff; font: 600 12px var(--mono); }
  .txt { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .nt { font-family: var(--sans); font-weight: 700; font-size: 16px; letter-spacing: -.01em; line-height: 1.25; overflow-wrap: anywhere; }
  .nb { color: var(--muted); font-size: 14px; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 7; line-clamp: 7; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { display: flex; align-items: center; gap: 10px; color: var(--muted); font-family: var(--mono); font-size: 11.5px; }
  .meta > span { display: inline-flex; align-items: center; gap: 4px; }
  .pin { margin-left: auto; color: var(--ink); }
</style>
