import { z } from 'zod';

/** Une offre avec son prix dans la devise de la personne, telle que `GET /plans` la renvoie. */
export const PlanItem = z.object({
  code: z.string(),
  nameFr: z.string(),
  /** Durée d'une période en jours (0 pour l'offre gratuite). */
  periodDays: z.number().int().min(0),
  renews: z.boolean(),
  currency: z.enum(['XOF', 'USD']),
  /** Prix en unité mineure : 1 = 1 FCFA, ou 1 centime de dollar. */
  amountMinor: z.number().int().min(0),
});
export type PlanItem = z.infer<typeof PlanItem>;

/** Filtre de `GET /plans` : le pays (ISO 3166-1 alpha-2) donne la devise. */
export const PlansQuery = z.object({
  country: z
    .string()
    .length(2)
    .transform((c) => c.toUpperCase())
    .optional(),
});
export type PlansQuery = z.infer<typeof PlansQuery>;
