import { AGENTS, TOPICS, type AgentSeed } from './catalogue.data.js';

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
type AgentData = Omit<AgentSeed, 'topic'> & { topicId: string | null };
type AgentUpsert = { where: { slug: string }; create: AgentData; update: AgentData };

// Idempotent : relancer met les fiches à jour sans doublon (clé : `slug`).
export async function seedCatalogue(db: CatalogueDb) {
  const topicIds = new Map<string, string>();
  for (const [i, t] of TOPICS.entries()) {
    const data = { nameFr: t.nameFr, adultOnly: t.adultOnly, order: i + 1 };
    const row = await db.topic.upsert({
      where: { slug: t.slug },
      create: { slug: t.slug, ...data },
      update: data,
    });
    topicIds.set(t.slug, row.id);
  }
  for (const { topic, ...fields } of AGENTS) {
    const topicId = topic === null ? null : (topicIds.get(topic) ?? null);
    if (topic !== null && topicId === null) throw new Error(`Thème inconnu : ${topic}`);
    const data = { ...fields, topicId };
    await db.agent.upsert({ where: { slug: fields.slug }, create: data, update: data });
  }
  return { topics: TOPICS.length, agents: AGENTS.length };
}
