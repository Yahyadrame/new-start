import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChatBackground } from './chat-background-api';

afterEach(() => vi.unstubAllGlobals());

describe('getChatBackground', () => {
  it('renvoie le fond du compte', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ chatBackground: 'GRID' }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(getChatBackground('tok')).resolves.toBe('GRID');
    expect(fetchMock).toHaveBeenCalledWith('/api/me', { headers: { authorization: 'Bearer tok' } });
  });

  it("échoue quand l'API refuse", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(getChatBackground('tok')).rejects.toThrow('me 401');
  });
});
