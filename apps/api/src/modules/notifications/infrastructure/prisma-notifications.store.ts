import { Injectable } from '@nestjs/common';
import type { NotificationItem } from '@newstart/shared';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { NotificationsStore } from '../application/notifications.js';

@Injectable()
export class PrismaNotificationsStore implements NotificationsStore {
  constructor(private readonly prisma: PrismaService) {}

  async recent(userId: string, limit: number): Promise<NotificationItem[]> {
    const rows = await this.prisma.notificationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      read: r.readAt !== null,
    }));
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notificationLog.count({ where: { userId, readAt: null } });
  }

  async markAllRead(userId: string, now: Date): Promise<void> {
    await this.prisma.notificationLog.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });
  }
}
