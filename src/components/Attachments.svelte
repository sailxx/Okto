<script lang="ts">
  import { onDestroy } from 'svelte';
  import Icon from './Icon.svelte';
  import { store } from '../lib/store.svelte';
  import { download, getFile, isImage, putFile } from '../lib/files';
  import { MAX_ATTACHMENTS, MAX_FILE_SIZE, uid, type Attachment } from '../lib/model';

  let { items = $bindable(), onadd }: { items: Attachment[]; onadd: (id: string) => void } = $props();

  /* Blobs found on this device; null = described in the task, but the file stayed on another device. */
  let blobs = $state<Record<string, Blob | null>>({});
  let urls = $state<Record<string, string>>({});
  let broken = $state<Record<string, boolean>>({});
  let viewing = $state<Attachment | null>(null);
  let viewer: HTMLDialogElement | undefined = $state();
  let camera: HTMLInputElement, picker: HTMLInputElement;

  const requested = new Set<string>();
  $effect(() => {
    for (const a of items) {
      if (requested.has(a.id)) continue;
      requested.add(a.id);
      getFile(a.id).then((b) => {
        blobs[a.id] = b;
        if (b && isImage(a.type)) urls[a.id] = URL.createObjectURL(b);
      });
    }
  });
  $effect(() => { if (viewing && viewer && !viewer.open) viewer.showModal(); });
  onDestroy(() => Object.values(urls).forEach((u) => URL.revokeObjectURL(u)));

  async function add(files: FileList | null) {
    for (const f of Array.from(files ?? [])) {
      if (items.length >= MAX_ATTACHMENTS) { store.toast(store.t('attachLimit')(MAX_ATTACHMENTS)); break; }
      if (f.size > MAX_FILE_SIZE) { store.toast(store.t('fileTooBig')(MAX_FILE_SIZE / 1048576)); continue; }
      const a: Attachment = { id: uid(), name: f.name || `photo-${Date.now()}.jpg`, type: f.type, size: f.size, addedAt: Date.now() };
      try { await putFile(a.id, f); }
      catch (e) { console.error(e); store.toast(store.t('fileError')); continue; }
      requested.add(a.id);
      blobs[a.id] = f;
      if (isImage(a.type)) urls[a.id] = URL.createObjectURL(f);
      onadd(a.id);
      items.push(a);
    }
    if (camera) camera.value = '';
    if (picker) picker.value = '';
  }

  function open(a: Attachment) {
    const b = blobs[a.id];
    if (!b) { store.toast(store.t('fileElsewhere')); return; }
    if (urls[a.id] && !broken[a.id]) viewing = a;
    else download(b, a.name);
  }
  function remove(a: Attachment) {
    const i = items.findIndex((x) => x.id === a.id);
    if (i >= 0) items.splice(i, 1);
    viewer?.close();
  }
  const ext = (name: string) => (name.match(/\.([a-z0-9]{1,5})$/i)?.[1] ?? '').toUpperCase();
</script>

<div class="att">
  <span class="label">{store.t('attachments')}</span>
  {#if items.length}
    <div class="grid">
      {#each items as a (a.id)}
        <div class="tile" class:img={urls[a.id] && !broken[a.id]} class:gone={blobs[a.id] === null}>
          <button type="button" class="open" title={a.name} onclick={() => open(a)}>
            {#if urls[a.id] && !broken[a.id]}
              <img src={urls[a.id]} alt={a.name} loading="lazy" onerror={() => (broken[a.id] = true)} />
            {:else}
              <span class="ficon"><Icon name="file" size={26} />{#if ext(a.name)}<b>{ext(a.name)}</b>{/if}</span>
              <span class="fname">{a.name}</span>
              <span class="fsize">{blobs[a.id] === null ? store.t('fileElsewhere') : store.t('fileSize')(a.size)}</span>
            {/if}
          </button>
          <button type="button" class="rm" aria-label={store.t('removeFile')} onclick={() => remove(a)}><Icon name="close" size={14} /></button>
        </div>
      {/each}
    </div>
  {/if}
  <div class="adds">
    <button type="button" class="chip" onclick={() => camera.click()}><Icon name="camera" size={18} />{store.t('attachPhoto')}</button>
    <button type="button" class="chip" onclick={() => picker.click()}><Icon name="clip" size={18} />{store.t('attachFile')}</button>
  </div>
  <input bind:this={camera} type="file" accept="image/*" capture="environment" hidden onchange={(e) => add(e.currentTarget.files)} />
  <input bind:this={picker} type="file" multiple hidden onchange={(e) => add(e.currentTarget.files)} />
</div>

{#if viewing}
  {@const v = viewing}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <dialog class="viewer" bind:this={viewer} aria-label={v.name} onclose={() => (viewing = null)} onclick={(e) => { if (e.target === viewer) viewer?.close(); }}>
    <img src={urls[v.id]} alt={v.name} />
    <div class="vbar">
      <span class="vname">{v.name} · {store.t('fileSize')(v.size)}</span>
      <button type="button" class="icon-btn" aria-label={store.t('download')} title={store.t('download')} onclick={() => { const b = blobs[v.id]; if (b) download(b, v.name); }}><Icon name="download" /></button>
      <button type="button" class="icon-btn" aria-label={store.t('removeFile')} title={store.t('removeFile')} onclick={() => remove(v)}><Icon name="trash" /></button>
      <button type="button" class="icon-btn" aria-label={store.t('close')} onclick={() => viewer?.close()}><Icon name="close" /></button>
    </div>
  </dialog>
{/if}

<style>
  .att .label { margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; margin-bottom: 10px; }
  .tile { position: relative; aspect-ratio: 1; border-radius: var(--r-well); background: var(--soft); box-shadow: inset 0 0 0 1px var(--line); overflow: hidden; }
  .open { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 8px; color: var(--muted); }
  .img .open { padding: 0; }
  .open img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ficon { position: relative; display: grid; place-items: center; color: var(--ink); }
  .ficon b { position: absolute; bottom: -2px; font-family: var(--mono); font-size: 8px; font-weight: 700; background: var(--soft); padding: 0 2px; border-radius: 2px; }
  .fname { max-width: 100%; font-size: 12px; font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fsize { font-size: 11px; text-align: center; line-height: 1.2; }
  .gone .open { opacity: .65; }
  .rm {
    position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%;
    display: grid; place-items: center; background: rgb(0 0 0 / 55%); color: #fff;
  }
  .rm :global(svg) { stroke-width: 2.4; }
  .adds { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    display: inline-flex; align-items: center; gap: 7px;
    height: 36px; padding: 0 12px; border-radius: 8px;
    background: var(--soft); color: var(--muted);
    font-size: 14px; font-weight: 600; white-space: nowrap;
  }
  .chip :global(svg) { stroke-width: 2; }

  .viewer {
    width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
    background: rgb(0 0 0 / 92%); color: #fff;
    display: flex; flex-direction: column;
  }
  .viewer::backdrop { background: transparent; }
  .viewer img { flex: 1; min-height: 0; width: 100%; object-fit: contain; }
  .vbar { display: flex; align-items: center; gap: 4px; padding: 8px 12px calc(8px + env(safe-area-inset-bottom)); }
  .vname { flex: 1; min-width: 0; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .8; }
  .vbar .icon-btn { color: #fff; }
</style>
