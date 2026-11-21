import { z } from 'zod';

/** XP à gagner pour passer d'un niveau au suivant. */
// ponytail: palier fixe ; des paliers croissants si les niveaux montent trop vite
export const XP_PER_LEVEL = 100;

/** Réponse de `GET /progress` : niveau, XP total et avancement vers le niveau suivant. */
export const ProgressSummary = z.object({
  xp: z.number().int().min(0),
  level: z.number().int().min(1),
  /** XP gagnés dans le niveau en cours. */
  levelXp: z.number().int().min(0),
  /** XP à gagner pour passer au niveau suivant. */
  nextLevelXp: z.number().int().min(1),
});
export type ProgressSummary = z.infer<typeof ProgressSummary>;

/** Niveau d'après le total d'XP : on part du niveau 1 à 0 XP. */
export function summarize(xp: number): ProgressSummary {
  return {
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelXp: xp % XP_PER_LEVEL,
    nextLevelXp: XP_PER_LEVEL,
  };
}
