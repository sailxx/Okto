// Sound, vibration and system notifications (ported from Okto 1.0). The service worker also keeps Okto starting offline.
let audio: AudioContext | undefined;
let swReg: ServiceWorkerRegistration | null = null;

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
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

export const buzz = (pattern: number | number[]) => navigator.vibrate?.(pattern);

export const notifySupported = () => 'Notification' in window;
export const notifyGranted = () => notifySupported() && Notification.permission === 'granted';

export async function requestNotify(): Promise<NotificationPermission | 'unsupported'> {
  if (!notifySupported()) return 'unsupported';
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  return perm;
}

export async function systemNotify(title: string, body: string, tag = 'okto') {
  if (!notifyGranted()) return;
  const opts: NotificationOptions & { renotify?: boolean } = { body, icon: './assets/icon-192.png', badge: './assets/icon-192.png', tag, renotify: true };
  try {
    const reg = swReg || (await navigator.serviceWorker?.getRegistration());
    if (reg) { await reg.showNotification(title, opts); return; }
  } catch { /* fall back */ }
  try { new Notification(title, opts); } catch { /* not allowed here */ }
}
