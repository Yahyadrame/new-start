'use client';

import type { AvatarChoice } from '@newstart/shared';
import { NeutralAvatar } from '@newstart/ui';
import { useColorScheme } from './use-color-scheme';

/** L'avatar d'une personne : sa silhouette choisie, ou la silhouette grise tant qu'elle n'en a pas. */
export function UserAvatar({
  avatar,
  name,
  className,
}: {
  avatar: AvatarChoice | null;
  name: string;
  className?: string;
}) {
  return (
    <NeutralAvatar
      avatarId={avatar?.id ?? ''}
      name={name}
      variant={avatar?.variant ?? 'gris'}
      palette={avatar?.palette}
      theme={useColorScheme()}
      className={className}
    />
  );
}
