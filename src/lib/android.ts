type Message = { type: string; [key: string]: unknown };
type AndroidWindow = Window & {
  OktoAndroid?: { postMessage(message: string): void; onmessage: ((event: MessageEvent<string>) => void) | null };
  oktoAndroidBack?: () => boolean;
  oktoAndroidAction?: (action: string) => void;
  oktoAndroidRoute?: (hash: string) => void;
};

const host = globalThis.window as AndroidWindow | undefined;
const bridge = import.meta.env.MODE === 'android' ? host?.OktoAndroid : undefined;
export const isBundledAndroid = Boolean(bridge);
let id = 0;
const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();

if (bridge) bridge.onmessage = (event) => {
  const reply = JSON.parse(event.data);
  const request = pending.get(reply.id);
  if (!request) return;
  pending.delete(reply.id);
  if (reply.failed) request.reject(new Error('Android request failed'));
  else request.resolve(reply.value);
};

export function androidSend(message: Message) {
  bridge?.postMessage(JSON.stringify(message));
}

export function androidCall<T>(message: Message): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!bridge) { reject(new Error('Android bridge unavailable')); return; }
    const request = ++id;
    pending.set(request, { resolve, reject });
    try { androidSend({ ...message, id: request }); }
    catch (error) { pending.delete(request); reject(error); }
  });
}

export function connectAndroidUi(onPause: () => void, onAction: (action: string) => void, onRoute: (hash: string) => void) {
  if (!bridge || !host) return;
  host.oktoAndroidBack = () => {
    const dialog = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1);
    if (!dialog) return false;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (dialog.dispatchEvent(new Event('cancel', { cancelable: true }))) dialog.close();
    return true;
  };
  host.oktoAndroidAction = onAction;
  host.oktoAndroidRoute = onRoute;
  host.addEventListener('okto-android-pause', onPause);
  host.open = (url) => {
    if (url) androidSend({ type: 'external', url: String(url) });
    return null;
  };
}

export async function androidDownload(blob: Blob, name: string) {
  if (!await androidCall<boolean>({ type: 'saveStart', name, mime: blob.type })) return;
  try {
    const chunkSize = 192 * 1024;
    for (let offset = 0; offset < Math.max(blob.size, 1); offset += chunkSize) {
      const chunk = blob.slice(offset, offset + chunkSize);
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',', 2)[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(chunk);
      });
      await androidCall({ type: 'saveChunk', data });
    }
  } finally { await androidCall({ type: 'saveFinish' }); }
}
