import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../generated/prisma/client.js';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaConversationsStore } from './prisma-conversations.store.js';

const agent = {
  slug: 'jade',
  name: 'Jade',
  initials: 'J',
  roleFr: 'Coloc · familier',
  category: 'Quotidien',
  accent: 'en-US',
  bioFr: 'Ta colocataire.',
  interests: ['Séries'],
  level: 'B1',
};

function fake(rows: unknown[]) {
  const db = {
    conversation: {
      findMany: vi.fn().mockResolvedValue(rows),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn(), update: vi.fn() },
    dailyActivity: { upsert: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    message: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    correction: { deleteMany: vi.fn() },
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

  describe('markRead', () => {
    it('ne touche à rien quand la conversation n’est pas à cette personne', async () => {
      const { db, store } = fake([]);
      db.conversation.findFirst.mockResolvedValue(null);
      expect(await store.markRead('u1', 'c9')).toBe(false);
      expect(db.conversation.findFirst.mock.calls[0]?.[0].where).toEqual({
        id: 'c9',
        userId: 'u1',
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('date les messages du contact et remet le compteur à zéro', async () => {
      const { db, store } = fake([]);
      db.conversation.findFirst.mockResolvedValue({ id: 'c1' });
      expect(await store.markRead('u1', 'c1')).toBe(true);
      expect(db.message.updateMany.mock.calls[0]?.[0].where).toEqual({
        conversationId: 'c1',
        author: { not: 'USER' },
        readAt: null,
      });
      expect(db.conversation.update.mock.calls[0]?.[0]).toMatchObject({
        where: { id: 'c1' },
        data: { unreadCount: 0 },
      });
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteMessage', () => {
    it('ne touche à rien quand le message n’est pas à cette personne ou est déjà supprimé', async () => {
      const { db, store } = fake([]);
      db.message.findFirst.mockResolvedValue(null);
      expect(await store.deleteMessage('u1', 'm9')).toBe(false);
      expect(db.message.findFirst.mock.calls[0]?.[0].where).toEqual({
        id: 'm9',
        deletedAt: null,
        conversation: { userId: 'u1' },
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('efface le texte, la traduction et la correction, et date la suppression', async () => {
      const { db, store } = fake([]);
      db.message.findFirst.mockResolvedValue({ id: 'm1' });
      expect(await store.deleteMessage('u1', 'm1')).toBe(true);
      expect(db.correction.deleteMany).toHaveBeenCalledWith({ where: { messageId: 'm1' } });
      expect(db.message.update.mock.calls[0]?.[0]).toMatchObject({
        where: { id: 'm1' },
        data: { text: '', translationFr: null, deletedAt: expect.any(Date) },
      });
      expect(db.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('send', () => {
    const message = { clientId: '0198f0a0-0000-4000-8000-000000000002', text: 'Hello' };
    const owned = (db: ReturnType<typeof fake>['db']) =>
      db.conversation.findFirst.mockResolvedValue({ id: 'c1' });

    it('ne rend rien pour une conversation qui n’est pas à cette personne', async () => {
      const { db, store } = fake([]);
      db.conversation.findFirst.mockResolvedValue(null);
      expect(await store.send('u1', 'c9', message)).toBeNull();
      expect(db.conversation.findFirst.mock.calls[0]?.[0].where).toEqual({
        id: 'c9',
        userId: 'u1',
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('rend le message déjà enregistré sans rien écrire', async () => {
      const { db, store } = fake([]);
      owned(db);
      db.message.findUnique.mockResolvedValue({ id: 'm1' });
      expect(await store.send('u1', 'c1', message)).toEqual({ row: { id: 'm1' }, created: false });
      expect(db.message.findUnique.mock.calls[0]?.[0].where).toEqual({
        conversationId_clientId: { conversationId: 'c1', clientId: message.clientId },
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('crée le message de la personne et fait remonter la conversation', async () => {
      const { db, store } = fake([]);
      owned(db);
      db.message.findUnique.mockResolvedValue(null);
      db.$transaction.mockResolvedValue([{ id: 'm2' }, {}]);
      expect(await store.send('u1', 'c1', message)).toEqual({ row: { id: 'm2' }, created: true });
      expect(db.message.create.mock.calls[0]?.[0].data).toEqual({
        conversationId: 'c1',
        clientId: message.clientId,
        author: 'USER',
        text: 'Hello',
      });
      expect(db.conversation.update.mock.calls[0]?.[0].where).toEqual({ id: 'c1' });
    });

    it('ajoute 10 XP à la personne dans la même transaction', async () => {
      const { db, store } = fake([]);
      owned(db);
      db.message.findUnique.mockResolvedValue(null);
      db.$transaction.mockResolvedValue([{ id: 'm2' }, {}, {}]);
      await store.send('u1', 'c1', message);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { xp: { increment: 10 } },
      });
      expect(db.user.findUnique).toHaveBeenCalledTimes(1); // série de jours
      expect(db.$transaction.mock.calls[0]?.[0]).toHaveLength(3);
    });

    it('met la série de jours à jour avec l’XP', async () => {
      const { db, store } = fake([]);
      owned(db);
      db.message.findUnique.mockResolvedValue(null);
      db.user.findUnique.mockResolvedValue({
        streakDays: 2,
        lastActiveDay: null,
        timezone: 'Africa/Dakar',
        pausedUntil: null,
      });
      db.$transaction.mockResolvedValue([{ id: 'm2' }, {}, {}, {}]);
      await store.send('u1', 'c1', message);
      expect(db.user.update.mock.calls[0]?.[0].data).toMatchObject({ streakDays: 1 });
      expect(db.dailyActivity.upsert.mock.calls[0]?.[0].create).toMatchObject({
        userId: 'u1',
        messagesSent: 1,
        xpEarned: 10,
      });
      expect(db.$transaction.mock.calls[0]?.[0]).toHaveLength(4);
    });

    describe('limite du jour', () => {
      const today = {
        streakDays: 1,
        lastActiveDay: new Date('2026-11-21T00:00:00Z'),
        timezone: 'Africa/Dakar',
        pausedUntil: null,
      };
      const setup = (messagesSent: number | null) => {
        const { db, store } = fake([]);
        owned(db);
        db.message.findUnique.mockResolvedValue(null);
        db.user.findUnique.mockResolvedValue(today);
        db.dailyActivity.findUnique.mockResolvedValue(
          messagesSent === null ? null : { messagesSent },
        );
        db.$transaction.mockResolvedValue([{ id: 'm2' }, {}, {}, {}]);
        return { db, store };
      };

      it('refuse un nouveau message quand la limite est atteinte, sans rien écrire', async () => {
        const { db, store } = setup(60);
        expect(await store.send('u1', 'c1', message, 60)).toEqual({ limited: true });
        expect(db.$transaction).not.toHaveBeenCalled();
      });

      it('accepte le dernier message permis et un premier message du jour', async () => {
        const last = setup(59);
        expect(await last.store.send('u1', 'c1', message, 60)).toMatchObject({ created: true });
        const first = setup(null);
        expect(await first.store.send('u1', 'c1', message, 60)).toMatchObject({ created: true });
      });

      it('rend un renvoi déjà enregistré même à la limite', async () => {
        const { db, store } = setup(60);
        db.message.findUnique.mockResolvedValue({ id: 'm1' });
        expect(await store.send('u1', 'c1', message, 60)).toEqual({
          row: { id: 'm1' },
          created: false,
        });
        expect(db.dailyActivity.findUnique).not.toHaveBeenCalled();
      });
    });

    it('retrouve le message quand un envoi simultané du même clientId a gagné', async () => {
      const { db, store } = fake([]);
      owned(db);
      db.message.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'm1' });
      db.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );
      expect(await store.send('u1', 'c1', message)).toEqual({ row: { id: 'm1' }, created: false });
    });

    it('laisse remonter une autre erreur', async () => {
      const { db, store } = fake([]);
      owned(db);
      db.message.findUnique.mockResolvedValue(null);
      db.$transaction.mockRejectedValue(new Error('base coupée'));
      await expect(store.send('u1', 'c1', message)).rejects.toThrow('base coupée');
    });
  });
});

describe('PrismaConversationsStore.search', () => {
  it('lit les messages du compte avec le texte protégé, sans ceux du système, et les remet en forme', async () => {
    const { db, store } = fake([]);
    db.$queryRaw.mockResolvedValue([
      {
        id: 'm1',
        conversationId: 'c1',
        author: 'USER',
        text: 'hello there',
        createdAt: new Date('2026-11-25T10:00:00.000Z'),
        slug: 'jade',
        name: 'Jade',
        initials: 'J',
      },
    ]);
    const rows = await store.search('u1', 'hel', 30);
    const [strings, ...values] = db.$queryRaw.mock.calls[0] as [string[], ...unknown[]];
    expect(strings.join('?')).toContain(`"author" <> 'SYSTEM'`);
    expect(values).toEqual(['u1', '%hel%', 30]);
    expect(rows).toEqual([
      {
        messageId: 'm1',
        conversationId: 'c1',
        author: 'USER',
        text: 'hello there',
        createdAt: new Date('2026-11-25T10:00:00.000Z'),
        agent: { slug: 'jade', name: 'Jade', initials: 'J' },
      },
    ]);
  });
});
