import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaNotebookStore } from './prisma-notebook.store.js';

function fake() {
  const db = {
    notebookEntry: { findMany: vi.fn(), upsert: vi.fn() },
    message: { findFirst: vi.fn() },
  };
  return { db, store: new PrismaNotebookStore(db as unknown as PrismaService) };
}

describe('PrismaNotebookStore', () => {
  it('liste les entrées du compte, la plus récente d’abord', async () => {
    const { db, store } = fake();
    db.notebookEntry.findMany.mockResolvedValue([]);
    await store.list('u1');
    const arg = db.notebookEntry.findMany.mock.calls[0]?.[0];
    expect(arg.where).toEqual({ userId: 'u1' });
    expect(arg.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('cherche le message parmi les conversations de cette personne', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue(null);
    expect(await store.add('u1', 'm1')).toBeNull();
    expect(db.message.findFirst.mock.calls[0]?.[0].where).toEqual({
      id: 'm1',
      author: 'USER',
      conversation: { userId: 'u1' },
    });
    expect(db.notebookEntry.upsert).not.toHaveBeenCalled();
  });

  it('ne garde rien quand le message est déjà parfait (sans version « Plus naturel »)', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue({
      text: 'Hello',
      correction: { better: null, whyFr: null },
    });
    expect(await store.add('u1', 'm1')).toBeNull();
    db.message.findFirst.mockResolvedValue({ text: 'Hello', correction: null });
    expect(await store.add('u1', 'm1')).toBeNull();
    expect(db.notebookEntry.upsert).not.toHaveBeenCalled();
  });

  it('enregistre une copie de la correction, sans doublon', async () => {
    const { db, store } = fake();
    db.message.findFirst.mockResolvedValue({
      text: 'I go yesterday',
      correction: { better: 'I went yesterday', whyFr: 'Passé' },
    });
    db.notebookEntry.upsert.mockResolvedValue({ id: 'n1' });
    expect(await store.add('u1', 'm1')).toEqual({ id: 'n1' });
    const arg = db.notebookEntry.upsert.mock.calls[0]?.[0];
    expect(arg.where).toEqual({ userId_messageId: { userId: 'u1', messageId: 'm1' } });
    expect(arg.update).toEqual({});
    expect(arg.create).toEqual({
      userId: 'u1',
      messageId: 'm1',
      original: 'I go yesterday',
      better: 'I went yesterday',
      whyFr: 'Passé',
    });
  });
});
