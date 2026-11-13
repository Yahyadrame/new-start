import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { DatabaseCheck } from './database.check.js';

const prismaWith = (query: () => Promise<unknown>) =>
  ({ $queryRaw: query }) as unknown as PrismaService;

describe('DatabaseCheck', () => {
  it('interroge la base', async () => {
    const query = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
    await new DatabaseCheck(prismaWith(query)).check();
    expect(query).toHaveBeenCalledOnce();
  });
  it('propage l’erreur quand la base ne répond pas', async () => {
    await expect(
      new DatabaseCheck(prismaWith(() => Promise.reject(new Error('down')))).check(),
    ).rejects.toThrow('down');
  });
});
