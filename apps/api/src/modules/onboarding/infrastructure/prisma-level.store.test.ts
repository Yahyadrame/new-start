import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaLevelStore } from './prisma-level.store.js';

function fake() {
  const db = {
    levelTestAnswer: { upsert: vi.fn(), findMany: vi.fn() },
    user: { update: vi.fn() },
  };
  return { db, store: new PrismaLevelStore(db as unknown as PrismaService) };
}

describe('PrismaLevelStore', () => {
  it('réécrit la réponse de la même question', async () => {
    const { db, store } = fake();
    await store.saveAnswer('u', 3, 'texte');
    expect(db.levelTestAnswer.upsert.mock.calls[0]?.[0]).toEqual({
      where: { userId_position: { userId: 'u', position: 3 } },
      create: { userId: 'u', position: 3, text: 'texte' },
      update: { text: 'texte' },
    });
  });
  it("liste les réponses d'un seul compte", async () => {
    const { db, store } = fake();
    db.levelTestAnswer.findMany.mockResolvedValue([{ position: 1, text: 'a' }]);
    expect(await store.listAnswers('u')).toEqual([{ position: 1, text: 'a' }]);
    expect(db.levelTestAnswer.findMany.mock.calls[0]?.[0].where).toEqual({ userId: 'u' });
  });
  it('enregistre le niveau sur le compte', async () => {
    const { db, store } = fake();
    await store.saveLevel('u', 'C1');
    expect(db.user.update.mock.calls[0]?.[0]).toEqual({
      where: { id: 'u' },
      data: { level: 'C1' },
    });
  });
});
