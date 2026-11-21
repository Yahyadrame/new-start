import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchUnreadCount } from './unread-count';

afterEach(() => vi.unstubAllGlobals());

describe('fetchUnreadCount', () => {
  it('lit le compteur avec le jeton', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 4 }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchUnreadCount('tok')).toBe(4);
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications/unread-count', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève une erreur quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(fetchUnreadCount('tok')).rejects.toThrow('unread-count 401');
  });
});
