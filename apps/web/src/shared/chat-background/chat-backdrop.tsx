import type { ChatBackground } from '@newstart/shared';
import { useId } from 'react';
import { TILES } from './patterns';

/** Le fond d'une conversation : décoratif, posé derrière le contenu, sans texte ni image. */
export function ChatBackdrop({ value }: { value: ChatBackground }) {
  const id = `fond-${useId().replaceAll(':', '')}`;
  const tile = TILES[value];
  if (value === 'NONE') return null;
  if (!tile) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-accent/10" />
    );
  }
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 size-full text-line"
    >
      <defs>
        <pattern id={id} width={tile.w} height={tile.h} patternUnits="userSpaceOnUse">
          {tile.dots && <circle cx="12" cy="12" r="1.4" fill="currentColor" />}
          {tile.d && (
            <path
              d={tile.d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}
          {tile.circles?.map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
