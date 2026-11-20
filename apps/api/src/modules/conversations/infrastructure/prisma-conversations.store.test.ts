import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaConversationsStore } from './prisma-conversations.store.js';

const agent = {
  slug: 'jade',
  name: 'Jade',
  initials: 'J',
  roleFr: 'Coloc · familier',
  category: 'Quotidien',
};

function fake(rows: unknown[]) {
  const db = {
    conversation: {
      findMany: vi.fn().mockResolvedValue(rows),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    message: { findMany: vi.fn() },
    agent: { findFirst: vi.fn(), findUniqueOrThrow: vi.fn() },
  };
  return { db, store: new PrismaConversationsStore(db as unknown as PrismaService) };
}

describe('PrismaConversationsStore', () => {
  it('ne lit que les conversations du compte, la plus récente d’abord', async () => {
    const { db, store } = fake([]);
    expect(await store.list('u1')).toEqual([]);
    const args = db.conversation.findMany.mock.calls[0]?.[0];
    expect(args.where).toEqual({ userId: 'u1' });
    expect(args.orderBy).toEqual({ lastMessageAt: 'desc' });
    expect(args.select.messages).toMatchObject({ orderBy: { createdAt: 'desc' }, take: 1 });
  });

  it('aplatit le dernier message et met la date en texte ISO', async () => {
    const { store } = fake([
      {
        id: 'c1',
        agent,
        unreadCount: 1,
        lastMessageAt: new Date('2026-11-18T10:00:00.000Z'),
        messages: [{ author: 'AGENT', text: 'Heyyy!' }],
      },
    ]);
    expect(await store.list('u1')).toEqual([
      {
        id: 'c1',
        agent,
        unreadCount: 1,
        lastMessageAt: '2026-11-18T10:00:00.000Z',
        lastMessage: { author: 'AGENT', text: 'Heyyy!' },
      },
    ]);
  });

  it('rend lastMessage null pour une conversation vide', async () => {
    const { store } = fake([
      { id: 'c2', agent, unreadCount: 0, lastMessageAt: new Date(0), messages: [] },
    ]);
    expect((await store.list('u1'))[0]?.lastMessage).toBeNull();
  });

  it('lit l’année de naissance du compte', async () => {
    const { db, store } = fake([]);
    db.user.findUnique.mockResolvedValue({ birthYear: 1999 });
    expect(await store.birthYear('u1')).toBe(1999);
    db.user.findUnique.mockResolvedValue(null);
    expect(await store.birthYear('u1')).toBeUndefined();
  });

  it('dit si le contact actif est réservé aux majeurs, ou null s’il est absent', async () => {
    const { db, store } = fake([]);
    db.agent.findFirst.mockResolvedValue({ topic: { adultOnly: true } });
    expect(await store.agentRule('maya')).toEqual({ adultOnly: true });
    expect(db.agent.findFirst.mock.calls[0]?.[0].where).toEqual({ slug: 'maya', isActive: true });
    db.agent.findFirst.mockResolvedValue({ topic: null });
    expect(await store.agentRule('jade')).toEqual({ adultOnly: false });
    db.agent.findFirst.mockResolvedValue(null);
    expect(await store.agentRule('zzz')).toBeNull();
  });

  it('crée la conversation avec le premier message, sans toucher à celle qui existe', async () => {
    const { db, store } = fake([]);
    db.agent.findUniqueOrThrow.mockResolvedValue({ id: 'a1', firstMessage: 'Hi!' });
    db.conversation.upsert.mockResolvedValue({
      id: 'c1',
      agent,
      unreadCount: 1,
      lastMessageAt: new Date('2026-11-20T10:00:00.000Z'),
      messages: [{ author: 'AGENT', text: 'Hi!' }],
    });
    const item = await store.open('u1', 'jade');
    expect(item.lastMessage).toEqual({ author: 'AGENT', text: 'Hi!' });
    expect(item.lastMessageAt).toBe('2026-11-20T10:00:00.000Z');
    const args = db.conversation.upsert.mock.calls[0]?.[0];
    expect(args.where).toEqual({ userId_agentId: { userId: 'u1', agentId: 'a1' } });
    expect(args.create).toMatchObject({
      userId: 'u1',
      agentId: 'a1',
      unreadCount: 1,
      messages: { create: { author: 'AGENT', text: 'Hi!' } },
    });
    expect(args.update).toEqual({});
  });

  it('ne rend rien pour une conversation qui n’est pas à cette personne', async () => {
    const { db, store } = fake([]);
    db.conversation.findFirst.mockResolvedValue(null);
    expect(await store.messages('u1', 'c9', null, 31)).toBeNull();
    expect(db.conversation.findFirst.mock.calls[0]?.[0].where).toEqual({ id: 'c9', userId: 'u1' });
    expect(db.message.findMany).not.toHaveBeenCalled();
  });

  it('lit les messages du plus récent au plus ancien, avant le curseur', async () => {
    const { db, store } = fake([]);
    db.conversation.findFirst.mockResolvedValue({ id: 'c1' });
    db.message.findMany.mockResolvedValue([{ id: 'm1' }]);
    const createdAt = new Date('2026-11-20T10:00:00.000Z');
    expect(await store.messages('u1', 'c1', { createdAt, id: 'm5' }, 31)).toEqual([{ id: 'm1' }]);
    const args = db.message.findMany.mock.calls[0]?.[0];
    expect(args.where).toEqual({
      conversationId: 'c1',
      OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: 'm5' } }],
    });
    expect(args.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
    expect(args.take).toBe(31);
  });

  it('lit la première page sans condition de curseur', async () => {
    const { db, store } = fake([]);
    db.conversation.findFirst.mockResolvedValue({ id: 'c1' });
    db.message.findMany.mockResolvedValue([]);
    await store.messages('u1', 'c1', null, 31);
    expect(db.message.findMany.mock.calls[0]?.[0].where).toEqual({ conversationId: 'c1' });
  });
});
