import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { VoiceStore } from '../application/voice.js';

@Injectable()
export class PrismaVoiceStore implements VoiceStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async hasConsent(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { voiceConsentAt: true },
    });
    return user?.voiceConsentAt != null;
  }

  async setConsent(userId: string, accepted: boolean) {
    // On garde la date du premier accord ; retirer le consentement efface la date.
    await this.db.user.updateMany({
      where: { id: userId, voiceConsentAt: accepted ? null : { not: null } },
      data: { voiceConsentAt: accepted ? new Date() : null },
    });
  }
}
