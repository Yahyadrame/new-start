import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../generated/prisma/client.js';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { FAILURE_TEXT, HISTORY_SIZE } from '../application/agent-reply.js';
import { PrismaAgentReplyStore } from './prisma-agent-reply.store.js';

function fake() {
  const db = {
    message: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn((a: unknown) => a) },
    correction: { create: vi.fn((a: unknown) => a), deleteMany: vi.fn() },
    conversation: { update: vi.fn((a: unknown) => a) },
    contactVariant: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn().mockResolvedValue([]),
  };
  return { db, store: new PrismaAgentReplyStore(db as unknown as PrismaService) };
}

const createdAt = new Date('2026-11-21T10:00:00.000Z');
const found = {
  createdAt,
  conversation: {
    userId: 'u1',
    agentId: 'ag1',
    agent: { name: 'Jade', persona: 'p', style: 's', accent: 'en-US' },
    user: { firstName: 'Awa', level: 'B1', goal: 'TRAVEL' },
  },
};

describe('PrismaAgentReplyStore.context', () => {
  it('rend null quand le message n’est pas à rejouer (absent, ou déjà corrigé)', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue(null);
    expect(await store.context('c1', 'm1')).toBeNull();
    expect(db.message.findFirst.mock.calls[0]?.[0].where).toEqual({
      id: 'm1',
      conversationId: 'c1',
      author: 'USER',
      correction: null,
      deletedAt: null,
    });
    expect(db.message.findMany).not.toHaveBeenCalled();
  });

  it('applique le ton et la difficulté choisis pour ce contact', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue(found);
    db.message.findMany.mockResolvedValue([]);
    db.contactVariant.findUnique.mockResolvedValue({ tone: 'neutre', difficulty: 'B2' });
    const context = await store.context('c1', 'm1');
    expect(db.contactVariant.findUnique.mock.calls[0]?.[0].where).toEqual({
      userId_agentId: { userId: 'u1', agentId: 'ag1' },
    });
    expect(context?.learner.level).toBe('B2');
    expect(context?.agent.style).toMatch(/no slang/);
  });

  it('ignore un réglage inconnu en base', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue(found);
    db.message.findMany.mockResolvedValue([]);
    db.contactVariant.findUnique.mockResolvedValue({ tone: 'grossier', difficulty: null });
    const context = await store.context('c1', 'm1');
    expect(context?.agent.style).toBe('s');
    expect(context?.learner.level).toBe('B1');
  });

  it('relit les 16 derniers messages jusqu’au message et les rend du plus ancien au plus récent', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue(found);
    db.message.findMany.mockResolvedValue([
      { author: 'USER', text: 'second' },
      { author: 'AGENT', text: 'first' },
    ]);
    const context = await store.context('c1', 'm1');
    const args = db.message.findMany.mock.calls[0]?.[0];
    expect(args.take).toBe(HISTORY_SIZE);
    expect(args.where).toEqual({
      conversationId: 'c1',
      deletedAt: null,
      OR: [{ author: { in: ['USER', 'AGENT'] }, createdAt: { lte: createdAt } }],
    });
    expect(context?.history).toEqual([
      { author: 'AGENT', text: 'first' },
      { author: 'USER', text: 'second' },
    ]);
    expect(context?.learner).toEqual({ firstName: 'Awa', level: 'B1', goal: 'TRAVEL' });
    expect(context?.agent.name).toBe('Jade');
  });
});

describe('PrismaAgentReplyStore.context, réponse en file', () => {
  it('ajoute les réponses arrivées depuis et laisse le message visé en dernier', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue(found);
    db.message.findMany.mockResolvedValue([
      { id: 'r1', author: 'AGENT', text: 'reply one' },
      { id: 'm2', author: 'USER', text: 'two', sticker: 'thanks' },
      { id: 'm1', author: 'USER', text: 'one' },
    ]);
    const context = await store.context('c1', 'm2', { withLaterReplies: true });
    expect(db.message.findMany.mock.calls[0]?.[0].where.OR[1]).toEqual({
      author: 'AGENT',
      createdAt: { gt: createdAt },
    });
    expect(context?.history).toEqual([
      { author: 'USER', text: 'one' },
      { author: 'AGENT', text: 'reply one' },
      { author: 'USER', text: '[sticker] two' },
    ]);
    expect(context?.stickerReceived).toBe(true);
  });
});

describe('PrismaAgentReplyStore.clearCorrection', () => {
  it('efface la correction du message', async () => {
    const { db, store } = fake();
    await store.clearCorrection('m1');
    expect(db.correction.deleteMany).toHaveBeenCalledWith({ where: { messageId: 'm1' } });
  });
});

