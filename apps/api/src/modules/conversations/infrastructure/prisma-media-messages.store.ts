import { Inject, Injectable } from '@nestjs/common';
import { streakUpdate } from '../../../shared/progress/streak.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { MediaMessagesStore, NewMediaMessage } from '../application/media-messages-store.js';
import { findByClientId, recordMessage } from './record-message.js';

@Injectable()
export class PrismaMediaMessagesStore implements MediaMessagesStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async hasVoiceConsent(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { voiceConsentAt: true },
    });
    return user?.voiceConsentAt != null;
  }

  async check(
    userId: string,
    conversationId: string,
    clientId: string,
    kind: NewMediaMessage['kind'],
    dailyLimit: number,
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
        select: { voiceSent: true, photosSent: true },
      });
      // Lecture puis écriture : `MediaSend` fait passer les envois d'une personne un par un.
      const sent = kind === 'AUDIO' ? today?.voiceSent : today?.photosSent;
      if ((sent ?? 0) >= dailyLimit) return { limited: true as const };
    }
    return { ready: true as const };
  }

  async create(userId: string, conversationId: string, media: NewMediaMessage) {
    return recordMessage(
      this.db,
      userId,
      { conversationId, author: 'USER', ...media },
      await streakUpdate(this.db, userId),
      media.kind === 'AUDIO' ? { voiceSent: 1 } : { photosSent: 1 },
    );
  }
}
