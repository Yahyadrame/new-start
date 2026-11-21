import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { newCard } from '../domain/scheduler.js';
import { PrismaReviewsStore } from './prisma-reviews.store.js';

function fake() {
  const db = {
    reviewCard: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), createMany: vi.fn() },
    expression: { findMany: vi.fn() },
  };
  return { db, store: new PrismaReviewsStore(db as unknown as PrismaService) };
}
const now = new Date('2026-11-20T12:00:00Z');

describe('PrismaReviewsStore', () => {
  it('lit les cartes échues de la personne, la plus ancienne d’abord, et aplatit l’expression', async () => {
    const { db, store } = fake();
    db.reviewCard.findMany.mockResolvedValue([
      {
        id: 'c1',
        expressionId: 7,
        due: now,
        expression: { text: 'Break a leg', meaningFr: 'Bonne chance' },
      },
    ]);
    expect(await store.due('u1', now, 20)).toEqual([
      { id: 'c1', expressionId: 7, due: now, text: 'Break a leg', meaningFr: 'Bonne chance' },
    ]);
    const arg = db.reviewCard.findMany.mock.calls[0]?.[0];
    expect(arg.where).toEqual({ userId: 'u1', due: { lte: now } });
    expect(arg.orderBy).toEqual({ due: 'asc' });
    expect(arg.take).toBe(20);
  });

  it('ne trouve une carte que si elle est à cette personne', async () => {
    const { db, store } = fake();
    db.reviewCard.findFirst.mockResolvedValue(null);
    expect(await store.find('u1', 'c1')).toBeNull();
    expect(db.reviewCard.findFirst.mock.calls[0]?.[0].where).toEqual({ id: 'c1', userId: 'u1' });
  });

  it('enregistre le nouvel état', async () => {
    const { db, store } = fake();
    db.reviewCard.update.mockResolvedValue({});
    const next = newCard(now);
    await store.save('c1', next);
    expect(db.reviewCard.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: next });
  });

  it('ne crée de cartes que pour les expressions connues, sans doublon', async () => {
    const { db, store } = fake();
    db.expression.findMany.mockResolvedValue([{ id: 3 }]);
    db.reviewCard.createMany.mockResolvedValue({ count: 1 });
    expect(await store.createMissing('u1', [3, 999], newCard(now))).toBe(1);
    const arg = db.reviewCard.createMany.mock.calls[0]?.[0];
    expect(arg.skipDuplicates).toBe(true);
    expect(arg.data).toEqual([{ userId: 'u1', expressionId: 3, ...newCard(now) }]);
  });
});
