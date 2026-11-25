import { z } from 'zod';

/** Silhouettes de la bibliothèque : `a001` à `a360`. */
export const AVATAR_LIBRARY_SIZE = 360;
/** Variantes de rendu ; les mêmes que `AVATAR_VARIANTS` de `@newstart/ui` (sans « initiales »). */
export const AVATAR_VARIANTS = ['gris', 'theme', 'duo', 'anneau', 'noir', 'vert'] as const;
/** Palettes ; les mêmes que `PALETTE_NAMES` de `@newstart/ui`. */
export const AVATAR_PALETTES = [
  'Quotidien',
  'Pro',
  'Business',
  'Voyage',
  'Amour',
  'Sport',
  'Actualité',
  'Études',
  'Corail',
  'Indigo',
  'Menthe',
  'Ardoise',
  'Prune',
  'Ocre',
  'Ciel',
  'Lilas',
] as const;

const libraryId = z.string().refine((id) => {
  const n = /^a(\d{3})$/.exec(id)?.[1];
  return n !== undefined && Number(n) >= 1 && Number(n) <= AVATAR_LIBRARY_SIZE;
}, 'Silhouette inconnue.');

/** Choix d'avatar enregistré : la silhouette, et en option une palette et une variante qui remplacent les défauts. */
export const AvatarChoice = z.strictObject({
  id: libraryId,
  palette: z.enum(AVATAR_PALETTES).optional(),
  variant: z.enum(AVATAR_VARIANTS).optional(),
});
export type AvatarChoice = z.infer<typeof AvatarChoice>;
