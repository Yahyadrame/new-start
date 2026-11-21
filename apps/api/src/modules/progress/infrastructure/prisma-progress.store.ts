import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { currentStreak, localDay } from '../../../shared/progress/streak.js';
import type { ProgressStore } from '../application/progress.js';

@Injectable()
export class PrismaProgressStore implements ProgressStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async stats(userId: string, now: Date = new Date()) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        streakDays: true,
        lastActiveDay: true,
        timezone: true,
        pausedUntil: true,
      },
    });
    if (!user) return null;
    const streakDays = currentStreak(
      {
        streakDays: user.streakDays,
        lastActiveDay: user.lastActiveDay?.toISOString().slice(0, 10) ?? null,
        paused: user.pausedUntil !== null && user.pausedUntil > now,
      },
      localDay(now, user.timezone),
    );
    const today = localDay(now, user.timezone);
    const since = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86_400_000);
    const rows = await this.db.dailyActivity.findMany({
      where: { userId, day: { gte: since } },
      select: {
        day: true,
        spokenSeconds: true,
        messagesSent: true,
        gamesPlayed: true,
        xpEarned: true,
      },
    });
    const activity = rows.map((r) => ({ ...r, day: r.day.toISOString().slice(0, 10) }));
    return { xp: user.xp, streakDays, today, activity };
  }
}
