import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { TranslationStore } from '../application/translation.js';

@Injectable()
export class PrismaTranslationStore implements TranslationStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  find(userId: string, messageId: string) {
    return this.db.message.findFirst({
      where: { id: messageId, author: 'AGENT', deletedAt: null, conversation: { userId } },
      select: { text: true, translationFr: true },
    });
  }

  async save(messageId: string, translationFr: string) {
    await this.db.message.update({ where: { id: messageId }, data: { translationFr } });
  }
}
