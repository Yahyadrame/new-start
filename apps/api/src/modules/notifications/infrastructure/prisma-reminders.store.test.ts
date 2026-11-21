import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaRemindersStore } from './prisma-reminders.store.js';

const make = (users: unknown[] = [], create = vi.fn().mockResolvedValue({})) => {
  const findMany = vi.fn().mockResolvedValue(users);
  const store = new PrismaRemindersStore({
    user: { findMany },
    notificationLog: { create },
  } as unknown as PrismaService);
  return { store, findMany, create };
};

describe('PrismaRemindersStore.candidates', () => {
  it('lit ceux qui ont une heure de rappel, avec leur dernier rappel', async () => {
    const s = make([
      {
        id: 'u1',
        reminderTime: '19:00',
        timezone: 'Africa/Dakar',
        lastActiveDay: new Date('2026-11-20T00:00:00Z'),
        pausedUntil: null,
        notifications: [{ day: '2026-11-19' }],
      },
      {
        id: 'u2',
        reminderTime: '08:00',
        timezone: 'Africa/Dakar',
        lastActiveDay: null,
        pausedUntil: null,
        notifications: [],
      },
    ]);
    expect(await s.store.candidates()).toEqual([
      {
        userId: 'u1',
        reminderTime: '19:00',
        timezone: 'Africa/Dakar',
        lastActiveDay: '2026-11-20',
        lastReminderDay: '2026-11-19',
        pausedUntil: null,
      },
      {
        userId: 'u2',
        reminderTime: '08:00',
        timezone: 'Africa/Dakar',
        lastActiveDay: null,
        lastReminderDay: null,
        pausedUntil: null,
      },
    ]);
    expect(s.findMany.mock.calls[0]?.[0].where).toEqual({ reminderTime: { not: null } });
  });
});

describe('PrismaRemindersStore.record', () => {
  it('écrit la ligne du jour et rend true', async () => {
    const s = make();
    expect(await s.store.record('u1', '2026-11-21', 'T', 'B')).toBe(true);
    expect(s.create).toHaveBeenCalledWith({
      data: { userId: 'u1', kind: 'reminder', day: '2026-11-21', title: 'T', body: 'B' },
    });
  });

  it('rend false quand la ligne du jour existe déjà (clé unique)', async () => {
    const s = make([], vi.fn().mockRejectedValue({ code: 'P2002' }));
    expect(await s.store.record('u1', '2026-11-21', 'T', 'B')).toBe(false);
  });

  it('laisse remonter les autres erreurs', async () => {
    const s = make([], vi.fn().mockRejectedValue(new Error('base coupée')));
    await expect(s.store.record('u1', '2026-11-21', 'T', 'B')).rejects.toThrow('base coupée');
  });
});
