import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
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
    const user = await this.db.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
      select: { xp: true },
    });
    return user.xp;
  }
}
