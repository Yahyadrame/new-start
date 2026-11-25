import { Inject, Injectable } from '@nestjs/common';
import type { AgentReply } from '@newstart/ai';
import { ContactVariant } from '@newstart/shared';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import {
  FAILURE_TEXT,
  HISTORY_SIZE,
  type AgentReplyStore,
  type ReplyOptions,
  type ReplyContext,
} from '../application/agent-reply.js';
import { applyVariant } from '../application/agent-variant.js';

/** Une valeur inconnue en base (ancienne ou abîmée) est ignorée plutôt que passée au prompt. */
const parseVariant = (row: { tone: string | null; difficulty: string | null } | null) => {
  const parsed = ContactVariant.safeParse({
    ...(row?.tone && { tone: row.tone }),
    ...(row?.difficulty && { difficulty: row.difficulty }),
  });
  return parsed.success ? parsed.data : null;
};

@Injectable()
export class PrismaAgentReplyStore implements AgentReplyStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async context(conversationId: string, messageId: string): Promise<ReplyContext | null> {
    const message = await this.db.message.findFirst({
      where: { id: messageId, conversationId, author: 'USER', correction: null },
      select: {
        createdAt: true,
        conversation: {
          select: {
            userId: true,
            agentId: true,
            agent: { select: { name: true, persona: true, style: true, accent: true } },
            user: { select: { firstName: true, level: true, goal: true, interests: true } },
          },
        },
      },
    });
    if (!message) return null;
    const rows = await this.db.message.findMany({
      where: {
        conversationId,
        author: { in: ['USER', 'AGENT'] },
        createdAt: { lte: message.createdAt },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: HISTORY_SIZE,
      select: { author: true, text: true },
    });
    const history = rows
      .reverse()
      .flatMap(({ author, text }) => (author === 'SYSTEM' ? [] : [{ author, text }]));
    const { agent, user, userId, agentId } = message.conversation;
    const variant = await this.db.contactVariant.findUnique({
      where: { userId_agentId: { userId, agentId } },
      select: { tone: true, difficulty: true },
    });
    return applyVariant({ agent, learner: user, history }, parseVariant(variant));
  }

  async saveReply(
    conversationId: string,
    messageId: string,
    { reply, fix }: AgentReply,
    { correctionOnly = false }: ReplyOptions = {},
  ) {
    try {
      await this.db.$transaction([
        // `messageId` est unique : une seconde réponse au même message annule toute la transaction.
        this.db.correction.create({
          data: { messageId, better: fix?.better ?? null, whyFr: fix?.why ?? null },
        }),
        ...(correctionOnly
          ? []
          : [
              this.db.message.create({ data: { conversationId, author: 'AGENT', text: reply } }),
              this.db.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date(), unreadCount: { increment: 1 } },
              }),
            ]),
      ]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return;
      throw e;
    }
  }

  async saveFailure(conversationId: string) {
    await this.db.$transaction([
      this.db.message.create({ data: { conversationId, author: 'SYSTEM', text: FAILURE_TEXT } }),
      this.db.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
  }
}
