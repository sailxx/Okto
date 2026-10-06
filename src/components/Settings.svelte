<script lang="ts">
  import Sheet from './Sheet.svelte';
  import Account from './Account.svelte';
  import ProfileSheet from './ProfileSheet.svelte';
  import { FLAGS } from './Nav.svelte';
  import { store } from '../lib/store.svelte';
  import { THEMES, type Theme, type PomoCfg } from '../lib/model';
  import { buzz, chime, notifyGranted, requestNotify, systemNotify, unlockAudio } from '../lib/alerts';

  let { onclose }: { onclose: () => void } = $props();
  let profile = $state(false);
  const s = $derived(store.data.settings);
  const themes = Object.entries(THEMES) as [Theme, [string, string]][];
  const vibrateSupported = 'vibrate' in navigator;

  async function toggleNotify(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (!input.checked) { store.updateSettings({ notify: false }); return; }
    const perm = await requestNotify();
    if (perm === 'granted') { store.updateSettings({ notify: true }); systemNotify('Okto', store.t('notifyOn')); }
    else {
      input.checked = false;
      store.updateSettings({ notify: false });
      store.toast(perm === 'unsupported' ? store.t('notifyUnsupported') : store.t('notifyDenied'));
    }
  }

  const customFields: [keyof PomoCfg, 'focus' | 'shortBreak' | 'longBreak' | 'every', number, number][] = [
    ['work', 'focus', 1, 180], ['short', 'shortBreak', 1, 60], ['long', 'longBreak', 1, 90], ['every', 'every', 2, 12],
  ];
  function setCustom(key: keyof PomoCfg, min: number, max: number, e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const v = parseInt(input.value, 10);
    if (Number.isInteger(v) && v >= min && v <= max) {
      store.updateSettings({ pomo: { ...s.pomo, custom: { ...s.pomo.custom, [key]: v } } });
      if (s.pomo.preset === 'custom' && !store.pomoRunning()) store.setDevice({ pomo: { ...store.device.pomo, remaining: null } });
    } else input.value = String(s.pomo.custom[key]);
  }
</script>

<Sheet title={store.t('settings')} {onclose}>
  <Account />

  <div class="group">
    <span class="label">{store.t('profile')}</span>
    <button class="line-btn wide" type="button" onclick={() => (profile = true)}>{s.name || store.t('namePh')} · {store.t('editGreeting')}</button>
  </div>

  <div class="group">
    <span class="label">{store.t('language')}</span>
    <div class="seg">
      {#each ['ru', 'en'] as const as l}
        <button type="button" aria-pressed={s.lang === l} onclick={() => store.updateSettings({ lang: l })}>{@html FLAGS[l]}{l === 'ru' ? 'Русский' : 'English'}</button>
      {/each}
    </div>
  </div>

  <div class="group">
    <span class="label">{store.t('theme')}</span>
    <div class="themes">
      {#each themes as [key, [a, b]]}
        <button type="button" class="theme-opt" aria-pressed={s.theme === key} onclick={() => store.updateSettings({ theme: key })}>
          <i style:--a={a} style:--b={b}></i><span>{store.t('themes')[key]}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="group">
    <span class="label">{store.t('alerts')}</span>
    <label class="switch"><span>{store.t('notifications')}</span><input type="checkbox" checked={s.notify && notifyGranted()} onchange={toggleNotify} /><i></i></label>
    <label class="switch"><span>{store.t('soundLabel')}</span><input type="checkbox" checked={s.sound} onchange={(e) => { unlockAudio(); store.updateSettings({ sound: e.currentTarget.checked }); if (e.currentTarget.checked) chime(1); }} /><i></i></label>
    {#if vibrateSupported}
      <label class="switch"><span>{store.t('vibration')}</span><input type="checkbox" checked={s.vibrate} onchange={(e) => { store.updateSettings({ vibrate: e.currentTarget.checked }); buzz(20); }} /><i></i></label>
    {/if}
  </div>

  <div class="group">
    <span class="label">Pomodoro</span>
    <label class="switch"><span>{store.t('autoStart')}</span><input type="checkbox" checked={s.pomo.autoStart} onchange={(e) => store.updateSettings({ pomo: { ...s.pomo, autoStart: e.currentTarget.checked } })} /><i></i></label>
    <p class="sub">{store.t('customTitle')}</p>
    <div class="nums">
      {#each customFields as [key, label, min, max]}
        <label><span>{store.t(label)}</span><input type="number" {min} {max} inputmode="numeric" value={s.pomo.custom[key]} onchange={(e) => setCustom(key, min, max, e)} /></label>
      {/each}
    </div>
  </div>

  <div class="links">
    <button class="link-btn" type="button" onclick={() => { store.setDevice({ stopwatch: { elapsed: 0, startedAt: null, laps: [] } }); store.toast(store.t('reset')); }}>{store.t('resetStopwatch')}</button>
  </div>
  <form method="dialog"><button class="solid-btn">{store.t('done')}</button></form>
</Sheet>
{#if profile}<ProfileSheet onclose={() => (profile = false)} />{/if}

<style>
  .wide { width: 100%; justify-items: start; padding: 0 16px; font-weight: 500; }
</style>
