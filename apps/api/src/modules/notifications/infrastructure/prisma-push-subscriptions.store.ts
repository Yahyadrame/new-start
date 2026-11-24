import { Injectable } from '@nestjs/common';
import type { PushSubscriptionInput } from '@newstart/shared';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { PushSubscriptionsStore } from '../application/push-subscriptions.js';

@Injectable()
export class PrismaPushSubscriptionsStore implements PushSubscriptionsStore {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, { endpoint, keys }: PushSubscriptionInput): Promise<void> {
    const data = { userId, p256dh: keys.p256dh, auth: keys.auth };
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, ...data },
      update: data,
    });
  }

  async forUser(userId: string): Promise<PushSubscriptionInput[]> {
    const rows = await this.prisma.pushSubscription.findMany({ where: { userId } });
    return rows.map((r) => ({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }));
  }

  async remove(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
}
