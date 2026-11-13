import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

/** Forme grise de chargement, ignorée des lecteurs d'écran. Donner la taille par className. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-2xl bg-surface-2', className)}
      {...props}
    />
  );
}
