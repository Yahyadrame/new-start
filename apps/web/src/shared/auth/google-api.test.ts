import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleSignInError, signInWithGoogle } from './google-api';

afterEach(() => vi.unstubAllGlobals());
const reply = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

describe('signInWithGoogle', () => {
  it('envoie le jeton seul à la connexion et rend la session', async () => {
    const fetchMock = reply(200, { accessToken: 'a' });
    vi.stubGlobal('fetch', fetchMock);
    expect(await signInWithGoogle('tok')).toEqual({ accessToken: 'a' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/google',
      expect.objectContaining({ body: JSON.stringify({ idToken: 'tok' }) }),
    );
  });

  it('joint le profil à l’inscription', async () => {
    const fetchMock = reply(200, {});
    vi.stubGlobal('fetch', fetchMock);
    await signInWithGoogle('tok', { firstName: 'Awa' } as never);
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body)).toEqual({
      idToken: 'tok',
      signup: { firstName: 'Awa' },
    });
  });

  it('remonte le statut et le code d’erreur de l’API', async () => {
    vi.stubGlobal('fetch', reply(404, { code: 'ACCOUNT_NOT_FOUND' }));
    await expect(signInWithGoogle('tok')).rejects.toMatchObject({
      status: 404,
      code: 'ACCOUNT_NOT_FOUND',
    });
  });

  it('accepte une réponse d’erreur sans corps', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new Error('x')) }),
    );
    const err = await signInWithGoogle('tok').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GoogleSignInError);
    expect((err as GoogleSignInError).code).toBeUndefined();
  });
});
