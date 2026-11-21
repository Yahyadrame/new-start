import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { DueCard, ReviewsStore } from '../application/reviews.js';
import type { CardState } from '../domain/scheduler.js';

const state = {
  stability: true,
  difficulty: true,
  due: true,
  reps: true,
  lapses: true,
  lastReview: true,
} as const;

@Injectable()
export class PrismaReviewsStore implements ReviewsStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async due(userId: string, now: Date, limit: number): Promise<DueCard[]> {
    const rows = await this.db.reviewCard.findMany({
      where: { userId, due: { lte: now } },
      orderBy: { due: 'asc' },
      take: limit,
      select: {
        id: true,
        expressionId: true,
        due: true,
        expression: { select: { text: true, meaningFr: true } },
      },
    });
    return rows.map(({ expression, ...card }) => ({ ...card, ...expression }));
  }

  find(userId: string, cardId: string) {
    return this.db.reviewCard.findFirst({ where: { id: cardId, userId }, select: state });
  }

  async save(cardId: string, next: CardState) {
    await this.db.reviewCard.update({ where: { id: cardId }, data: next });
  }

  async createMissing(userId: string, expressionIds: number[], next: CardState) {
    const known = await this.db.expression.findMany({
      where: { id: { in: expressionIds } },
      select: { id: true },
    });
    const { count } = await this.db.reviewCard.createMany({
      data: known.map(({ id }) => ({ userId, expressionId: id, ...next })),
      skipDuplicates: true,
    });
    return count;
  }
}
