import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaCatalogStore } from './prisma-catalog.store.js';

function fake() {
  const db = {
    user: { findUnique: vi.fn() },
    topic: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn() },
    agent: { findMany: vi.fn().mockResolvedValue([]) },
  };
  return { db, store: new PrismaCatalogStore(db as unknown as PrismaService) };
}

describe('PrismaCatalogStore', () => {
  it('lit l’année de naissance du compte', async () => {
    const { db, store } = fake();
    db.user.findUnique.mockResolvedValue({ birthYear: 1999 });
    expect(await store.birthYear('u1')).toBe(1999);
    db.user.findUnique.mockResolvedValue(null);
    expect(await store.birthYear('u1')).toBeUndefined();
  });

  it('compte les contacts actifs et écarte les thèmes adultes sans droit', async () => {
    const { db, store } = fake();
    db.topic.findMany.mockResolvedValue([
      { slug: 'sport', nameFr: 'Sport', _count: { agents: 1 } },
    ]);
    expect(await store.topics({ withAdult: false })).toEqual([
      { slug: 'sport', nameFr: 'Sport', agentCount: 1 },
    ]);
    const args = db.topic.findMany.mock.calls[0]?.[0];
    expect(args.where).toEqual({ adultOnly: false });
    expect(args.orderBy).toEqual({ order: 'asc' });
    await store.topics({ withAdult: true });
    expect(db.topic.findMany.mock.calls[1]?.[0].where).toEqual({});
  });

  it('dit si un thème est réservé aux majeurs, ou null s’il n’existe pas', async () => {
    const { db, store } = fake();
    db.topic.findUnique.mockResolvedValue({ adultOnly: true });
    expect(await store.topicAdultOnly('love')).toBe(true);
    db.topic.findUnique.mockResolvedValue(null);
    expect(await store.topicAdultOnly('nope')).toBeNull();
  });

  it('filtre les contacts actifs par thème et par recherche, et aplatit le thème', async () => {
    const { db, store } = fake();
    db.agent.findMany.mockResolvedValue([
      {
        slug: 'marcus',
        name: 'Marcus',
        initials: 'M',
        roleFr: 'Coach',
        category: 'Sport',
        topic: { slug: 'sport' },
      },
      {
        slug: 'jade',
        name: 'Jade',
        initials: 'J',
        roleFr: 'Coloc',
        category: 'Quotidien',
        topic: null,
      },
    ]);
    const out = await store.agents({ withAdult: false, topic: 'sport', q: 'mar' });
    expect(out.map((a) => a.topic)).toEqual(['sport', null]);
    const where = db.agent.findMany.mock.calls[0]?.[0].where;
    expect(where.isActive).toBe(true);
    expect(where.topic).toEqual({ slug: 'sport' });
    expect(where.NOT).toEqual({ topic: { adultOnly: true } });
    expect(where.OR).toHaveLength(3);
  });

  it('sans filtre ni restriction, ne pose que isActive', async () => {
    const { db, store } = fake();
    await store.agents({ withAdult: true });
    expect(db.agent.findMany.mock.calls[0]?.[0].where).toEqual({ isActive: true });
  });
});
