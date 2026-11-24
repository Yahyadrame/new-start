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
