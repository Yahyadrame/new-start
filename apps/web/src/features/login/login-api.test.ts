import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginError, requestLoginCode, verifyLoginCode } from './login-api';

afterEach(() => vi.unstubAllGlobals());
const stub = (res: object) => {
  const fetchMock = vi.fn().mockResolvedValue(res);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('requestLoginCode', () => {
  it("demande le code sans profil d'inscription", async () => {
    const fetchMock = stub({ ok: true });
    await requestLoginCode('awa@example.com');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channel: 'email', destination: 'awa@example.com' }),
    });
  });
  it('lève une erreur avec le statut quand l’API refuse', async () => {
    stub({ ok: false, status: 429 });
    await expect(requestLoginCode('a@b.co')).rejects.toMatchObject({ status: 429 });
    await expect(requestLoginCode('a@b.co')).rejects.toBeInstanceOf(LoginError);
  });
});

describe('verifyLoginCode', () => {
  it('rend la session', async () => {
    const session = { accessToken: 'tok' };
    const fetchMock = stub({ ok: true, json: async () => session });
    expect(await verifyLoginCode('awa@example.com', '123456')).toBe(session);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/otp/verify',
      expect.objectContaining({
        body: JSON.stringify({ channel: 'email', destination: 'awa@example.com', code: '123456' }),
      }),
    );
  });
  it('lève une erreur avec le statut quand le code est refusé', async () => {
    stub({ ok: false, status: 404 });
    await expect(verifyLoginCode('a@b.co', '123456')).rejects.toMatchObject({ status: 404 });
  });
});
