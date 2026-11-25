import { useMemo } from 'react';
import {
  CONTACT_AVATARS,
  DEFAULT_SPEC,
  neutralSvg,
  librarySpec,
  type AvatarShape,
  type AvatarSpec,
  type AvatarTheme,
  type AvatarVariant,
} from '../avatars';
import { cn } from '../lib/cn';

export interface NeutralAvatarProps {
  /** Identifiant d'un contact d'origine (`jade`) ou de la bibliothèque (`a042`). */
  avatarId: string;
  /** Nom lu par les lecteurs d'écran. */
  name: string;
  variant?: AvatarVariant;
  shape?: AvatarShape;
  theme?: AvatarTheme;
  /** Palette imposée, à la place de celle de la silhouette. */
  palette?: string;
  className?: string;
}

/** Silhouette de l'identifiant, ou la première de la bibliothèque si l'identifiant est inconnu. */
export function resolveAvatar(avatarId: string): AvatarSpec {
  return CONTACT_AVATARS[avatarId] ?? librarySpec(avatarId) ?? DEFAULT_SPEC;
}

/**
 * Silhouette neutre dans le style du porteur. Le SVG passe par une URI de données dans un `<img>` :
 * aucun HTML injecté dans la page et aucun identifiant `clipPath` à rendre unique.
 */
export function NeutralAvatar({
  avatarId,
  name,
  variant = 'duo',
  shape = 'carre',
  theme = 'light',
  palette,
  className,
}: Readonly<NeutralAvatarProps>) {
  const src = useMemo(() => {
    const spec = resolveAvatar(avatarId);
    const svg = neutralSvg(palette ? { ...spec, palette } : spec, variant, theme, shape);
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [avatarId, palette, variant, theme, shape]);
  return <img src={src} alt={name} className={cn('size-11 shrink-0 object-cover', className)} />;
}
