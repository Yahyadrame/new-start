import { AVATAR_VARIANTS } from '@newstart/shared';

export type AvatarVariantName = (typeof AVATAR_VARIANTS)[number];
export type AvatarShapeName = 'rond' | 'carre';

const isVariant = (v: string | undefined): v is AvatarVariantName =>
  (AVATAR_VARIANTS as readonly string[]).includes(v ?? '');

/** Style des contacts : « duo » tant que la variable n'est pas posée ou qu'elle est invalide. */
export const parseContactStyle = (value: string | undefined): AvatarVariantName =>
  isVariant(value) ? value : 'duo';

/** Forme des avatars : « carre » (carré arrondi) par défaut, « rond » sur demande. */
export const parseShape = (value: string | undefined): AvatarShapeName =>
  value === 'rond' ? 'rond' : 'carre';

// Lues à la construction du web : changer une valeur demande un redéploiement, pas de code.
export const CONTACT_STYLE = parseContactStyle(process.env.NEXT_PUBLIC_AVATAR_CONTACT_STYLE);
export const AVATAR_SHAPE = parseShape(process.env.NEXT_PUBLIC_AVATAR_SHAPE);
