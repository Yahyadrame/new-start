import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyCode, VerifyCodeError } from './verify-code';

afterEach(() => vi.unstubAllGlobals());
const reply = (init: object) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(init));

describe('verifyCode', () => {
  it("envoie l'e-mail et le code, puis rend la session", async () => {
    const session = { accessToken: 'a', expiresInSeconds: 900, user: { id: 'u1' } };
    reply({ ok: true, json: async () => session });
    await expect(verifyCode('awa@example.com', '123456')).resolves.toEqual(session);
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/otp/verify');
    expect(JSON.parse(init.body as string)).toEqual({
      channel: 'email',
      destination: 'awa@example.com',
      code: '123456',
    });
  });
  it("lève une erreur avec le statut et le code de l'API", async () => {
    reply({ ok: false, status: 400, json: async () => ({ code: 'INVALID_CODE' }) });
    await expect(verifyCode('awa@example.com', '000000')).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_CODE',
    });
  });
  it("garde le statut quand la réponse d'erreur n'est pas du JSON", async () => {
    reply({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('html');
      },
    });
    const err = await verifyCode('awa@example.com', '000000').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VerifyCodeError);
    expect(err).toMatchObject({ status: 502, code: undefined });
  });
});