describe('PrismaAgentReplyStore.context, stickers', () => {
  it('signale un sticker au contact avec sa légende', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue(found);
    db.message.findMany.mockResolvedValue([{ author: 'USER', text: 'Thanks!', sticker: 'thanks' }]);
    const context = await store.context('c1', 'm1');
    expect(context?.history).toEqual([{ author: 'USER', text: '[sticker] Thanks!' }]);
    expect(context?.stickerReceived).toBe(true);
  });

  it('ne rejoue pas au modèle les stickers que le contact a envoyés', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue(found);
    db.message.findMany.mockResolvedValue([
      { author: 'USER', text: 'Hi', sticker: null },
      { author: 'AGENT', text: 'Cool!', sticker: 'cool' },
    ]);
    const context = await store.context('c1', 'm1');
    expect(context?.history).toEqual([{ author: 'USER', text: 'Hi' }]);
    expect(context?.stickerReceived).toBeUndefined();
  });
});

describe('PrismaAgentReplyStore.saveReply', () => {
  it('enregistre la correction, la réponse et le compteur de non lus dans une transaction', async () => {
    const { db, store } = fake();
    await store.saveReply('c1', 'm1', {
      reply: 'Hi',
      fix: { better: 'I agree', why: 'Grammaire' },
    });
    expect(db.correction.create).toHaveBeenCalledWith({
      data: { messageId: 'm1', better: 'I agree', whyFr: 'Grammaire' },
    });
    expect(db.message.create).toHaveBeenCalledWith({
      data: { conversationId: 'c1', author: 'AGENT', text: 'Hi' },
    });
    expect(
      (db.conversation.update.mock.calls[0]?.[0] as { data: { unreadCount: unknown } }).data
        .unreadCount,
    ).toEqual({ increment: 1 });
    expect(db.$transaction.mock.calls[0]?.[0]).toHaveLength(3);
  });

  it('ajoute le sticker du contact juste après son texte, avec deux non lus', async () => {
    const { db, store } = fake();
    await store.saveReply('c1', 'm1', { reply: 'Anytime!', fix: null, sticker: 'welcome' });
    const [text, sticker] = db.message.create.mock.calls.map(
      (call) => (call[0] as { data: { createdAt: Date; text: string; sticker?: string } }).data,
    );
    expect(text?.text).toBe('Anytime!');
    expect(sticker).toMatchObject({ author: 'AGENT', sticker: 'welcome', text: "You're welcome" });
    expect(Number(sticker?.createdAt)).toBeGreaterThan(Number(text?.createdAt));
    expect(
      (db.conversation.update.mock.calls[0]?.[0] as { data: { unreadCount: unknown } }).data
        .unreadCount,
    ).toEqual({ increment: 2 });
  });

  it('refait seulement la correction d’un message modifié', async () => {
    const { db, store } = fake();
    await store.saveReply('c1', 'm1', { reply: 'Hi', fix: null }, { correctionOnly: true });
    expect(db.correction.create).toHaveBeenCalledTimes(1);
    expect(db.message.create).not.toHaveBeenCalled();
    expect(db.conversation.update).not.toHaveBeenCalled();
    expect(db.$transaction.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('écrit une correction vide quand le message est parfait', async () => {
    const { db, store } = fake();
    await store.saveReply('c1', 'm1', { reply: 'Hi', fix: null });
    expect(db.correction.create).toHaveBeenCalledWith({
      data: { messageId: 'm1', better: null, whyFr: null },
    });
  });

  it('ignore une seconde réponse au même message (clé unique) et relance les autres erreurs', async () => {
    const { db, store } = fake();
    const unique = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: 'x',
    });
    db.$transaction.mockRejectedValueOnce(unique);
    await expect(store.saveReply('c1', 'm1', { reply: 'Hi', fix: null })).resolves.toBeUndefined();
    db.$transaction.mockRejectedValueOnce(new Error('panne'));
    await expect(store.saveReply('c1', 'm1', { reply: 'Hi', fix: null })).rejects.toThrow('panne');
  });
});

describe('PrismaAgentReplyStore.saveFailure', () => {
  it('ajoute le message système', async () => {
    const { db, store } = fake();
    await store.saveFailure('c1');
    expect(db.message.create).toHaveBeenCalledWith({
      data: { conversationId: 'c1', author: 'SYSTEM', text: FAILURE_TEXT },
    });
  });
});
