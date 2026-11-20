import { z } from 'zod';

/** Un thème de `GET /topics`, avec le nombre de contacts actifs qu'il contient. */
export const TopicItem = z.object({
  slug: z.string(),
  nameFr: z.string(),
  agentCount: z.number().int().min(0),
});
export type TopicItem = z.infer<typeof TopicItem>;

/** Un contact du catalogue, tel que `GET /agents` le renvoie. */
export const AgentCard = z.object({
  slug: z.string(),
  name: z.string(),
  initials: z.string(),
  roleFr: z.string(),
  category: z.string(),
  /** Slug du thème, ou null pour les contacts du quotidien. */
  topic: z.string().nullable(),
});
export type AgentCard = z.infer<typeof AgentCard>;

/** Filtres de `GET /agents` : thème et recherche, tous deux facultatifs. */
export const AgentsQuery = z.object({
  topic: z.string().min(1).max(40).optional(),
  q: z.string().trim().min(1).max(50).optional(),
});
export type AgentsQuery = z.infer<typeof AgentsQuery>;
