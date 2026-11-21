import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { ProgressStore } from '../application/progress.js';

@Injectable()
export class PrismaProgressStore implements ProgressStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async xp(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { xp: true } });
    return user?.xp ?? null;
  }
}
