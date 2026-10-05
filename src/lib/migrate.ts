import { defaultData, defaultDevice, newCounter, normSettings, THEMES, type Data, type Device, type Lang } from './model';

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Okto 1.x (`okto-v2`, or the older `okto-counter-v1`) → v3 data. */
export function migrateLegacy(v2: unknown, v1: unknown, lang: Lang): { data: Data; device: Device } | null {
  const data = defaultData(lang);
  const device = defaultDevice();

  if (isObj(v2)) {
    data.settings = normSettings({ ...v2, dashboard: undefined }, lang);
    const presets = Array.isArray(v2.presets) ? v2.presets.filter(isObj).slice(0, 20) : [];
    if (presets.length) {
      data.counters = {};
      presets.forEach((p, i) => { const c = newCounter({ ...p, order: i, history: [], updatedAt: 0 }); data.counters[c.id] = c; });
    }
    device.focusMode = v2.mode === 'pomodoro' ? 'pomodoro' : 'counter';
    device.activeCounter = typeof v2.active === 'string' && data.counters[v2.active] ? v2.active : Object.keys(data.counters)[0];
    device.locked = v2.locked === true;
    if (isObj(v2.stopwatch) && typeof v2.stopwatch.elapsed === 'number') device.stopwatch.elapsed = Math.max(0, v2.stopwatch.elapsed);
    return { data, device };
  }

  if (isObj(v1)) {
    const c = newCounter({ ...v1, name: v1.name && v1.name !== 'Счётчик' ? v1.name : '', history: [], updatedAt: 0 });
    data.counters = { [c.id]: c };
    if (typeof v1.theme === 'string' && v1.theme in THEMES) data.settings.theme = v1.theme as Data['settings']['theme'];
    device.activeCounter = c.id;
    device.locked = v1.locked === true;
    return { data, device };
  }

  return null;
}
