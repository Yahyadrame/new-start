import { Inject, Injectable } from '@nestjs/common';
import type { ConversationItem } from '@newstart/shared';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { ConversationsStore } from '../application/conversations.js';

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

type Row = Omit<ConversationItem, 'lastMessage' | 'lastMessageAt'> & {
  lastMessageAt: Date;
  messages: { author: 'USER' | 'AGENT' | 'SYSTEM'; text: string }[];
};

const toItem = ({ messages, lastMessageAt, ...row }: Row): ConversationItem => ({
  ...row,
  lastMessage: messages[0] ?? null,
  lastMessageAt: lastMessageAt.toISOString(),
});

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
}
