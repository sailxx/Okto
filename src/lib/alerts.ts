// Sound, vibration and system notifications (ported from Okto 1.0). The service worker also keeps Okto starting offline.
import { androidCall, androidSend, isBundledAndroid } from './android';

let audio: AudioContext | undefined;
let swReg: ServiceWorkerRegistration | null = null;
let androidPermission: NotificationPermission = 'default';

if (import.meta.env.MODE !== 'android' && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').then((r) => { swReg = r; }).catch(() => {});
}

export function unlockAudio() {
  if (audio) return;
  try { audio = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { /* no audio */ }
}

export function chime(times = 3) {
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume();
  const now = audio.currentTime;
  for (let i = 0; i < times; i++) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = i % 2 ? 660 : 880;
    const start = now + i * 0.28;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.26);
  }
}

/** Inside the Okto Android app (TWA): Chrome passes the app as the referrer on launch; reloads keep the tab's session. */
export const inAndroidApp = isBundledAndroid || (() => {
  try {
    if (document.referrer.startsWith('android-app://com.sailxx.okto')) sessionStorage.setItem('okto-twa', '1');
    return sessionStorage.getItem('okto-twa') === '1';
  } catch { return false; }
})();

export const vibrationSupported = isBundledAndroid || 'vibrate' in navigator;

export function buzz(pattern: number | number[]) {
  if (isBundledAndroid) androidSend({ type: 'vibrate', pattern: Array.isArray(pattern) ? pattern : [pattern] });
  else navigator.vibrate?.(pattern);
}

const FOCUS_HAPTICS = {
  increment: { pattern: [14], amplitudes: [104] },
  decrement: { pattern: [20], amplitudes: [78] },
  adjust: { pattern: [13], amplitudes: [86] },
  start: { pattern: [14, 32, 24], amplitudes: [82, 0, 142] },
  pause: { pattern: [23, 29, 13], amplitudes: [128, 0, 70] },
  lap: { pattern: [15, 24, 16], amplitudes: [112, 0, 112] },
  reset: { pattern: [33], amplitudes: [138] },
  goal: { pattern: [18, 40, 32], amplitudes: [105, 0, 184] },
  interval: { pattern: [22, 44, 22, 44, 34], amplitudes: [121, 0, 121, 0, 174] },
  timerDone: { pattern: [36, 48, 24, 43, 20], amplitudes: [178, 0, 134, 0, 95] },
};

export type FocusHaptic = keyof typeof FOCUS_HAPTICS;

export function buzzFocus(kind: FocusHaptic) {
  const { pattern, amplitudes } = FOCUS_HAPTICS[kind];
  if (isBundledAndroid) androidSend({ type: 'vibrate', pattern, amplitudes });
  else buzz(pattern);
}

export const notifySupported = () => isBundledAndroid || 'Notification' in window;
export const notifyGranted = () => isBundledAndroid ? androidPermission === 'granted' : notifySupported() && Notification.permission === 'granted';

export async function readAndroidPermission(type: 'ready' | 'permission') {
  if (isBundledAndroid) androidPermission = await androidCall<NotificationPermission>({ type });
}

export async function requestNotify(): Promise<NotificationPermission | 'unsupported'> {
  if (isBundledAndroid) return androidPermission = await androidCall<NotificationPermission>({ type: 'requestPermission' });
  if (!notifySupported()) return 'unsupported';
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  return perm;
}

export async function systemNotify(title: string, body: string, tag = 'okto') {
  if (!notifyGranted()) return;
  if (isBundledAndroid) { androidSend({ type: 'notify', title, body, tag }); return; }
  const opts: NotificationOptions & { renotify?: boolean } = { body, icon: './assets/icon-192.png', badge: './assets/icon-192.png', tag, renotify: true };
  try {
    const reg = swReg || (await navigator.serviceWorker?.getRegistration());
    if (reg) { await reg.showNotification(title, opts); return; }
  } catch { /* fall back */ }
  try { new Notification(title, opts); } catch { /* not allowed here */ }
}
