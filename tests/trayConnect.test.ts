import { afterEach, expect, test, vi } from 'vitest';

const client = 'test-tray.apps.googleusercontent.com';
const state = 's'.repeat(43);
const challenge = 'c'.repeat(43);
const route = `#/connect-tray?state=${state}&challenge=${challenge}&port=43129&client=${client}`;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test('generates a Google authorization request tied to the local Tray callback', async () => {
  vi.stubEnv('VITE_GOOGLE_DESKTOP_CLIENT_ID', client);
  const { trayAuthorizationUrl } = await import('../src/lib/trayConnect');
  const url = new URL(trayAuthorizationUrl(route)!);
  expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    client_id: client,
    redirect_uri: 'http://127.0.0.1:43129/okto/callback',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  expect(trayAuthorizationUrl(route.replace(client, 'untrusted.apps.googleusercontent.com'))).toBeNull();
  expect(trayAuthorizationUrl(route.replace('43129', '65536'))).toBeNull();
  expect(trayAuthorizationUrl(route.replace(challenge, 'short-challenge'))).toBeNull();
});

test('leaves authorization unavailable without a configured desktop client', async () => {
  vi.stubEnv('VITE_GOOGLE_DESKTOP_CLIENT_ID', '');
  const { trayAuthorizationUrl } = await import('../src/lib/trayConnect');
  expect(trayAuthorizationUrl(route)).toBeNull();
});
