/** Les rubriques du profil : l'accueil les liste, chacune a sa page `/profile/<rubrique>`. */
export const SECTIONS = ['learning', 'notifications', 'appearance', 'notebook', 'data'] as const;
export type Section = (typeof SECTIONS)[number];

export const isSection = (value: string): value is Section =>
  (SECTIONS as readonly string[]).includes(value);
