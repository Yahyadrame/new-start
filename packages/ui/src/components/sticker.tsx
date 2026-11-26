import { useMemo } from 'react';
import { stickerSvg } from '../stickers/parts';
import { cn } from '../lib/cn';

export interface StickerProps {
  /** Yeux, sourcils, bouche, accessoire : `parts` d'un sticker de `@newstart/shared`. */
  parts: readonly [string, string, string, string];
  /** Texte lu par les lecteurs d'écran, en général la légende du sticker. */
  alt: string;
  className?: string | undefined;
}

/** Un sticker New Start. Le SVG passe par une URI de données dans un `<img>`, comme les silhouettes. */
export function Sticker({ parts, alt, className }: Readonly<StickerProps>) {
  const src = useMemo(() => `data:image/svg+xml,${encodeURIComponent(stickerSvg(parts))}`, [parts]);
  return <img src={src} alt={alt} className={cn('size-24 shrink-0', className)} />;
}
