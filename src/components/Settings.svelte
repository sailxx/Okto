<script lang="ts">
  import Sheet from './Sheet.svelte';
  import Account from './Account.svelte';
  import ProfileSheet from './ProfileSheet.svelte';
  import SettingsGroup from './SettingsGroup.svelte';
  import Icon from './Icon.svelte';
  import { FLAGS } from './Nav.svelte';
  import { store } from '../lib/store.svelte';
  import { OPTIONAL_SECTIONS, THEMES, type OptionalSection, type Theme, type PomoCfg } from '../lib/model';
  import { sync } from '../lib/sync.svelte';
  import { buzz, chime, notifyGranted, requestNotify, systemNotify, unlockAudio } from '../lib/alerts';

  let { onclose }: { onclose: () => void } = $props();
  let profile = $state(false);
  const s = $derived(store.data.settings);
  const themes = Object.entries(THEMES) as [Theme, [string, string]][];
  const SECTION_LABEL: Record<OptionalSection, 'navCalls' | 'navNotes' | 'navFocus'> = { calls: 'navCalls', notes: 'navNotes', focus: 'navFocus' };
  const vibrateSupported = 'vibrate' in navigator;

  async function toggleNotify(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (!input.checked) { store.setDevice({ notify: false }); return; }
    const perm = await requestNotify();
    if (perm === 'granted') { store.setDevice({ notify: true }); systemNotify('Okto', store.t('notifyOn')); }
    else {
      input.checked = false;
      store.setDevice({ notify: false });
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

<Sheet title={store.t('settings')} {onclose} top>
  <SettingsGroup id="account" icon="sync" title={store.t('account')} summary={sync.user ? sync.user.name || sync.user.email : sync.state === 'off' ? store.t('syncOff') : store.t('syncSignedOut')}>
    <Account />
  </SettingsGroup>

  <SettingsGroup id="profile" icon="user" title={store.t('profile')} summary={s.name || store.t('namePh')}>
    <button class="line-btn wide" type="button" onclick={() => (profile = true)}>{s.name || store.t('namePh')} · {store.t('editGreeting')}</button>
  </SettingsGroup>

  <SettingsGroup id="language" icon="globe" title={store.t('language')} summary={s.lang === 'ru' ? 'Русский' : 'English'}>
    <div class="seg">
      {#each ['ru', 'en'] as const as l}
        <button type="button" aria-pressed={s.lang === l} onclick={() => store.updateSettings({ lang: l })}>{@html FLAGS[l]}{l === 'ru' ? 'Русский' : 'English'}</button>
      {/each}
    </div>
  </SettingsGroup>

  <SettingsGroup id="theme" icon="palette" title={store.t('theme')} summary={store.t('themes')[s.theme]}>
    <div class="themes">
      {#each themes as [key, [a, b]]}
        <button type="button" class="theme-opt" aria-pressed={s.theme === key} onclick={() => store.updateSettings({ theme: key })}>
          <i style:--a={a} style:--b={b}></i><span>{store.t('themes')[key]}</span>
        </button>
      {/each}
    </div>
  </SettingsGroup>

  <SettingsGroup id="sections" icon="layers" title={store.t('sections')} summary={OPTIONAL_SECTIONS.filter((x) => store.shows(x)).map((x) => store.t(SECTION_LABEL[x])).join(', ') || '—'}>
    {#each OPTIONAL_SECTIONS as section}
      <label class="switch"><span>{store.t(SECTION_LABEL[section])}</span><input type="checkbox" checked={store.shows(section)} onchange={(e) => store.toggleSection(section, e.currentTarget.checked)} /><i></i></label>
    {/each}
    <p class="sub">{store.t('sectionsHint')}</p>
  </SettingsGroup>

  <SettingsGroup id="alerts" icon="bell" title={store.t('alerts')} summary={[store.device.notify && notifyGranted() ? store.t('notifications') : '', s.sound ? store.t('soundLabel') : '', vibrateSupported && s.vibrate ? store.t('vibration') : ''].filter(Boolean).join(', ') || '—'}>
    <label class="switch"><span>{store.t('notifications')}</span><input type="checkbox" checked={store.device.notify && notifyGranted()} onchange={toggleNotify} /><i></i></label>
    <label class="switch"><span>{store.t('soundLabel')}</span><input type="checkbox" checked={s.sound} onchange={(e) => { unlockAudio(); store.updateSettings({ sound: e.currentTarget.checked }); if (e.currentTarget.checked) chime(1); }} /><i></i></label>
    {#if vibrateSupported}
      <label class="switch"><span>{store.t('vibration')}</span><input type="checkbox" checked={s.vibrate} onchange={(e) => { store.updateSettings({ vibrate: e.currentTarget.checked }); buzz(20); }} /><i></i></label>
    {/if}
  </SettingsGroup>

  {#if store.shows('focus')}
    <SettingsGroup id="pomodoro" icon="tomato" title="Pomodoro" summary={store.t('pomo')[s.pomo.preset]}>
      <label class="switch"><span>{store.t('autoStart')}</span><input type="checkbox" checked={s.pomo.autoStart} onchange={(e) => store.updateSettings({ pomo: { ...s.pomo, autoStart: e.currentTarget.checked } })} /><i></i></label>
      <p class="sub">{store.t('customTitle')}</p>
      <div class="nums">
        {#each customFields as [key, label, min, max]}
          <label><span>{store.t(label)}</span><input type="number" {min} {max} inputmode="numeric" value={s.pomo.custom[key]} onchange={(e) => setCustom(key, min, max, e)} /></label>
        {/each}
      </div>
      <div class="links">
        <button class="link-btn" type="button" onclick={() => { store.setDevice({ stopwatch: { elapsed: 0, startedAt: null, laps: [] } }); store.toast(store.t('reset')); }}>{store.t('resetStopwatch')}</button>
      </div>
    </SettingsGroup>
  {/if}

  <a class="ask" href="https://t.me/arkhitkovv" target="_blank" rel="noopener noreferrer">
    <span class="chip"><Icon name="send" size={17} /></span>
    <span class="txt"><b>{store.t('askTg')}</b><small>{store.t('askTgSub')}</small></span>
    <span class="arrow" aria-hidden="true">↗</span>
  </a>

  <form method="dialog"><button class="solid-btn">{store.t('done')}</button></form>
</Sheet>
{#if profile}<ProfileSheet onclose={() => (profile = false)} />{/if}

<style>
  .wide { width: 100%; justify-items: start; padding: 0 16px; font-weight: 500; }
  .ask { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding: 12px 14px; border-radius: 20px; color: var(--ink); text-decoration: none; background: color-mix(in srgb, var(--soft) 78%, var(--bg)); box-shadow: inset 0 0 0 1px var(--line); }
  .ask:hover { box-shadow: inset 0 0 0 1px var(--key-edge); }
  .ask .chip { display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%; background: color-mix(in srgb, var(--ink) 8%, transparent); }
  .ask .chip :global(svg) { stroke-width: 2; }
  .ask .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .ask b { font-size: 16px; font-weight: 600; }
  .ask small { color: var(--muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ask .arrow { display: grid; place-items: center; flex: 0 0 auto; width: 28px; height: 28px; border-radius: 50%; background: var(--ink); color: var(--bg); font-size: 14px; }
</style>
