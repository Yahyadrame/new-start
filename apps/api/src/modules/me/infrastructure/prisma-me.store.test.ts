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
  chatBackground: 'NONE',
  pausedUntil: new Date('2026-12-01T10:00:00.000Z'),
};

function fake() {
  const tx = {
    authIdentity: { findMany: vi.fn() },
    otpCode: { deleteMany: vi.fn() },
    user: { deleteMany: vi.fn() },
  };
  const db = {
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  return { db, tx, store: new PrismaMeStore(db as unknown as PrismaService) };
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
    await store.update('u', { chatBackground: 'DOTS' });
    expect(db.user.updateMany.mock.calls[1]?.[0].data).toEqual({ chatBackground: 'DOTS' });
    await store.update('u', { pausedUntil: null });
    expect(db.user.updateMany.mock.calls[2]?.[0].data).toEqual({ pausedUntil: null });
  });

  it("enregistre l'année de naissance et les centres d'intérêt, et les relit avec le profil", async () => {
    const { db, store } = fake();
    db.user.updateMany.mockResolvedValue({ count: 1 });
    db.user.findUnique.mockResolvedValue({ ...row, birthYear: 2000, interests: ['MUSIC'] });
    expect(await store.update('u', { birthYear: 2000, interests: ['MUSIC'] })).toMatchObject({
      birthYear: 2000,
      interests: ['MUSIC'],
    });
    expect(db.user.updateMany.mock.calls[0]?.[0].data).toEqual({
      birthYear: 2000,
      interests: ['MUSIC'],
    });
    const select = db.user.findUnique.mock.calls[0]?.[0].select;
    expect(select).toMatchObject({ birthYear: true, interests: true });
  });

  it("ne touche pas à la pause quand elle n'est pas envoyée, et rend null si le compte a disparu", async () => {
    const { db, store } = fake();
    db.user.updateMany.mockResolvedValue({ count: 0 });
    expect(await store.update('u', { theme: 'DARK' })).toBeNull();
    expect(db.user.updateMany.mock.calls[0]?.[0].data).toEqual({ theme: 'DARK' });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("lit les données à exporter sans id ni jeton, et rend null si le compte n'existe pas", async () => {
    const { db, store } = fake();
    db.user.findUnique.mockResolvedValue({ firstName: 'Awa', conversations: [] });
    expect(await store.exportData('u')).toEqual({ firstName: 'Awa', conversations: [] });
    const args = db.user.findUnique.mock.calls[0]?.[0];
    expect(args.where).toEqual({ id: 'u' });
    expect(args.omit).toEqual({ id: true, updatedAt: true });
    expect(Object.keys(args.include).sort()).toEqual([
      'conversations',
      'identities',
      'levelAnswers',
    ]);
    db.user.findUnique.mockResolvedValue(null);
    expect(await store.exportData('u')).toBeNull();
  });

  it("supprime le compte et les codes liés à ses adresses, mais pas l'identifiant Google", async () => {
    const { tx, store } = fake();
    tx.authIdentity.findMany.mockResolvedValue([
      { provider: 'email', subject: 'awa@example.com' },
      { provider: 'phone', subject: '+221771234567' },
      { provider: 'google', subject: 'g-123' },
    ]);
    tx.user.deleteMany.mockResolvedValue({ count: 1 });
    expect(await store.remove('u')).toBe(true);
    expect(tx.otpCode.deleteMany).toHaveBeenCalledWith({
      where: { destination: { in: ['awa@example.com', '+221771234567'] } },
    });
    expect(tx.user.deleteMany).toHaveBeenCalledWith({ where: { id: 'u' } });
  });

  it("rend false quand le compte n'existe plus", async () => {
    const { tx, store } = fake();
    tx.authIdentity.findMany.mockResolvedValue([]);
    tx.user.deleteMany.mockResolvedValue({ count: 0 });
    expect(await store.remove('u')).toBe(false);
  });
});
