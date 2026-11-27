import { Prisma } from '../../../generated/prisma/client.js';
import { recordActivity, type ActivityDelta } from '../../../shared/progress/daily-activity.js';
import type { streakUpdate } from '../../../shared/progress/streak.js';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';

export const messageSelect = {
  id: true,
  author: true,
  text: true,
  translationFr: true,
  createdAt: true,
  deletedAt: true,
  editedAt: true,
  forwarded: true,
  sticker: true,
  reaction: true,
  kind: true,
  mediaKey: true,
  mediaProvider: true,
  mediaSeconds: true,
  correction: { select: { better: true, whyFr: true } },
  replyTo: { select: { id: true, author: true, text: true, deletedAt: true } },
} as const;

/** XP gagnés pour chaque message envoyé. */
const XP_PER_MESSAGE = 10;

export const findByClientId = (db: PrismaService, conversationId: string, clientId: string) =>
  db.message.findUnique({
    where: { conversationId_clientId: { conversationId, clientId } },
    select: messageSelect,
  });

/**
 * Écrit un message de la personne avec tout ce qui va avec, en une transaction : la conversation remonte,
 * les XP, la série et les compteurs du jour (`counters`). `created: false` quand un envoi simultané du
 * même `clientId` a gagné.
 */
export async function recordMessage(
  db: PrismaService,
  userId: string,
  data: Prisma.MessageUncheckedCreateInput & { clientId: string },
  streak: Awaited<ReturnType<typeof streakUpdate>>,
  counters: ActivityDelta,
) {
  const { conversationId, clientId } = data;
  try {
    const [row] = await db.$transaction([
      db.message.create({ data, select: messageSelect }),
      db.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
      // +10 XP par message (règle de NS-501), seulement pour un message créé
      db.user.update({
        where: { id: userId },
        data: { xp: { increment: XP_PER_MESSAGE }, ...streak },
      }),
      ...(streak.lastActiveDay
        ? [
            recordActivity(db, userId, streak.lastActiveDay, {
              ...counters,
              xpEarned: XP_PER_MESSAGE,
            }),
          ]
        : []),
    ]);
    return { row, created: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const row = await findByClientId(db, conversationId, clientId);
      if (row) return { row, created: false };
    }
    throw e;
  }
}
