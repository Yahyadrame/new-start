import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ContactVariantsError,
  getContactVariants,
  saveContactVariant,
} from './contact-variants-api';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
afterEach(() => fetchMock.mockReset());

describe('contact-variants-api', () => {
  it('lit les réglages avec le jeton', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ jade: { tone: 'neutre' } }) });
    expect(await getContactVariants('tok')).toEqual({ jade: { tone: 'neutre' } });
    expect(fetchMock).toHaveBeenCalledWith('/api/me/contact-variants', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('envoie les réglages en PUT', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await saveContactVariant('tok', 'jade', { tone: 'soigne', difficulty: 'B2' });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('/api/me/contact-variants/jade');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ tone: 'soigne', difficulty: 'B2' });
  });

  it("revient à l'origine avec un DELETE", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await saveContactVariant('tok', 'jade', null);
    expect(fetchMock.mock.calls[0]?.[1].method).toBe('DELETE');
  });

  it('lève une erreur avec le statut', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(getContactVariants('t')).rejects.toBeInstanceOf(ContactVariantsError);
    await expect(saveContactVariant('t', 'x', null)).rejects.toMatchObject({ status: 404 });
  });
});
