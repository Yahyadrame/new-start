import type { ChatBackground } from '@newstart/shared';

type Tile = { w: number; h: number; d?: string; dots?: boolean; circles?: [number, number][] };

/** Traits fins en SVG, répétés ; la couleur vient du texte courant (`currentColor`). */
export const TILES: Partial<Record<ChatBackground, Tile>> = {
  DOTS: { w: 24, h: 24, dots: true },
  GRID: { w: 32, h: 32, d: 'M32 0H0V32' },
  RULED: { w: 32, h: 32, d: 'M0 31H32' },
  DIAGONAL: { w: 16, h: 16, d: 'M-4 4L4 -4M0 16L16 0M12 20L20 12' },
  HONEYCOMB: {
    w: 27.71,
    h: 48,
    d: 'M0 8L13.86 0L27.71 8M0 8V24L13.86 32L27.71 24V8M13.86 32V48',
  },
  WAVES: { w: 48, h: 16, d: 'M0 8Q12 0 24 8T48 8' },
  DIAMONDS: { w: 32, h: 32, d: 'M16 0L32 16L16 32L0 16Z' },
  CIRCLES: {
    w: 48,
    h: 48,
    circles: [
      [0, 0],
      [48, 0],
      [0, 48],
      [48, 48],
      [24, 24],
    ],
  },
};
