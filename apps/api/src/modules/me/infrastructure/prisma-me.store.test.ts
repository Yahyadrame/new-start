import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaMeStore } from './prisma-me.store.js';

const row = {
  id: 'u',
  firstName: 'Awa',
  goal: 'WORK',
  level: 'B1',
  theme: 'SYSTEM',
  reminderTime: null,
  timezone: 'Africa/Dakar',
  dailyGoalMin: 15,
  preferredAccent: 'en-US',
  dataSaver: false,
  pausedUntil: new Date('2026-12-01T10:00:00.000Z'),
};

function fake() {
  const db = { user: { findUnique: vi.fn(), updateMany: vi.fn() } };
  return { db, store: new PrismaMeStore(db as unknown as PrismaService) };
}

describe('PrismaMeStore', () => {
  it('lit le profil et met la fin de pause en texte ISO', async () => {
    const { db, store } = fake();
    db.user.findUnique.mockResolvedValue(row);
    expect(await store.find('u')).toMatchObject({ pausedUntil: '2026-12-01T10:00:00.000Z' });
    expect(db.user.findUnique.mock.calls[0]?.[0].where).toEqual({ id: 'u' });
  });

  it("rend null quand le compte n'existe pas", async () => {
    const { db, store } = fake();
    db.user.findUnique.mockResolvedValue(null);
    expect(await store.find('u')).toBeNull();
  });

  it('écrit la pause en date, ou la retire, et relit le profil', async () => {
    const { db, store } = fake();
    db.user.updateMany.mockResolvedValue({ count: 1 });
    db.user.findUnique.mockResolvedValue({ ...row, pausedUntil: null });
    await store.update('u', { pausedUntil: '2026-12-01T10:00:00.000Z', dataSaver: true });
    expect(db.user.updateMany.mock.calls[0]?.[0]).toEqual({
      where: { id: 'u' },
      data: { dataSaver: true, pausedUntil: new Date('2026-12-01T10:00:00.000Z') },
    });
    await store.update('u', { pausedUntil: null });
    expect(db.user.updateMany.mock.calls[1]?.[0].data).toEqual({ pausedUntil: null });
  });

  it("ne touche pas à la pause quand elle n'est pas envoyée, et rend null si le compte a disparu", async () => {
    const { db, store } = fake();
    db.user.updateMany.mockResolvedValue({ count: 0 });
    expect(await store.update('u', { theme: 'DARK' })).toBeNull();
    expect(db.user.updateMany.mock.calls[0]?.[0].data).toEqual({ theme: 'DARK' });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
});
