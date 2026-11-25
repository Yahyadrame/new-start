import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactAvatarsError, getContactAvatars, saveContactAvatar } from './contact-avatars-api';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
afterEach(() => fetchMock.mockReset());

describe('contact-avatars-api', () => {
  it('lit les choix avec le jeton', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ jade: { id: 'a001' } }) });
    expect(await getContactAvatars('tok')).toEqual({ jade: { id: 'a001' } });
    expect(fetchMock).toHaveBeenCalledWith('/api/me/contact-avatars', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('envoie le choix en PUT', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await saveContactAvatar('tok', 'jade', { id: 'a005', variant: 'noir' });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/me/contact-avatars/jade');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ id: 'a005', variant: 'noir' });
  });

  it("revient à l'original avec un DELETE", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await saveContactAvatar('tok', 'jade', null);
    expect(fetchMock.mock.calls[0]?.[1].method).toBe('DELETE');
  });

  it('lève une erreur avec le statut', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(getContactAvatars('t')).rejects.toBeInstanceOf(ContactAvatarsError);
    await expect(saveContactAvatar('t', 'x', null)).rejects.toMatchObject({ status: 404 });
  });
});
