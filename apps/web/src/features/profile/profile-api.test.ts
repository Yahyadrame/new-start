import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileError, getMe, patchMe } from './profile-api';

afterEach(() => vi.unstubAllGlobals());
const stub = (res: Partial<Response>) => {
  const fetchMock = vi.fn().mockResolvedValue(res);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('profile-api', () => {
  it('lit le profil avec le jeton', async () => {
    const fetchMock = stub({ ok: true, json: async () => ({ id: 'u' }) });
    expect(await getMe('tok')).toEqual({ id: 'u' });
    expect(fetchMock).toHaveBeenCalledWith('/api/me', { headers: { authorization: 'Bearer tok' } });
  });

  it('envoie les modifications en JSON et rend le profil à jour', async () => {
    const fetchMock = stub({ ok: true, json: async () => ({ theme: 'DARK' }) });
    expect(await patchMe('tok', { theme: 'DARK' })).toEqual({ theme: 'DARK' });
    expect(fetchMock).toHaveBeenCalledWith('/api/me', {
      method: 'PATCH',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: '{"theme":"DARK"}',
    });
  });

  it("lève une ProfileError avec le statut quand l'API refuse", async () => {
    stub({ ok: false, status: 401 });
    await expect(getMe('tok')).rejects.toMatchObject({ status: 401 });
    await expect(getMe('tok')).rejects.toBeInstanceOf(ProfileError);
  });
});
