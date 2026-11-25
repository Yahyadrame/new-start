import { Inject, Injectable } from '@nestjs/common';
import { ContactVariant, type ContactVariants } from '@newstart/shared';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { ContactVariantsStore } from '../application/contact-variants.js';

@Injectable()
export class PrismaContactVariantsStore implements ContactVariantsStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async list(userId: string): Promise<ContactVariants> {
    const rows = await this.db.contactVariant.findMany({
      where: { userId },
      select: { tone: true, difficulty: true, agent: { select: { slug: true } } },
    });
    const out: ContactVariants = {};
    for (const { tone, difficulty, agent } of rows) {
      const parsed = ContactVariant.safeParse({
        ...(tone && { tone }),
        ...(difficulty && { difficulty }),
      });
      if (parsed.success) out[agent.slug] = parsed.data;
    }
    return out;
  }

  async set(userId: string, slug: string, { tone, difficulty }: ContactVariant) {
    const agent = await this.db.agent.findUnique({ where: { slug }, select: { id: true } });
    if (!agent) return false;
    const data = { tone: tone ?? null, difficulty: difficulty ?? null };
    await this.db.contactVariant.upsert({
      where: { userId_agentId: { userId, agentId: agent.id } },
      create: { userId, agentId: agent.id, ...data },
      update: data,
    });
    return true;
  }

  async clear(userId: string, slug: string) {
    await this.db.contactVariant.deleteMany({ where: { userId, agent: { slug } } });
  }
}
