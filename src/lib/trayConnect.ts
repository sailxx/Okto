const googleClientId = import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID as string | undefined;
const base64Url = /^[A-Za-z0-9_-]{43}$/;

export function trayBrowserConnection(hash: string) {
  if (!hash.startsWith('#/connect-tray?')) return null;
  const params = new URLSearchParams(hash.slice('#/connect-tray?'.length));
  const state = params.get('state') ?? '';
  const port = params.get('port') ?? '';
  if (params.get('flow') !== 'browser' || !base64Url.test(state) ||
      !/^\d{1,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535) return null;
  return { state, endpoint: `http://127.0.0.1:${Number(port)}/okto/callback` };
}

export function trayAuthorizationUrl(hash: string): string | null {
  if (!hash.startsWith('#/connect-tray?') || !googleClientId) return null;
  const params = new URLSearchParams(hash.slice('#/connect-tray?'.length));
  const state = params.get('state') ?? '';
  const challenge = params.get('challenge') ?? '';
  const port = params.get('port') ?? '';
  if (!base64Url.test(state) || !base64Url.test(challenge) || !/^\d{1,5}$/.test(port) ||
      Number(port) < 1024 || Number(port) > 65535 || params.get('client') !== googleClientId) return null;

  const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  google.search = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `http://127.0.0.1:${Number(port)}/okto/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return google.href;
}
