import { Inject, Injectable } from '@nestjs/common';
import type { AgentCard, AgentsQuery, TopicItem } from '@newstart/shared';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { CatalogStore } from '../application/catalog.js';

@Injectable()
export class PrismaCatalogStore implements CatalogStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async birthYear(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { birthYear: true },
    });
    return user?.birthYear;
  }

  async topics({ withAdult }: { withAdult: boolean }): Promise<TopicItem[]> {
    const rows = await this.db.topic.findMany({
      where: withAdult ? {} : { adultOnly: false },
      orderBy: { order: 'asc' },
      select: {
        slug: true,
        nameFr: true,
        _count: { select: { agents: { where: { isActive: true } } } },
      },
    });
    return rows.map(({ _count, ...topic }) => ({ ...topic, agentCount: _count.agents }));
  }

  async topicAdultOnly(slug: string) {
    const topic = await this.db.topic.findUnique({ where: { slug }, select: { adultOnly: true } });
    return topic ? topic.adultOnly : null;
  }

  async agents({
    withAdult,
    topic,
    q,
  }: { withAdult: boolean } & AgentsQuery): Promise<AgentCard[]> {
    const rows = await this.db.agent.findMany({
      where: {
        isActive: true,
        ...(topic ? { topic: { slug: topic } } : {}),
        ...(withAdult ? {} : { NOT: { topic: { adultOnly: true } } }),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { roleFr: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        slug: true,
        name: true,
        initials: true,
        roleFr: true,
        category: true,
        topic: { select: { slug: true } },
      },
    });
    return rows.map(({ topic: t, ...agent }) => ({ ...agent, topic: t?.slug ?? null }));
  }
}
