import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaNotificationsStore } from './prisma-notifications.store.js';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'n1',
  kind: 'reminder',
  title: 'T',
  body: 'B',
  createdAt: new Date('2026-11-21T19:00:00Z'),
  readAt: null,
  ...over,
});

describe('PrismaNotificationsStore.recent', () => {
  it('lit les plus récentes de la personne, et seulement les siennes', async () => {
    const findMany = vi.fn().mockResolvedValue([row(), row({ id: 'n2', readAt: new Date() })]);
    const store = new PrismaNotificationsStore({
      notificationLog: { findMany },
    } as unknown as PrismaService);
    const items = await store.recent('u1', 30);
    expect(items).toEqual([
      {
        id: 'n1',
        kind: 'reminder',
        title: 'T',
        body: 'B',
        createdAt: '2026-11-21T19:00:00.000Z',
        read: false,
      },
      {
        id: 'n2',
        kind: 'reminder',
        title: 'T',
        body: 'B',
        createdAt: '2026-11-21T19:00:00.000Z',
        read: true,
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  });
});

describe('PrismaNotificationsStore.markAllRead', () => {
  it('ne touche que les notifications non lues de la personne', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const store = new PrismaNotificationsStore({
      notificationLog: { updateMany },
    } as unknown as PrismaService);
    const now = new Date('2026-11-21T14:00:00Z');
    await store.markAllRead('u1', now);
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', readAt: null },
      data: { readAt: now },
    });
  });
});
