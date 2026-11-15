import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { SessionStore } from '../application/session.js';

@Injectable()
export class PrismaSessionStore implements SessionStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  findToken(tokenHash: string) {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, familyId: true, expiresAt: true, revokedAt: true },
    });
  }

  async revokeToken(id: string) {
    const { count } = await this.db.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count === 1;
  }

  async revokeFamily(familyId: string) {
    await this.db.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async addToken(row: Parameters<SessionStore['addToken']>[0]) {
    await this.db.refreshToken.create({ data: row });
  }

  findUserById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, goal: true, level: true },
    });
  }
}
