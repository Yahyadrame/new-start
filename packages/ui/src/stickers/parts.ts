/* Pièces des stickers (yeux, sourcils, bouche, accessoire) : tracés de `design/stickers/stickers.js`. */
const K = '#000';
const AC = '#ccff00';
const BL = '#8fd3ff';
const RD = '#ff6b6b';
const E: Record<string, string> = {
  dot: '<circle cx="36" cy="46" r="4" fill="#000" stroke="none"/><circle cx="64" cy="46" r="4" fill="#000" stroke="none"/>',
  happy: '<path d="M30 49q6-9 12 0M58 49q6-9 12 0" fill="none"/>',
  sleepy: '<path d="M30 45q6 8 12 0M58 45q6 8 12 0" fill="none"/>',
  closed: '<path d="M30 47h12M58 47h12" fill="none"/>',
  wide: '<circle cx="36" cy="46" r="7" fill="#fff"/><circle cx="64" cy="46" r="7" fill="#fff"/><circle cx="36" cy="46" r="2.5" fill="#000" stroke="none"/><circle cx="64" cy="46" r="2.5" fill="#000" stroke="none"/>',
  wink: '<circle cx="36" cy="46" r="4" fill="#000" stroke="none"/><path d="M58 49q6-9 12 0" fill="none"/>',
  side: '<circle cx="36" cy="46" r="6" fill="#fff"/><circle cx="64" cy="46" r="6" fill="#fff"/><circle cx="39" cy="46" r="2.5" fill="#000" stroke="none"/><circle cx="67" cy="46" r="2.5" fill="#000" stroke="none"/>',
  cross: '<path d="M31 41l10 10M41 41l-10 10M59 41l10 10M69 41l-10 10" fill="none"/>',
  heart:
    '<path d="M36 55c-9-6-11-9-11-12 0-4 6-5 11-1 5-4 11-3 11 1 0 3-2 6-11 12zM64 55c-9-6-11-9-11-12 0-4 6-5 11-1 5-4 11-3 11 1 0 3-2 6-11 12z" fill="#ff6b6b" stroke-width="3"/>',
  shades: '<path d="M26 40h48v6q0 10-10 10h-6q-8 0-8-8-0 8-8 8h-6q-10 0-10-10z" fill="#000"/>',
  tear: '<circle cx="36" cy="46" r="4" fill="#000" stroke="none"/><circle cx="64" cy="46" r="4" fill="#000" stroke="none"/><path d="M36 54q-5 8 0 11 5-3 0-11z" fill="#8fd3ff" stroke-width="2.5"/>',
};
const B: Record<string, string> = {
  none: '',
  up: '<path d="M28 33q8-6 16 0M56 33q8-6 16 0" fill="none"/>',
  angry: '<path d="M28 31l16 8M72 31l-16 8" fill="none"/>',
  sad: '<path d="M28 39l14-7M72 39l-14-7" fill="none"/>',
  one: '<path d="M28 36l16-3M58 28l14 6" fill="none"/>',
};
const M: Record<string, string> = {
  smile: '<path d="M34 62q16 16 32 0" fill="none"/>',
  grin: '<path d="M32 60h36q-2 20-18 20t-18-20z" fill="#000"/>',
  laugh:
    '<path d="M32 60h36q-2 20-18 20t-18-20z" fill="#000"/><path d="M40 74q10-7 20 0q-4 6-10 6t-10-6z" fill="#ff6b6b" stroke="none"/>',
  flat: '<path d="M36 68h28" fill="none"/>',
  frown: '<path d="M36 72q14-12 28 0" fill="none"/>',
  o: '<ellipse cx="50" cy="71" rx="8" ry="10" fill="#000"/>',
  wavy: '<path d="M34 68q8-7 16 0t16 0" fill="none"/>',
  smirk: '<path d="M38 66q14 8 26-6" fill="none"/>',
  tongue:
    '<path d="M34 62q16 14 32 0" fill="none"/><path d="M44 71v8q6 4 12 0v-8z" fill="#ff6b6b" stroke-width="3"/>',
  kiss: '<path d="M44 66q6-4 12 0-6 6-12 0z" fill="#000"/>',
  teeth:
    '<rect x="34" y="60" width="32" height="14" rx="6" fill="#fff"/><path d="M42 60v14M50 60v14M58 60v14" fill="none" stroke-width="2.5"/>',
  yawn: '<ellipse cx="50" cy="72" rx="12" ry="12" fill="#000"/>',
  big: '<path d="M30 58q20 30 40 0z" fill="#000"/>',
};
const X: Record<string, string> = {
  none: '',
  sweat: `<path d="M84 22q-6 10 0 14 6-4 0-14z" fill="${BL}" stroke-width="2.5"/>`,
  hearts: `<path d="M80 22c-5-4-10-1-8 4 1 3 8 8 8 8s7-5 8-8c2-5-3-8-8-4z" fill="${K}" stroke="none"/>`,
  blush: `<ellipse cx="26" cy="62" rx="6" ry="4" fill="${RD}" stroke="none" opacity=".7"/><ellipse cx="74" cy="62" rx="6" ry="4" fill="${RD}" stroke="none" opacity=".7"/>`,
  q: '<text x="82" y="26" font-size="26" font-weight="800" fill="#000" stroke="none" font-family="Inter,Arial,sans-serif">?</text>',
  excl: '<text x="82" y="26" font-size="26" font-weight="800" fill="#000" stroke="none" font-family="Inter,Arial,sans-serif">!</text>',
  zzz: '<text x="64" y="22" font-size="15" font-weight="800" fill="#000" stroke="none" font-family="Inter,Arial,sans-serif">Zzz</text>',
  dots: '<circle cx="76" cy="14" r="2.5" fill="#000" stroke="none"/><circle cx="84" cy="10" r="2.5" fill="#000" stroke="none"/><circle cx="92" cy="6" r="2.5" fill="#000" stroke="none"/>',
  check: '<path d="M62 76l6 6 12-14" fill="none" stroke-width="5"/>',
  clap: '<path d="M14 30l-6-6M10 44H2M86 30l6-6M90 44h8" fill="none"/>',
  wave: `<path d="M82 84q10-12 6-30" fill="none"/><circle cx="88" cy="46" r="8" fill="${AC}"/>`,
  thumb: `<path d="M70 86v-14h8q6 0 6 6v4q0 4-6 4zM62 86v-14l6-10q4-2 4 4v6" fill="${AC}" stroke-width="3"/>`,
  party: `<path d="M38 16l12-16 12 16z" fill="${RD}" stroke-width="3"/>`,
  mad: `<path d="M18 22l8 8M26 22l-8 8" fill="none" stroke-width="3"/><path d="M76 22l8 8M84 22l-8 8" fill="none" stroke-width="3"/>`,
  cup: `<path d="M70 70h16v10q0 8-8 8t-8-8zM86 74h4q4 0 4 4t-4 4h-4" fill="#fff" stroke-width="3"/><path d="M74 62q2-4 0-8M80 62q2-4 0-8" fill="none" stroke-width="2.5"/>`,
  phone: `<rect x="74" y="58" width="14" height="26" rx="4" fill="#fff" stroke-width="3"/>`,
  fork: `<path d="M76 88v-26M72 62v10q4 4 8 0V62" fill="none" stroke-width="3"/>`,
  clock: `<circle cx="84" cy="22" r="10" fill="#fff" stroke-width="3"/><path d="M84 16v6l4 3" fill="none" stroke-width="2.5"/>`,
  cross: `<path d="M18 20l12 12M30 20l-12 12" fill="none" stroke-width="5"/>`,
};

/** Le SVG d'un sticker à partir de ses quatre pièces ; une pièce inconnue n'ajoute rien. */
export function stickerSvg([eyes, brows, mouth, extra]: readonly [
  string,
  string,
  string,
  string,
]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="52" r="40" fill="${AC}"/>${E[eyes] ?? ''}${B[brows] ?? ''}${M[mouth] ?? ''}${X[extra] ?? ''}</svg>`;
}
