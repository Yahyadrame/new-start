'use client';

import { CONTACT_AVATARS, LIBRARY_IDS, NeutralAvatar } from '@newstart/ui';
import { AVATAR_SHAPE, CONTACT_STYLE } from './config';
import { useContactChoice } from './contact-avatars';
import { useColorScheme } from './use-color-scheme';

/**
 * Silhouette d'un contact : celle qui lui est propre si elle existe, sinon une de la bibliothèque,
 * toujours la même pour un même contact. La personne peut en choisir une autre (NS-062, partie 4b).
 */
export function contactAvatarId(slug: string): string {
  if (slug in CONTACT_AVATARS) return slug;
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return LIBRARY_IDS[hash % LIBRARY_IDS.length] ?? 'a001';
}

/** L'avatar d'un contact dans les listes et les conversations : style et forme réglés par variables d'environnement. */
export function ContactAvatar({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const choice = useContactChoice(slug);
  return (
    <NeutralAvatar
      avatarId={choice?.id ?? contactAvatarId(slug)}
      name={name}
      palette={choice?.palette}
      variant={choice ? (choice.variant ?? CONTACT_STYLE) : CONTACT_STYLE}
      shape={AVATAR_SHAPE}
      theme={useColorScheme()}
      className={className}
    />
  );
}
