import { Inject, Injectable } from '@nestjs/common';
import { AvatarChoice, type ContactAvatars } from '@newstart/shared';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { ContactAvatarsStore } from '../application/contact-avatars.js';

@Injectable()
export class PrismaContactAvatarsStore implements ContactAvatarsStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async list(userId: string): Promise<ContactAvatars> {
    const rows = await this.db.contactAvatar.findMany({
      where: { userId },
      select: { avatar: true, agent: { select: { slug: true } } },
    });
    const out: ContactAvatars = {};
    for (const { avatar, agent } of rows) {
      const parsed = AvatarChoice.safeParse(avatar);
      if (parsed.success) out[agent.slug] = parsed.data;
    }
    return out;
  }

  async set(userId: string, slug: string, choice: AvatarChoice) {
    const agent = await this.db.agent.findUnique({ where: { slug }, select: { id: true } });
    if (!agent) return false;
    await this.db.contactAvatar.upsert({
      where: { userId_agentId: { userId, agentId: agent.id } },
      create: { userId, agentId: agent.id, avatar: choice },
      update: { avatar: choice },
    });
    return true;
  }

  async clear(userId: string, slug: string) {
    await this.db.contactAvatar.deleteMany({ where: { userId, agent: { slug } } });
  }
}
