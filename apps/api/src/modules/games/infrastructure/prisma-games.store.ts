import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { recordActivity } from '../../../shared/progress/daily-activity.js';
import { streakUpdate } from '../../../shared/progress/streak.js';
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
}
