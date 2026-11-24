import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaPushSubscriptionsStore } from './prisma-push-subscriptions.store.js';

describe('PrismaPushSubscriptionsStore.save', () => {
  it('crée l’abonnement, ou met à jour celui du même endpoint (un seul par appareil)', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const store = new PrismaPushSubscriptionsStore({
      pushSubscription: { upsert },
    } as unknown as PrismaService);
    await store.save('u1', {
      endpoint: 'https://push.test/a',
      keys: { p256dh: 'k', auth: 'a' },
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { endpoint: 'https://push.test/a' },
      create: { endpoint: 'https://push.test/a', userId: 'u1', p256dh: 'k', auth: 'a' },
      update: { userId: 'u1', p256dh: 'k', auth: 'a' },
    });
  });
});

describe('PrismaPushSubscriptionsStore.forUser et remove', () => {
  it('rend les appareils de la personne au format du port', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([{ endpoint: 'https://push.test/a', p256dh: 'k', auth: 'a' }]);
    const store = new PrismaPushSubscriptionsStore({
      pushSubscription: { findMany },
    } as unknown as PrismaService);
    expect(await store.forUser('u1')).toEqual([
      { endpoint: 'https://push.test/a', keys: { p256dh: 'k', auth: 'a' } },
    ]);
    expect(findMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('supprime l’abonnement par endpoint, sans erreur s’il n’existe plus', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const store = new PrismaPushSubscriptionsStore({
      pushSubscription: { deleteMany },
    } as unknown as PrismaService);
    await store.remove('https://push.test/a');
    expect(deleteMany).toHaveBeenCalledWith({ where: { endpoint: 'https://push.test/a' } });
  });
});
