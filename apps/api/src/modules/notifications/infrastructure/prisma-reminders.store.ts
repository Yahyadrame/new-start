import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { ReminderCandidate, RemindersStore } from '../application/send-reminders.js';

const KIND = 'reminder';
const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

@Injectable()
export class PrismaRemindersStore implements RemindersStore {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ponytail: lit toutes les personnes avec un rappel ; à paginer quand elles seront des milliers.
  async candidates(): Promise<ReminderCandidate[]> {
    const users = await this.prisma.user.findMany({
      where: { reminderTime: { not: null } },
      select: {
        id: true,
        reminderTime: true,
        timezone: true,
        lastActiveDay: true,
        pausedUntil: true,
        notifications: {
          where: { kind: KIND },
          orderBy: { day: 'desc' },
          take: 1,
          select: { day: true },
        },
      },
    });
    return users.map((u) => ({
      userId: u.id,
      reminderTime: u.reminderTime,
      timezone: u.timezone,
      lastActiveDay: isoDay(u.lastActiveDay),
      lastReminderDay: u.notifications[0]?.day ?? null,
      pausedUntil: u.pausedUntil,
    }));
  }

  async record(userId: string, day: string, title: string, body: string): Promise<boolean> {
    try {
      await this.prisma.notificationLog.create({ data: { userId, kind: KIND, day, title, body } });
      return true;
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') return false;
      throw e;
    }
  }
}
