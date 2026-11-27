import { Inject, Injectable } from '@nestjs/common';
import { streakUpdate } from '../../../shared/progress/streak.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type {
  DailyLimits,
  MediaMessagesStore,
  NewMediaMessage,
} from '../application/media-messages-store.js';
import { findByClientId, recordMessage } from './record-message.js';

@Injectable()
export class PrismaMediaMessagesStore implements MediaMessagesStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async check(
    userId: string,
    conversationId: string,
    clientId: string,
    kind: NewMediaMessage['kind'],
    limits: DailyLimits,
  ) {
    const owned = await this.db.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!owned) return null;
    const known = await findByClientId(this.db, conversationId, clientId);
    if (known) return { row: known, created: false };
    const { lastActiveDay: day } = await streakUpdate(this.db, userId);
    if (day) {
      const today = await this.db.dailyActivity.findUnique({
        where: { userId_day: { userId, day } },
        select: { messagesSent: true, voiceSent: true, photosSent: true },
      });
      // ponytail: lecture puis écriture, des envois simultanés peuvent dépasser la limite ; un verrou si ça compte
      if ((today?.messagesSent ?? 0) >= limits.messages) return { limited: 'messages' as const };
      const files = kind === 'AUDIO' ? today?.voiceSent : today?.photosSent;
      if ((files ?? 0) >= limits.media) return { limited: 'media' as const };
    }
    return { ready: true as const };
  }

  async create(userId: string, conversationId: string, media: NewMediaMessage) {
    return recordMessage(
      this.db,
      userId,
      { conversationId, author: 'USER', ...media },
      await streakUpdate(this.db, userId),
      { messagesSent: 1, ...(media.kind === 'AUDIO' ? { voiceSent: 1 } : { photosSent: 1 }) },
    );
  }
}
