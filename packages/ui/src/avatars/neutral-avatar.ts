import { BEARDS, BODY, CUTS, FRONT, HEAD, PARTS } from './parts';

export type AvatarTheme = 'light' | 'dark';
export type AvatarShape = 'rond' | 'carre';
export const AVATAR_VARIANTS = ['gris', 'theme', 'duo', 'anneau', 'noir', 'vert'] as const;
export type AvatarVariant = (typeof AVATAR_VARIANTS)[number];

export interface AvatarSpec {
  /** Palette : une clé de `PALETTES`. */
  palette: string;
  parts: string[];
  cut: string[];
}

/** [fond clair, silhouette] ; en sombre, le fond est assombri depuis la silhouette. */
export const PALETTES: Record<string, [string, string]> = {
  Quotidien: ['#DCEBFA', '#7FA6CC'],
  Pro: ['#E6E1F5', '#9A8BC9'],
  Business: ['#F5E6D0', '#C29A5F'],
  Voyage: ['#D6EFE9', '#5FA89A'],
  Amour: ['#F7DEE4', '#C97E8E'],
  Sport: ['#E3F0D2', '#86AD5C'],
  Actualité: ['#F3EACB', '#B49B4C'],
  Études: ['#E8E3DB', '#A08F78'],
  Corail: ['#F8DDD3', '#D2806A'],
  Indigo: ['#DDE0F7', '#7681C7'],
  Menthe: ['#D5F0DE', '#5BAA7C'],
  Ardoise: ['#DDE3E8', '#7C8C9A'],
  Prune: ['#EBD9EA', '#A56BA3'],
  Ocre: ['#F4E3C4', '#C79A3C'],
  Ciel: ['#D3EBF5', '#5FA3C4'],
  Lilas: ['#F6DCEF', '#C377B0'],
};
const paletteOf = (name: string): [string, string] => PALETTES[name] ?? ['#DDE3E8', '#7C8C9A'];
export const PALETTE_NAMES = Object.keys(PALETTES);

const GREY: Record<AvatarTheme, [string, string]> = {
  light: ['#E4E4E4', '#A6A6A6'],
  dark: ['#2A2A2A', '#6B6B6B'],
};

export function darken(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  return (
    '#' +
    [n >> 16, (n >> 8) & 255, n & 255]
      .map((v) =>
        Math.round(v * k)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

function colors(palette: string, variant: AvatarVariant, theme: AvatarTheme): [string, string] {
  if (variant === 'gris' || variant === 'anneau') return GREY[theme];
  if (variant === 'noir')
    return theme === 'light' ? ['#141414', '#5C5C5C'] : ['#1C1C1C', '#8A8A8A'];
  if (variant === 'vert') return ['#CCFF00', '#000000'];
  const [bg, fg] = paletteOf(palette);
  return theme === 'light' ? [bg, fg] : [darken(fg, 0.32), fg];
}

const pick = (names: string[], from: Record<string, string>) =>
  names.map((n) => from[n] ?? '').join('');

/** Partie des cheveux posée sur le front : elle passe devant la tête en « deux tons ». */
function front(spec: AvatarSpec): string {
  const own = pick(
    spec.parts.filter((p) => FRONT.has(p)),
    PARTS,
  );
  const fringe = spec.parts.some((p) => p === 'bob' || p === 'long')
    ? '<path d="M34 40c0-12 7-19 16-19s16 7 16 19c-4-6-9-8-16-8s-12 2-16 8z"/>'
    : '';
  return own + fringe;
}

/** SVG d'une silhouette. Un `<svg>` autonome : à afficher dans un `<img>`, pas dans le DOM. */
export function neutralSvg(
  spec: AvatarSpec,
  variant: AvatarVariant,
  theme: AvatarTheme,
  shape: AvatarShape,
): string {
  const [bg, fg] = colors(spec.palette, variant, theme);
  const ringCol = paletteOf(spec.palette)[1];
  const clip =
    shape === 'carre'
      ? '<rect width="100" height="100" rx="26"/>'
      : '<circle cx="50" cy="50" r="50"/>';
  const hairCol =
    variant === 'duo'
      ? darken(fg, theme === 'light' ? 0.62 : 0.6)
      : variant === 'noir'
        ? '#CCFF00'
        : fg;
  const hair = pick(spec.parts, PARTS);
  const behind = variant === 'duo' || variant === 'noir';
  const beardCol = variant === 'noir' ? (theme === 'light' ? '#3A3A3A' : '#5A5A5A') : hairCol;
  const beards = pick(
    spec.parts.filter((p) => BEARDS.has(p)),
    PARTS,
  );
  const inner = behind
    ? `<g fill="${hairCol}">${hair}</g><g fill="${fg}">${BODY + HEAD}</g><g fill="${hairCol}">${front(spec)}</g><g fill="${beardCol}">${beards}</g>`
    : `<g fill="${fg}">${hair + BODY + HEAD}</g>`;
  const ring =
    variant !== 'anneau'
      ? ''
      : shape === 'carre'
        ? `<rect x="2.5" y="2.5" width="95" height="95" rx="24" fill="none" stroke="${ringCol}" stroke-width="5"/>`
        : `<circle cx="50" cy="50" r="46.5" fill="none" stroke="${ringCol}" stroke-width="5"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="c">${clip}</clipPath></defs>` +
    `<g clip-path="url(#c)"><rect width="100" height="100" fill="${bg}"/>${inner}` +
    `<g stroke="${bg}" fill="${bg}">${pick(spec.cut, CUTS)}</g>${ring}</g></svg>`
  );
}

/** Les 12 contacts d'origine, tels que le porteur les a dessinés. */
export const CONTACT_AVATARS: Record<string, AvatarSpec> = {
  jade: { palette: 'Quotidien', parts: ['bun'], cut: [] },
  sam: { palette: 'Quotidien', parts: ['short'], cut: ['apron'] },
  leo: { palette: 'Quotidien', parts: ['quiff'], cut: ['collar'] },
  carter: { palette: 'Pro', parts: ['curly'], cut: ['glasses', 'pearls'] },
  emma: { palette: 'Pro', parts: ['ponytail'], cut: ['headset', 'collar'] },
  daniel: { palette: 'Business', parts: ['short'], cut: ['tie'] },
  grant: { palette: 'Voyage', parts: ['officerCap'], cut: ['collar'] },
  maya: { palette: 'Amour', parts: ['long'], cut: [] },
  kofi: { palette: 'Amour', parts: ['afroShort', 'beardLight'], cut: ['mouth'] },
  marcus: { palette: 'Sport', parts: ['buzz'], cut: ['jersey'] },
  nina: { palette: 'Actualité', parts: ['bob'], cut: ['mic'] },
  'prof-ade': { palette: 'Études', parts: ['grey', 'beard'], cut: ['glasses', 'mouth', 'collar'] },
};
