import { PALETTE_NAMES, type AvatarSpec } from './neutral-avatar';

/** Bibliothèque de 360 silhouettes (`a001` à `a360`), recalculées de façon déterministe : rien n'est stocké. */
export const LIBRARY_SIZE = 360;

const HEADS = [
  'short',
  'quiff',
  'buzz',
  'bun',
  'long',
  'ponytail',
  'bob',
  'curly',
  'afroShort',
  'grey',
  'mohawk',
  'afroBig',
  'twa',
  'pixie',
  'sidePart',
  'pompadour',
  'spaceBuns',
  'pigtails',
  'braids',
  'locs',
  'wavy',
  'balding',
  'headscarf',
  'turban',
  'cap',
  'beanie',
];
const BEARD = [null, 'beardLight', 'beard', 'goatee', 'mustache', 'longBeard'];
const EYES = [null, 'glasses', 'glassesSquare', 'sunglasses'];
const OUTFIT = [
  null,
  'collar',
  'tie',
  'bowtie',
  'scarf',
  'vneck',
  'hoodie',
  'turtleneck',
  'stethoscope',
  'chef',
  'jersey',
  'badge',
];

/** La barbe longue ne se marie pas avec un foulard ou un turban. */
const incompatible = (head: string, beard: string | null) =>
  (head === 'headscarf' || head === 'turban') && beard === 'longBeard';

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(): Map<string, AvatarSpec> {
  const all: { h: string; b: string | null; e: string | null; o: string | null }[] = [];
  for (const h of HEADS)
    for (const b of BEARD)
      for (const e of EYES)
        for (const o of OUTFIT) if (!incompatible(h, b)) all.push({ h, b, e, o });
  const rnd = mulberry32(2026);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const a = all[i];
    const b = all[j];
    if (a && b) [all[i], all[j]] = [b, a];
  }
  const maxPerHead = Math.ceil(LIBRARY_SIZE / HEADS.length) + 4;
  const seen: Record<string, number> = {};
  const library = new Map<string, AvatarSpec>();
  for (const c of all) {
    const count = (seen[c.h] ?? 0) + 1;
    seen[c.h] = count;
    if (count > maxPerHead) continue;
    const i = library.size;
    library.set('a' + String(i + 1).padStart(3, '0'), {
      palette: PALETTE_NAMES[i % PALETTE_NAMES.length] ?? 'Ardoise',
      parts: c.b ? [c.h, c.b] : [c.h],
      cut: [c.e, c.o].filter((x): x is string => x !== null),
    });
    if (library.size === LIBRARY_SIZE) break;
  }
  return library;
}

const LIBRARY = build();

export const LIBRARY_IDS: string[] = [...LIBRARY.keys()];
/** Silhouette de repli : la première de la bibliothèque. */
export const DEFAULT_SPEC: AvatarSpec = LIBRARY.get('a001') ?? {
  palette: 'Ardoise',
  parts: ['short'],
  cut: [],
};
export const isLibraryId = (id: string) => LIBRARY.has(id);
export const librarySpec = (id: string): AvatarSpec | undefined => LIBRARY.get(id);
