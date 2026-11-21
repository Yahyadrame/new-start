import { describe, expect, it, vi } from 'vitest';
import { NOTIFICATIONS_LIMIT, NotificationsService } from './notifications.js';

describe('NotificationsService', () => {
  it('lit les notifications récentes de la personne, limitées à 30', async () => {
    const items = [
      {
        id: 'n1',
        kind: 'reminder',
        title: 'T',
        body: 'B',
        createdAt: '2026-11-21T19:00:00Z',
        read: false,
      },
    ];
    const recent = vi.fn().mockResolvedValue(items);
    expect(await new NotificationsService({ recent, markAllRead: vi.fn() }).list('u1')).toEqual(
      items,
    );
    expect(recent).toHaveBeenCalledWith('u1', NOTIFICATIONS_LIMIT);
    expect(NOTIFICATIONS_LIMIT).toBe(30);
  });

  it('marque tout comme lu à l’heure donnée', async () => {
    const markAllRead = vi.fn().mockResolvedValue(undefined);
    const now = new Date('2026-11-21T14:00:00Z');
    await new NotificationsService({ recent: vi.fn(), markAllRead }).markAllRead('u1', now);
    expect(markAllRead).toHaveBeenCalledWith('u1', now);
  });
});
