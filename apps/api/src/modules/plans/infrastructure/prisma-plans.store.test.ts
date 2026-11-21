import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaPlansStore } from './prisma-plans.store.js';

const row = (code: string, prices: { amountMinor: number }[]) => ({
  code,
  nameFr: code,
  periodDays: 30,
  renews: true,
  position: 1,
  prices,
});

describe('PrismaPlansStore', () => {
  it('lit les offres triées avec le prix de la devise', async () => {
    const findMany = vi.fn().mockResolvedValue([row('PLUS_MONTHLY', [{ amountMinor: 2000 }])]);
    const store = new PrismaPlansStore({ plan: { findMany } } as unknown as PrismaService);
    expect(await store.list('XOF')).toEqual([
      {
        code: 'PLUS_MONTHLY',
        nameFr: 'PLUS_MONTHLY',
        periodDays: 30,
        renews: true,
        currency: 'XOF',
        amountMinor: 2000,
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { position: 'asc' },
      include: { prices: { where: { currency: 'XOF' } } },
    });
  });

  it('écarte une offre sans prix dans cette devise', async () => {
    const findMany = vi.fn().mockResolvedValue([row('FREE', [])]);
    const store = new PrismaPlansStore({ plan: { findMany } } as unknown as PrismaService);
    expect(await store.list('USD')).toEqual([]);
  });
});
