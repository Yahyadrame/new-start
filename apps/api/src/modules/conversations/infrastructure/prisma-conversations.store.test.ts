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
  const db = { conversation: { findMany: vi.fn().mockResolvedValue(rows) } };
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
});
