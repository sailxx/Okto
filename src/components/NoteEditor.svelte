<script lang="ts">
  import { untrack } from 'svelte';
  import Sheet from './Sheet.svelte';
  import Icon from './Icon.svelte';
  import Attachments from './Attachments.svelte';
  import { store } from '../lib/store.svelte';
  import { androidCall, isBundledAndroid } from '../lib/android';
  import { deleteFiles } from '../lib/files';
  import { COLORS, type Note } from '../lib/model';

  const ed = untrack(() => store.noteEditor!);
  const original = $state.snapshot(ed.note) as Note;
  let draft = $state<Note>($state.snapshot(ed.note) as Note);
  const paletteId = $props.id();
  let paletteOpen = $state(false);
  let paletteButton: HTMLButtonElement;
  let titleEl: HTMLInputElement | undefined = $state();
  let copyResult = $state<{ text: string; ok: boolean }>();
  const copyText = $derived([draft.title.trim(), draft.body].filter((part) => part.trim()).join('\n\n'));
  const copyStatus = $derived(copyResult?.text === copyText ? copyResult : undefined);

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

  function pickColor(color: string | null) {
    draft.color = color;
    paletteOpen = false;
    paletteButton.focus();
  }

  async function copyNote() {
    const text = copyText;
    if (!text) return;
    try {
      if (isBundledAndroid) {
        copyResult = { text, ok: await androidCall<boolean>({ type: 'copyText', text }) };
      } else {
        await navigator.clipboard.writeText(text);
        copyResult = { text, ok: true };
      }
    } catch {
      copyResult = { text, ok: false };
    }
  }

  const shut = (e: Event) => (e.currentTarget as HTMLElement).closest('dialog')?.close();
  function onDelete(e: Event) {
    if (!ed.isNew) store.deleteNote(original);
    removed = true;
    shut(e);
  }
  $effect(() => { if (ed.isNew) setTimeout(() => titleEl?.focus(), 60); });
</script>

<Sheet title={ed.isNew ? store.t('newNote') : store.t('notes')} onclose={close} class="note-editor-sheet" top>
  {#snippet head()}
    <button class="icon-btn" class:on={draft.pinned} type="button" aria-pressed={draft.pinned} aria-label={draft.pinned ? store.t('noteUnpin') : store.t('notePin')} title={draft.pinned ? store.t('noteUnpin') : store.t('notePin')} onclick={() => (draft.pinned = !draft.pinned)}><Icon name="pin" /></button>
    <div class="palette-anchor">
      <button bind:this={paletteButton} type="button" class="icon-btn palette-toggle" aria-label={store.t('noteColor')} title={store.t('noteColor')}
        aria-expanded={paletteOpen} aria-controls={paletteId} onclick={() => (paletteOpen = !paletteOpen)}>
        <Icon name="palette" />
        {#if draft.color}<span class="color-dot" style:--c={draft.color}></span>{/if}
      </button>
      <div id={paletteId} class="colors-row" hidden={!paletteOpen}>
        {#each COLORS as c}
          <button type="button" class="tc" style:--c={c} aria-label={c} aria-pressed={draft.color === c} onclick={() => pickColor(c)}></button>
        {/each}
        <button type="button" class="tc none" aria-pressed={draft.color === null} onclick={() => pickColor(null)}>{store.t('noteNoColor')}</button>
      </div>
    </div>
  {/snippet}

  <div class="ed">
    <input class="title" maxlength="200" aria-label={store.t('noteTitlePh')} placeholder={store.t('noteTitlePh')} bind:value={draft.title} bind:this={titleEl} />
    <textarea class="body" rows="5" maxlength="20000" aria-label={store.t('noteBodyPh')} placeholder={store.t('noteBodyPh')} bind:value={draft.body}></textarea>

    <footer class="editor-footer">
      <Attachments bind:items={draft.attachments} onadd={(id) => added.push(id)} compact>
        {#snippet trailing()}
          <button type="button" class="copy-note" disabled={!copyText} onclick={copyNote}>
            <Icon name={copyStatus?.ok ? 'check' : 'copy'} size={18} />
            <span aria-live="polite">{store.t(copyStatus?.ok ? 'noteCopied' : 'noteCopy')}</span>
          </button>
        {/snippet}
      </Attachments>
      {#if copyStatus && !copyStatus.ok}<p class="copy-error" role="status">{store.t('noteCopyFailed')}</p>{/if}
      <div class="row-btns" class:single={ed.isNew}>
        {#if !ed.isNew}<button class="line-btn danger" type="button" onclick={onDelete}>{store.t('delete')}</button>{/if}
        <button class="solid-btn" type="button" onclick={shut}>{store.t('done')}</button>
      </div>
    </footer>
  </div>
</Sheet>

<style>
  :global(.sheet.note-editor-sheet[open]) { display: flex; flex-direction: column; }
  @media (min-width: 561px) {
    :global(.sheet.note-editor-sheet) { height: min(720px, calc(100dvh - 56px)); }
  }
  @media (max-width: 560px) {
    :global(.sheet.note-editor-sheet) { height: calc(100dvh - max(20px, calc(env(safe-area-inset-top) + 8px))); }
  }
  .ed { flex: 1; display: flex; flex-direction: column; gap: 12px; }
  .editor-footer { flex: none; display: grid; gap: 10px; padding: 10px 0 max(12px, env(safe-area-inset-bottom)); border-top: 1px solid var(--line); }
  .copy-note:disabled { opacity: .4; cursor: default; }
  .copy-note span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .copy-error { margin: 0; text-align: right; color: var(--muted); font-size: 13px; }
  .title { width: 100%; border: 0; background: none; outline: none; padding: 0; font-family: var(--sans); font-size: 29px; font-weight: 700; letter-spacing: -.02em; color: var(--ink); }
  .body { flex: 1; width: 100%; border: 0; background: none; resize: none; outline: none; padding: 0; font-size: 17px; line-height: 1.6; min-height: 88px; color: var(--ink); }
  .title:focus-visible, .body:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 4px; }
  .title::placeholder, .body::placeholder { color: var(--muted); opacity: .7; }
  .icon-btn.on { color: var(--primary); }
  .palette-anchor { position: relative; }
  .palette-toggle { position: relative; }
  .color-dot { position: absolute; right: 4px; bottom: 4px; width: 10px; height: 10px; background: var(--c); border: 1px solid var(--bg); border-radius: 50%; }
  .colors-row {
    position: absolute; top: calc(100% + 8px); right: -26px; z-index: 1;
    display: grid; grid-template-columns: repeat(5, 40px); gap: 4px;
    padding: 8px; border: 1px solid var(--line); border-radius: 12px;
    background: var(--bg); box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
  }
  .colors-row[hidden] { display: none; }
  .tc { height: 40px; border-radius: 8px; display: grid; place-items: center; }
  .tc:not(.none)::before { content: ''; width: 27px; height: 27px; border-radius: 7px; background: var(--c); }
  .tc[aria-pressed='true'] { box-shadow: inset 0 0 0 2px var(--ink); }
  .tc.none { grid-column: 1 / -1; color: var(--ink); box-shadow: inset 0 0 0 1px var(--line); font-size: 13px; }
  .tc.none[aria-pressed='true'] { box-shadow: inset 0 0 0 2px var(--ink); }
</style>
