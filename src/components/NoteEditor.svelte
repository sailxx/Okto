<script lang="ts">
  import { untrack } from 'svelte';
  import Sheet from './Sheet.svelte';
  import Icon from './Icon.svelte';
  import Attachments from './Attachments.svelte';
  import { store } from '../lib/store.svelte';
  import { deleteFiles } from '../lib/files';
  import { COLORS, type Note } from '../lib/model';

  const ed = untrack(() => store.noteEditor!);
  const original = $state.snapshot(ed.note) as Note;
  let draft = $state<Note>($state.snapshot(ed.note) as Note);
  let titleEl: HTMLInputElement | undefined = $state();

  /* Files are written as soon as they are picked; ones the note never kept are dropped on close. */
  const added: string[] = [];
  let removed = false;

  const FIELDS: (keyof Note)[] = ['title', 'body', 'color', 'pinned', 'attachments'];
  const changed = () => FIELDS.some((f) => JSON.stringify(draft[f]) !== JSON.stringify(original[f]));
  const empty = () => !draft.title.trim() && !draft.body.trim() && !draft.attachments.length;

  /* A note saves itself when the sheet closes: nothing to confirm, an empty new note simply vanishes. */
  function close() {
    store.noteEditor = null;
    const discard = removed || (ed.isNew && empty());
    if (!discard && changed()) { draft.title = draft.title.trim(); store.saveNote(draft); }
    const kept = new Set((discard ? [] : (changed() ? draft : original).attachments).map((a) => a.id));
    deleteFiles(added.filter((id) => !kept.has(id)));
  }

  const shut = (e: Event) => (e.currentTarget as HTMLElement).closest('dialog')?.close();
  function onDelete(e: Event) {
    if (!ed.isNew) store.deleteNote(original);
    removed = true;
    shut(e);
  }
  $effect(() => { if (ed.isNew) setTimeout(() => titleEl?.focus(), 60); });
</script>

<Sheet title={ed.isNew ? store.t('newNote') : store.t('notes')} onclose={close}>
  {#snippet head()}
    <button class="icon-btn" class:on={draft.pinned} type="button" aria-pressed={draft.pinned} aria-label={draft.pinned ? store.t('noteUnpin') : store.t('notePin')} title={draft.pinned ? store.t('noteUnpin') : store.t('notePin')} onclick={() => (draft.pinned = !draft.pinned)}><Icon name="pin" /></button>
  {/snippet}

  <div class="ed">
    <input class="title" maxlength="200" placeholder={store.t('noteTitlePh')} bind:value={draft.title} bind:this={titleEl} />
    <textarea class="body" rows="5" maxlength="20000" placeholder={store.t('noteBodyPh')} bind:value={draft.body}></textarea>

    <Attachments bind:items={draft.attachments} onadd={(id) => added.push(id)} />

    <div class="colors-row">
      <button type="button" class="tc none" aria-pressed={draft.color === null} onclick={() => (draft.color = null)}>{store.t('noteNoColor')}</button>
      {#each COLORS as c}
        <button type="button" class="tc" style:--c={c} aria-label={c} aria-pressed={draft.color === c} onclick={() => (draft.color = c)}></button>
      {/each}
    </div>

    <div class="row-btns" class:single={ed.isNew}>
      {#if !ed.isNew}<button class="line-btn danger" type="button" onclick={onDelete}>{store.t('delete')}</button>{/if}
      <button class="solid-btn" type="button" onclick={shut}>{store.t('done')}</button>
    </div>
  </div>
</Sheet>

<style>
  .ed { display: flex; flex-direction: column; gap: 14px; }
  .title { width: 100%; border: 0; background: none; outline: none; padding: 0; font-family: var(--sans); font-size: 23px; font-weight: 700; letter-spacing: -.02em; color: var(--ink); }
  .body { width: 100%; border: 0; background: none; resize: none; outline: none; padding: 0; font-size: 16px; line-height: 1.5; field-sizing: content; min-height: 120px; max-height: 50svh; color: var(--ink); }
  .title::placeholder, .body::placeholder { color: var(--muted); opacity: .7; }
  .icon-btn.on { color: var(--primary); }
  .colors-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .tc { width: 34px; height: 34px; border-radius: 10px; background: var(--c); box-shadow: inset 0 1px 0 rgb(255 255 255 / 25%), 0 1px 0 rgb(0 0 0 / 25%); }
  .tc[aria-pressed='true'] { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--c); }
  .tc.none { width: auto; padding: 0 12px; background: transparent; box-shadow: inset 0 0 0 1px var(--line); font-size: 13px; font-weight: 500; color: var(--muted); }
  .tc.none[aria-pressed='true'] { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
</style>
