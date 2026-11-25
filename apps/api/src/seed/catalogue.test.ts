import { AGENT_STATUSES } from '@newstart/shared';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { parseCatalogue, seedCatalogue, type CatalogueDb } from './catalogue.js';

const AGENTS_STATUS_SLUGS = Object.keys(AGENT_STATUSES);
const FILE = readFileSync(new URL('../../../../data/catalogue.json', import.meta.url), 'utf8');
const { topics: TOPICS, agents: AGENTS } = parseCatalogue(FILE);

function fakeDb() {
  const topics: string[] = [];
  const agents: { slug: string; topicId: string | null }[] = [];
  const db: CatalogueDb = {
    topic: {
      upsert: vi.fn((args) => {
        topics.push(args.where.slug);
        return Promise.resolve({ id: `id-${args.where.slug}` });
      }),
    },
    agent: {
      upsert: vi.fn((args) => {
        agents.push({ slug: args.where.slug, topicId: args.create.topicId });
        return Promise.resolve({});
      }),
    },
  };
  return { db, topics, agents };
}

describe('data/catalogue.json', () => {
  it('compte 17 thèmes et 23 contacts, les 12 de docs/03 en tête', () => {
    expect(TOPICS).toHaveLength(17);
    expect(AGENTS).toHaveLength(23);
    expect(AGENTS.slice(0, 12).map((a) => a.slug)).toEqual([
      'jade',
      'sam',
      'leo',
      'carter',
      'emma',
      'daniel',
      'grant',
      'maya',
      'kofi',
      'marcus',
      'nina',
      'prof-ade',
    ]);
  });
  it('donne un contact à chaque thème, et un statut à chaque contact', () => {
    for (const t of TOPICS) expect(AGENTS.some((a) => a.topic === t.slug)).toBe(true);
    for (const a of AGENTS) expect(AGENTS_STATUS_SLUGS).toContain(a.slug);
  });
  it('réserve aux majeurs le thème Amour et lui seul', () => {
    expect(TOPICS.filter((t) => t.adultOnly).map((t) => t.slug)).toEqual(['love']);
    expect(AGENTS.filter((a) => a.topic === 'love').map((a) => a.slug)).toEqual(['maya', 'kofi']);
  });
  it("ne fait jamais d'un contact Amour le partenaire de l'utilisateur", () => {
    for (const a of AGENTS.filter((x) => x.topic === 'love'))
      expect(a.persona).toMatch(/never a romantic partner/);
  });
});

describe('parseCatalogue', () => {
  const valid = JSON.parse(FILE) as { topics: unknown[]; agents: Record<string, unknown>[] };
  it('refuse une fiche incomplète', () => {
    const bad = { ...valid, agents: [{ ...valid.agents[0], persona: '' }] };
    expect(() => parseCatalogue(JSON.stringify(bad))).toThrow();
  });
  it('refuse une fiche sans présentation, sans intérêts ou au niveau inconnu', () => {
    for (const patch of [{ bioFr: '' }, { interests: ['a', 'b'] }, { level: 'Z9' }]) {
      const bad = { ...valid, agents: [{ ...valid.agents[0], ...patch }] };
      expect(() => parseCatalogue(JSON.stringify(bad))).toThrow();
    }
  });
  it('refuse moins de 3 suggestions', () => {
    const bad = { ...valid, agents: [{ ...valid.agents[0], suggestions: ['a'] }] };
    expect(() => parseCatalogue(JSON.stringify(bad))).toThrow();
  });
  it('refuse un contact qui renvoie à un thème absent', () => {
    const bad = { ...valid, agents: [{ ...valid.agents[0], topic: 'inconnu' }] };
    expect(() => parseCatalogue(JSON.stringify(bad))).toThrow(/thème absent/);
  });
});

describe('seedCatalogue', () => {
  it('crée les thèmes avant les contacts et relie chaque contact à son thème', async () => {
    const { db, topics, agents } = fakeDb();
    const n = await seedCatalogue(db, FILE);
    expect(n).toEqual({ topics: 17, agents: 23 });
    expect(topics).toHaveLength(17);
    expect(agents.find((a) => a.slug === 'maya')?.topicId).toBe('id-love');
    expect(agents.find((a) => a.slug === 'jade')?.topicId).toBeNull();
  });
  it('est rejouable : une clé `slug` et une mise à jour pour chaque fiche', async () => {
    const { db } = fakeDb();
    await seedCatalogue(db, FILE);
    const calls = vi.mocked(db.agent.upsert).mock.calls;
    expect(calls).toHaveLength(23);
    for (const [args] of calls) expect(args.update).toEqual(args.create);
  });
});
