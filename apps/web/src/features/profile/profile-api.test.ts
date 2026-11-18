import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileError, deleteMe, exportMe, getMe, patchMe } from './profile-api';

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

  it('télécharge l’export', async () => {
    const blob = new Blob(['{}']);
    const fetchMock = stub({ ok: true, blob: async () => blob });
    expect(await exportMe('tok')).toBe(blob);
    expect(fetchMock).toHaveBeenCalledWith('/api/me/export', {
      headers: { authorization: 'Bearer tok' },
    });
    stub({ ok: false, status: 404 });
    await expect(exportMe('tok')).rejects.toMatchObject({ status: 404 });
  });

  it('supprime le compte puis efface le cookie de session', async () => {
    const fetchMock = stub({ ok: true });
    await deleteMe('tok');
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/me', {
      method: 'DELETE',
      headers: { authorization: 'Bearer tok' },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/logout', { method: 'POST' });
  });

  it('ne touche pas au cookie quand la suppression échoue', async () => {
    const fetchMock = stub({ ok: false, status: 500 });
    await expect(deleteMe('tok')).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
