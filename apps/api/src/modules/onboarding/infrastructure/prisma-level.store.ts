import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { LevelStore } from '../application/level-test.js';

@Injectable()
export class PrismaLevelStore implements LevelStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async saveAnswer(userId: string, position: number, text: string) {
    await this.db.levelTestAnswer.upsert({
      where: { userId_position: { userId, position } },
      create: { userId, position, text },
      update: { text },
    });
  }

  listAnswers(userId: string) {
    return this.db.levelTestAnswer.findMany({
      where: { userId },
      select: { position: true, text: true },
    });
  }

  async saveLevel(userId: string, level: Parameters<LevelStore['saveLevel']>[1]) {
    await this.db.user.update({ where: { id: userId }, data: { level } });
  }
}
