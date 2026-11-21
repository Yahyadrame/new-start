import type { PrismaService } from '../prisma/prisma.service.js';

export interface ActivityDelta {
  messagesSent?: number;
  gamesPlayed?: number;
  xpEarned?: number;
  spokenSeconds?: number;
}

/**
 * Ajoute `delta` au compteur du jour de la personne (créé au besoin).
 * `day` est le jour dans son fuseau (celui de `streakUpdate`). Rend la requête
 * Prisma, pour pouvoir la joindre à une transaction.
 */
export function recordActivity(
  db: Pick<PrismaService, 'dailyActivity'>,
  userId: string,
  day: Date,
  delta: ActivityDelta,
) {
  const increments = Object.fromEntries(
    Object.entries(delta).map(([key, n]) => [key, { increment: n }]),
  );
  return db.dailyActivity.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, ...delta },
    update: increments,
  });
}
