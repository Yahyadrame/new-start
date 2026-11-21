import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaProgressStore } from './prisma-progress.store.js';

const store = (found: unknown) => {
  const findUnique = vi.fn().mockResolvedValue(found);
  const db = { user: { findUnique } } as unknown as PrismaService;
  return { findUnique, store: new PrismaProgressStore(db) };
};

describe('PrismaProgressStore.xp', () => {
  it('lit l’XP du compte', async () => {
    const s = store({ xp: 40 });
    expect(await s.store.xp('u1')).toBe(40);
    expect(s.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, select: { xp: true } });
  });

  it('rend null pour un compte inconnu', async () => {
    expect(await store(null).store.xp('u9')).toBeNull();
  });
});
