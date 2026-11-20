import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaGamesStore } from './prisma-games.store.js';

describe('PrismaGamesStore', () => {
  it('lit les expressions du noyau avec leur sens et leur semaine', async () => {
    const rows = [{ id: 1, text: 'You know', meaningFr: 'tu sais', week: 1 }];
    const db = { expression: { findMany: vi.fn().mockResolvedValue(rows) } };
    const store = new PrismaGamesStore(db as unknown as PrismaService);
    expect(await store.expressions()).toEqual(rows);
    expect(db.expression.findMany.mock.calls[0]?.[0].select).toEqual({
      id: true,
      text: true,
      meaningFr: true,
      week: true,
    });
  });
});
