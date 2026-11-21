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
    return { xp: user.xp, streakDays };
  }
}
