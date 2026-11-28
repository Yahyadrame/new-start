import { Inject, Injectable } from '@nestjs/common';
import { streakUpdate } from '../../../shared/progress/streak.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { MediaMessagesStore, NewMediaMessage } from '../application/media-messages-store.js';
import { findByClientId, recordMessage } from './record-message.js';

@Injectable()
export class PrismaMediaMessagesStore implements MediaMessagesStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async findSource(userId: string, messageId: string) {
    const row = await this.db.message.findFirst({
      where: { id: messageId, conversation: { userId }, mediaKey: { not: null } },
      select: {
        kind: true,
        text: true,
        mediaKey: true,
        mediaProvider: true,
        mediaSeconds: true,
        mediaPeaks: true,
        mediaStoredAt: true,
        createdAt: true,
        deletedAt: true,
      },
    });
    if (!row || row.kind === 'TEXT' || !row.mediaKey || !row.mediaProvider) return null;
    const { kind, text, mediaKey, mediaProvider, mediaSeconds, mediaPeaks } = row;
    return {
      kind,
      text,
      mediaKey,
      mediaProvider,
      mediaSeconds,
      mediaPeaks,
      storedAt: row.mediaStoredAt ?? row.createdAt,
      deleted: row.deletedAt !== null,
    };
  }

  async hasVoiceConsent(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { voiceConsentAt: true },
    });
    return user?.voiceConsentAt != null;
  }

  async sentToday(userId: string, kind: NewMediaMessage['kind']) {
    const { lastActiveDay: day } = await streakUpdate(this.db, userId);
    if (!day) return 0;
    const today = await this.db.dailyActivity.findUnique({
      where: { userId_day: { userId, day } },
      select: { voiceSent: true, photosSent: true },
    });
    return (kind === 'AUDIO' ? today?.voiceSent : today?.photosSent) ?? 0;
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
    // Lecture puis écriture : `MediaSend` fait passer les envois d'une personne un par un.
    if ((await this.sentToday(userId, kind)) >= dailyLimit) return { limited: true as const };
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
