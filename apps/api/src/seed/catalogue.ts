import { z } from 'zod';

// Catalogue de lancement : `data/catalogue.json` (docs/03-contenu-pedagogique.md).
// Les fiches se modifient ensuite en base, sans redéploiement.
const text = z.string().trim().min(1);
const TopicSeed = z.strictObject({ slug: text, nameFr: text, adultOnly: z.boolean() });
const AgentSeed = z.strictObject({
  slug: text,
  name: text,
  initials: text,
  category: text,
  topic: text.nullable(),
  roleFr: text,
  persona: text,
  style: text,
  voiceId: text,
  accent: text,
  firstMessage: text,
  suggestions: z.array(text).min(3),
});
const Catalogue = z
  .strictObject({ topics: z.array(TopicSeed), agents: z.array(AgentSeed) })
  .refine(
    (c) => c.agents.every((a) => a.topic === null || c.topics.some((t) => t.slug === a.topic)),
    {
      message: 'Un contact renvoie à un thème absent du catalogue',
    },
  );
export type CatalogueSeed = z.infer<typeof Catalogue>;

export const parseCatalogue = (json: string): CatalogueSeed => Catalogue.parse(JSON.parse(json));

// Sous-ensemble du client Prisma dont le seed a besoin (permet de le tester sans base).
export type CatalogueDb = {
  topic: { upsert(args: TopicUpsert): Promise<{ id: string }> };
  agent: { upsert(args: AgentUpsert): Promise<unknown> };
};
type TopicUpsert = {
  where: { slug: string };
  create: { slug: string; nameFr: string; adultOnly: boolean; order: number };
  update: { nameFr: string; adultOnly: boolean; order: number };
};
type AgentData = Omit<CatalogueSeed['agents'][number], 'topic'> & { topicId: string | null };
type AgentUpsert = { where: { slug: string }; create: AgentData; update: AgentData };

// Idempotent : relancer met les fiches à jour sans doublon (clé : `slug`).
export async function seedCatalogue(db: CatalogueDb, json: string) {
  const { topics, agents } = parseCatalogue(json);
  const topicIds = new Map<string, string>();
  for (const [i, t] of topics.entries()) {
    const data = { nameFr: t.nameFr, adultOnly: t.adultOnly, order: i + 1 };
    const row = await db.topic.upsert({
      where: { slug: t.slug },
      create: { slug: t.slug, ...data },
      update: data,
    });
    topicIds.set(t.slug, row.id);
  }
  for (const { topic, ...fields } of agents) {
    const data = { ...fields, topicId: topic === null ? null : (topicIds.get(topic) ?? null) };
    await db.agent.upsert({ where: { slug: fields.slug }, create: data, update: data });
  }
  return { topics: topics.length, agents: agents.length };
}
