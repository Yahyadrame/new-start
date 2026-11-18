import { Inject, Injectable } from '@nestjs/common';
import type { Me, MePatch } from '@newstart/shared';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { MeStore } from '../application/me.js';

const select = {
  id: true,
  firstName: true,
  goal: true,
  level: true,
  theme: true,
  reminderTime: true,
  timezone: true,
  dailyGoalMin: true,
  preferredAccent: true,
  dataSaver: true,
  pausedUntil: true,
} as const;

type Row = NonNullable<Awaited<ReturnType<PrismaMeStore['read']>>>;

const toMe = (row: Row) =>
  ({ ...row, pausedUntil: row.pausedUntil?.toISOString() ?? null }) as unknown as Me; // ponytail: Prisma renvoie des enums et des chaînes que le schéma partagé resserre (accent)

@Injectable()
export class PrismaMeStore implements MeStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  read(userId: string) {
    return this.db.user.findUnique({ where: { id: userId }, select });
  }

  async find(userId: string) {
    const row = await this.read(userId);
    return row && toMe(row);
  }

  async update(userId: string, patch: MePatch) {
    const { pausedUntil, ...rest } = patch;
    // exactOptionalPropertyTypes : on écarte les clés absentes au lieu de les passer à undefined.
    const data: Prisma.UserUpdateManyMutationInput = Object.fromEntries(
      Object.entries({
        ...rest,
        pausedUntil:
          pausedUntil === undefined || pausedUntil === null ? pausedUntil : new Date(pausedUntil),
      }).filter(([, v]) => v !== undefined),
    );
    // updateMany ne lève pas d'erreur si le compte a disparu : on relit ensuite.
    const { count } = await this.db.user.updateMany({ where: { id: userId }, data });
    return count === 0 ? null : this.find(userId);
  }
}
