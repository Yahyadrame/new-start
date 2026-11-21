import { Inject, Injectable } from '@nestjs/common';
import type { ConversationItem, SendMessage } from '@newstart/shared';
import { Prisma } from '../../../generated/prisma/client.js';
import type { MessageCursor } from '../application/message-cursor.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { ConversationsStore, MessageRow } from '../application/conversations.js';

const select = {
  id: true,
  lastMessageAt: true,
  unreadCount: true,
  agent: { select: { slug: true, name: true, initials: true, roleFr: true, category: true } },
  messages: {
    select: { author: true, text: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} as const;

const messageSelect = {
  id: true,
  author: true,
  text: true,
  translationFr: true,
  createdAt: true,
  correction: { select: { better: true, whyFr: true } },
} as const;

type Row = Omit<ConversationItem, 'lastMessage' | 'lastMessageAt'> & {
  lastMessageAt: Date;
  messages: { author: 'USER' | 'AGENT' | 'SYSTEM'; text: string }[];
};

const toItem = ({ messages, lastMessageAt, ...row }: Row): ConversationItem => ({
  ...row,
  lastMessage: messages[0] ?? null,
  lastMessageAt: lastMessageAt.toISOString(),
});

/** XP gagnés pour chaque message envoyé. */
const XP_PER_MESSAGE = 10;

@Injectable()
export class PrismaConversationsStore implements ConversationsStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async list(userId: string): Promise<ConversationItem[]> {
    const rows = await this.db.conversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      select,
    });
    return rows.map(toItem);
  }

  async birthYear(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { birthYear: true },
    });
    return user?.birthYear;
  }

  async agentRule(slug: string) {
    const agent = await this.db.agent.findFirst({
      where: { slug, isActive: true },
      select: { topic: { select: { adultOnly: true } } },
    });
    return agent && { adultOnly: agent.topic?.adultOnly ?? false };
  }

  async open(userId: string, slug: string): Promise<ConversationItem> {
    const agent = await this.db.agent.findUniqueOrThrow({
      where: { slug },
      select: { id: true, firstMessage: true },
    });
    const row = await this.db.conversation.upsert({
      where: { userId_agentId: { userId, agentId: agent.id } },
      create: {
        userId,
        agentId: agent.id,
        unreadCount: 1,
        messages: { create: { author: 'AGENT', text: agent.firstMessage } },
      },
      update: {},
      select,
    });
    return toItem(row);
  }

  async messages(
    userId: string,
    conversationId: string,
    before: MessageCursor | null,
    limit: number,
  ): Promise<MessageRow[] | null> {
    const owned = await this.db.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!owned) return null;
    return this.db.message.findMany({
      where: {
        conversationId,
        ...(before && {
          OR: [
            { createdAt: { lt: before.createdAt } },
            { createdAt: before.createdAt, id: { lt: before.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: messageSelect,
    });
  }

  async markRead(userId: string, conversationId: string) {
    const owned = await this.db.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!owned) return false;
    await this.db.$transaction([
      this.db.message.updateMany({
        where: { conversationId, author: { not: 'USER' }, readAt: null },
        data: { readAt: new Date() },
      }),
      this.db.conversation.update({ where: { id: conversationId }, data: { unreadCount: 0 } }),
    ]);
    return true;
  }

  async send(userId: string, conversationId: string, { clientId, text }: SendMessage) {
    const owned = await this.db.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!owned) return null;
    const find = () =>
      this.db.message.findUnique({
        where: { conversationId_clientId: { conversationId, clientId } },
        select: messageSelect,
      });
    const known = await find();
    if (known) return { row: known, created: false };
    try {
      const [row] = await this.db.$transaction([
        this.db.message.create({
          data: { conversationId, clientId, author: 'USER', text },
          select: messageSelect,
        }),
        this.db.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        }),
        // +10 XP par message (règle de NS-501), seulement pour un message créé
        this.db.user.update({ where: { id: userId }, data: { xp: { increment: XP_PER_MESSAGE } } }),
      ]);
      return { row, created: true };
    } catch (e) {
      // Deux envois du même clientId en même temps : le second retrouve le premier.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const row = await find();
        if (row) return { row, created: false };
      }
      throw e;
    }
  }
}
