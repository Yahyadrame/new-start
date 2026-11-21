import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchNotifications, markAllRead, NotificationsError } from './notifications-api';

afterEach(() => vi.unstubAllGlobals());

describe('fetchNotifications', () => {
  it('lit la liste avec le jeton', async () => {
    const items = [
      { id: 'n1', kind: 'reminder', title: 'T', body: 'B', createdAt: 'x', read: false },
    ];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => items });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchNotifications('tok')).toEqual(items);
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève NotificationsError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(fetchNotifications('tok')).rejects.toBeInstanceOf(NotificationsError);
  });
});

describe('markAllRead', () => {
  it('envoie un POST avec le jeton', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await markAllRead('tok');
    expect(fetchMock).toHaveBeenCalledWith('/api/notifications/read-all', {
      method: 'POST',
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('lève NotificationsError quand l’API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(markAllRead('tok')).rejects.toBeInstanceOf(NotificationsError);
  });
});
