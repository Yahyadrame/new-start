import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { NotebookStore } from '../application/notebook.js';

const select = { id: true, original: true, better: true, whyFr: true, createdAt: true } as const;

@Injectable()
export class PrismaNotebookStore implements NotebookStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  list(userId: string) {
    return this.db.notebookEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select,
    });
  }

  async add(userId: string, messageId: string) {
    const message = await this.db.message.findFirst({
      where: { id: messageId, author: 'USER', conversation: { userId } },
      select: { text: true, correction: { select: { better: true, whyFr: true } } },
    });
    const better = message?.correction?.better;
    if (!message || !better) return null;
    return this.db.notebookEntry.upsert({
      where: { userId_messageId: { userId, messageId } },
      update: {},
      create: {
        userId,
        messageId,
        original: message.text,
        better,
        whyFr: message.correction?.whyFr ?? null,
      },
      select,
    });
  }
}
