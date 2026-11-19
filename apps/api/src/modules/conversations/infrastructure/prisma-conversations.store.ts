import { Inject, Injectable } from '@nestjs/common';
import type { ConversationItem } from '@newstart/shared';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { ConversationsStore } from '../application/conversations.js';

@Injectable()
export class PrismaConversationsStore implements ConversationsStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async list(userId: string): Promise<ConversationItem[]> {
    const rows = await this.db.conversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      select: {
        id: true,
        lastMessageAt: true,
        unreadCount: true,
        agent: { select: { slug: true, name: true, initials: true, roleFr: true, category: true } },
        messages: { select: { author: true, text: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return rows.map(({ messages, lastMessageAt, ...row }) => ({
      ...row,
      lastMessage: messages[0] ?? null,
      lastMessageAt: lastMessageAt.toISOString(),
    }));
  }
}
