import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../generated/prisma/client.js';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { NewMediaMessage } from '../application/media-messages-store.js';
import { PrismaMediaMessagesStore } from './prisma-media-messages.store.js';

const clientId = '0198f0a0-0000-4000-8000-000000000002';
const user = {
  streakDays: 1,
  lastActiveDay: new Date('2026-11-26T00:00:00Z'),
  timezone: 'Africa/Dakar',
  pausedUntil: null,
};
const voice: NewMediaMessage = {
  clientId,
  kind: 'AUDIO',
  text: 'Hello there',
  mediaKey: 'audio/u1/a.webm',
  mediaProvider: 'b2',
  mediaSeconds: 4,
};
function setup(today: Record<string, number> | null = null) {
  const db = {
    conversation: { findFirst: vi.fn().mockResolvedValue({ id: 'c1' }), update: vi.fn() },
    message: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
    user: { findUnique: vi.fn().mockResolvedValue(user), update: vi.fn() },
    dailyActivity: { findUnique: vi.fn().mockResolvedValue(today), upsert: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([{ id: 'm1' }]),
  };
  return { db, store: new PrismaMediaMessagesStore(db as unknown as PrismaService) };
}

describe('PrismaMediaMessagesStore.check', () => {
  const check = (store: PrismaMediaMessagesStore, kind: 'AUDIO' | 'IMAGE' = 'AUDIO') =>
    store.check('u1', 'c1', clientId, kind, 30);

  it('ne rend rien pour une conversation qui n’est pas à cette personne', async () => {
    const { db, store } = setup();
    db.conversation.findFirst.mockResolvedValue(null);
    expect(await check(store)).toBeNull();
    expect(db.conversation.findFirst.mock.calls[0]?.[0].where).toEqual({
      id: 'c1',
      userId: 'u1',
    });
  });

  it('rend le message déjà envoyé, même à la limite', async () => {
    const { db, store } = setup({ messagesSent: 60, voiceSent: 30 });
    db.message.findUnique.mockResolvedValue({ id: 'm0' });
    expect(await check(store)).toEqual({ row: { id: 'm0' }, created: false });
    expect(db.message.findUnique.mock.calls[0]?.[0].where).toEqual({
      conversationId_clientId: { conversationId: 'c1', clientId },
    });
  });

  it('laisse passer sous les limites, y compris au premier envoi du jour', async () => {
    expect(await check(setup().store)).toEqual({ ready: true });
    const last = setup({ voiceSent: 29, photosSent: 30 });
    expect(await check(last.store)).toEqual({ ready: true });
  });

  it('compte les vocaux et les photos chacun de leur côté', async () => {
    const { store } = setup({ voiceSent: 30, photosSent: 2 });
    expect(await check(store, 'AUDIO')).toEqual({ limited: true });
    expect(await check(store, 'IMAGE')).toEqual({ ready: true });
    const photos = setup({ voiceSent: 0, photosSent: 30 });
    expect(await check(photos.store, 'IMAGE')).toEqual({ limited: true });
  });

  it('ne dépend pas de la limite des messages écrits', async () => {
    const { store } = setup({ messagesSent: 60, voiceSent: 0, photosSent: 0 });
    expect(await check(store)).toEqual({ ready: true });
  });
});

describe('PrismaMediaMessagesStore.hasVoiceConsent', () => {
  it.each([
    [{ voiceConsentAt: new Date() }, true],
    [{ voiceConsentAt: null }, false],
    [null, false],
  ])('lit la date de l’accord (%o)', async (found, expected) => {
    const { db, store } = setup();
    db.user.findUnique.mockResolvedValue(found);
    expect(await store.hasVoiceConsent('u1')).toBe(expected);
    expect(db.user.findUnique.mock.calls[0]?.[0].where).toEqual({ id: 'u1' });
  });
});

describe('PrismaMediaMessagesStore.create', () => {
  it('enregistre le fichier, compte un vocal et ajoute les XP dans la même transaction', async () => {
    const { db, store } = setup();
    expect(await store.create('u1', 'c1', voice)).toEqual({ row: { id: 'm1' }, created: true });
    expect(db.message.create.mock.calls[0]?.[0].data).toEqual({
      conversationId: 'c1',
      author: 'USER',
      ...voice,
    });
    expect(db.user.update.mock.calls[0]?.[0].data).toMatchObject({ xp: { increment: 10 } });
    const counters = db.dailyActivity.upsert.mock.calls[0]?.[0].create;
    expect(counters).toMatchObject({ voiceSent: 1, xpEarned: 10 });
    expect(counters).not.toHaveProperty('photosSent');
    expect(counters).not.toHaveProperty('messagesSent');
    expect(db.$transaction.mock.calls[0]?.[0]).toHaveLength(4);
  });

  it('compte une photo à part', async () => {
    const { db, store } = setup();
    await store.create('u1', 'c1', { ...voice, kind: 'IMAGE', text: '', mediaSeconds: null });
    const counters = db.dailyActivity.upsert.mock.calls[0]?.[0].create;
    expect(counters).toMatchObject({ photosSent: 1 });
    expect(counters).not.toHaveProperty('voiceSent');
  });

  it('retrouve le message quand un envoi simultané du même clientId a gagné', async () => {
    const { db, store } = setup();
    db.message.findUnique.mockResolvedValue({ id: 'm0' });
    db.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
    );
    expect(await store.create('u1', 'c1', voice)).toEqual({ row: { id: 'm0' }, created: false });
  });
});

describe('PrismaMediaMessagesStore.sentToday', () => {
  it('lit le compteur du jour de la personne, vocaux et photos à part', async () => {
    const { db, store } = setup({ voiceSent: 3, photosSent: 7 });
    expect(await store.sentToday('u1', 'AUDIO')).toBe(3);
    expect(await store.sentToday('u1', 'IMAGE')).toBe(7);
    expect(db.dailyActivity.findUnique.mock.calls[0]?.[0].where.userId_day.userId).toBe('u1');
  });

  it('vaut zéro avant le premier envoi du jour', async () => {
    expect(await setup().store.sentToday('u1', 'AUDIO')).toBe(0);
  });
});
