import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../../config/env.js';
import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  it('se déconnecte à l’arrêt', async () => {
    const service = new PrismaService({ DATABASE_URL: 'postgresql://u:p@localhost:1/db' } as Env);
    const disconnect = vi.spyOn(service, '$disconnect').mockResolvedValue();
    await service.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
