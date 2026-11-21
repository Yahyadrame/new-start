import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { recordActivity } from '../../../shared/progress/daily-activity.js';
import { localDay, streakUpdate } from '../../../shared/progress/streak.js';
import type { GamesStore } from '../application/games.js';

@Injectable()
export class PrismaGamesStore implements GamesStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async expressions() {
    const rows = await this.db.expression.findMany({
      select: { id: true, text: true, meaningFr: true, week: true },
    });
    return rows;
  }

  async addXp(userId: string, amount: number) {
    const streak = await streakUpdate(this.db, userId);
    const user = await this.db.user.update({
      where: { id: userId },
      data: { xp: { increment: amount }, ...streak },
      select: { xp: true },
    });
    if (streak.lastActiveDay) {
      await recordActivity(this.db, userId, streak.lastActiveDay, {
        gamesPlayed: 1,
        xpEarned: amount,
      });
    }
    return user.xp;
  }

  async today(userId: string, now: Date) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const day = localDay(now, user?.timezone ?? 'UTC');
    const row = await this.db.dailyActivity.findUnique({
      where: { userId_day: { userId, day: new Date(`${day}T00:00:00Z`) } },
      select: { challengeDone: true },
    });
    return { day, done: row?.challengeDone ?? false };
  }

  async claimChallenge(userId: string, day: string) {
    const date = new Date(`${day}T00:00:00Z`);
    await this.db.dailyActivity.upsert({
      where: { userId_day: { userId, day: date } },
      create: { userId, day: date },
      update: {},
    });
    const { count } = await this.db.dailyActivity.updateMany({
      where: { userId, day: date, challengeDone: false },
      data: { challengeDone: true },
    });
    return count > 0;
  }
}
