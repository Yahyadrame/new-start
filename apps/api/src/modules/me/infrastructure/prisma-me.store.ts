import { Inject, Injectable } from '@nestjs/common';
import type { Me, MePatch } from '@newstart/shared';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { MeStore } from '../application/me.js';

const select = {
  id: true,
  firstName: true,
  goal: true,
  interests: true,
  birthYear: true,
  avatar: true,
  level: true,
  theme: true,
  reminderTime: true,
  timezone: true,
  dailyGoalMin: true,
  preferredAccent: true,
  dataSaver: true,
  chatBackground: true,
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
    const { pausedUntil, avatar, ...rest } = patch;
    // exactOptionalPropertyTypes : on écarte les clés absentes au lieu de les passer à undefined.
    const data: Prisma.UserUpdateManyMutationInput = Object.fromEntries(
      Object.entries({
        ...rest,
        // Une colonne JSON ne prend pas `null` : on passe par `DbNull` pour retirer l'avatar.
        avatar: avatar === null ? Prisma.DbNull : avatar,
        pausedUntil:
          pausedUntil === undefined || pausedUntil === null ? pausedUntil : new Date(pausedUntil),
      }).filter(([, v]) => v !== undefined),
    );
    // updateMany ne lève pas d'erreur si le compte a disparu : on relit ensuite.
    const { count } = await this.db.user.updateMany({ where: { id: userId }, data });
    return count === 0 ? null : this.find(userId);
  }

  async exportData(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      // Pas de jetons ni d'empreintes : seulement ce que la personne a donné ou produit.
      omit: { id: true, updatedAt: true },
      include: {
        identities: { select: { provider: true, subject: true, verifiedAt: true } },
        levelAnswers: {
          select: { position: true, text: true, createdAt: true },
          orderBy: { position: 'asc' },
        },
        conversations: {
          select: {
            createdAt: true,
            agent: { select: { slug: true } },
            messages: {
              select: {
                author: true,
                kind: true,
                text: true,
                translationFr: true,
                createdAt: true,
                correction: { select: { better: true, whyFr: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
    return user;
  }

  async remove(userId: string) {
    return this.db.$transaction(async (tx) => {
      const identities = await tx.authIdentity.findMany({
        where: { userId },
        select: { provider: true, subject: true },
      });
      // Les codes à usage unique sont rattachés à l'adresse, pas au compte : on les efface aussi.
      const destinations = identities.filter((i) => i.provider !== 'google').map((i) => i.subject);
      await tx.otpCode.deleteMany({ where: { destination: { in: destinations } } });
      // Les clés des fichiers sont lues avant : elles disparaissent avec les messages.
      const media = await tx.message.findMany({
        where: { conversation: { userId }, mediaKey: { not: null } },
        select: { mediaKey: true, mediaProvider: true },
      });
      // Le reste (identités, jetons, réponses du test, conversations, messages) part en cascade.
      const { count } = await tx.user.deleteMany({ where: { id: userId } });
      if (!count) return null;
      return media.flatMap(({ mediaKey: key, mediaProvider: provider }) =>
        key && provider ? [{ key, provider }] : [],
      );
    });
  }
}
