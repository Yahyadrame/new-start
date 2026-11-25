/** Pièces des silhouettes neutres, sur un repère 100 × 100 (tête centrée en 50 41, rayon 16).
 *  Tracés repris à l'identique de `design/avatars/avatars.js` et `bibliotheque.js`. */
export const HEAD = '<circle cx="50" cy="41" r="16"/>';
export const BODY = '<path d="M17 92c2-19 15-30 33-30s31 11 33 30c-9 7-20 10-33 10s-24-3-33-10z"/>';

/** Cheveux, couvre-chefs et barbes : dessinés dans la couleur de la silhouette. */
export const PARTS: Record<string, string> = {
  short: '<path d="M33 40c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/>',
  quiff:
    '<path d="M33 40c-1-13 7-21 17-21 6 0 11 2 14 6 3 0 5 3 3 6l0 9c-3-7-9-10-17-10s-14 3-17 10z"/><path d="M46 21c4-6 12-7 17-3-5 0-9 2-11 5z"/>',
  buzz: '<path d="M34.5 38c0-11 7-17.5 15.5-17.5S65.5 27 65.5 38c-4-4-9-6-15.5-6s-11.5 2-15.5 6z"/>',
  bun: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><circle cx="50" cy="17" r="7.5"/>',
  long: '<path d="M30 44c0-16 9-25 20-25s20 9 20 25c0 9 2 16 6 22-7 3-15 4-26 4s-19-1-26-4c4-6 6-13 6-22z"/>',
  ponytail:
    '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><path d="M64 30c7 2 10 9 9 18-1 6-4 10-7 12 1-6 1-12-2-18z"/>',
  bob: '<path d="M31 44c0-15 8-24 19-24s19 9 19 24l1 12c-3 1-6 1-8 0l-1-14c-3-5-7-8-11-9-4 1-8 4-11 9l-1 14c-2 1-5 1-8 0z"/>',
  curly:
    '<circle cx="38" cy="30" r="8"/><circle cx="50" cy="25" r="9"/><circle cx="62" cy="30" r="8"/><circle cx="34" cy="39" r="6"/><circle cx="66" cy="39" r="6"/>',
  afroShort:
    '<circle cx="40" cy="31" r="6"/><circle cx="47" cy="26.5" r="6"/><circle cx="54" cy="26.5" r="6"/><circle cx="61" cy="31" r="6"/>',
  grey: '<path d="M34 37c0-11 7-17 16-17s16 6 16 17c-3-5-9-7-16-7s-13 2-16 7z"/>',
  officerCap:
    '<path d="M31 32c0-7 8-12 19-12s19 5 19 12z"/><rect x="29" y="31" width="42" height="5" rx="2.5"/><path d="M34 36h32l-3 5H37z"/>',
  beard: '<path d="M35 42c1 11 7 17 15 17s14-6 15-17c-3 4-7 6-15 6s-12-2-15-6z"/>',
  beardLight: '<path d="M37 47c2 7 7 10 13 10s11-3 13-10c-4 3-8 4-13 4s-9-1-13-4z"/>',
  mohawk: '<path d="M45 29c-1-9 1-15 5-16 4 1 6 7 5 16-3-2-7-2-10 0z"/>',
  afroBig:
    '<circle cx="50" cy="24" r="11"/><circle cx="37" cy="30" r="9"/><circle cx="63" cy="30" r="9"/><circle cx="32" cy="41" r="7"/><circle cx="68" cy="41" r="7"/><path d="M34 38c0-8 7-12 16-12s16 4 16 12c-3-4-9-6-16-6s-13 2-16 6z"/>',
  twa: '<circle cx="41" cy="30" r="5"/><circle cx="50" cy="26" r="5.5"/><circle cx="59" cy="30" r="5"/><circle cx="36" cy="37" r="4"/><circle cx="64" cy="37" r="4"/>',
  pixie: '<path d="M33 41c-2-13 6-21 17-21 7 0 13 4 15 10-3-2-6-3-10-2-7 1-13 5-15 13z"/>',
  sidePart: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-2-6-6-9-10-10-7 5-14 5-20 10z"/>',
  pompadour:
    '<path d="M33 40c-1-12 6-19 14-20 4-5 14-5 18 1 3 3 3 8 2 19-3-7-9-10-17-10s-13 3-17 10z"/>',
  spaceBuns:
    '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><circle cx="35" cy="21" r="6.5"/><circle cx="65" cy="21" r="6.5"/>',
  pigtails:
    '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><path d="M33 40c-6 2-9 8-8 17 4-1 7-5 8-9z"/><path d="M67 40c6 2 9 8 8 17-4-1-7-5-8-9z"/>',
  braids:
    '<path d="M32 42c0-14 8-23 18-23s18 9 18 23c-3-7-9-10-18-10s-15 3-18 10z"/><path d="M33 42l-3 22 5 0 2-18z"/><path d="M67 42l3 22-5 0-2-18z"/>',
  locs: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><rect x="30" y="38" width="4.5" height="26" rx="2.2"/><rect x="36" y="42" width="4" height="22" rx="2"/><rect x="60" y="42" width="4" height="22" rx="2"/><rect x="65.5" y="38" width="4.5" height="26" rx="2.2"/>',
  wavy: '<path d="M29 44c0-17 9-25 21-25s21 8 21 25c0 12 3 18 7 24-8 2-13 1-17-3-3 3-7 4-11 4s-8-1-11-4c-4 4-9 5-17 3 4-6 7-12 7-24z"/>',
  balding:
    '<path d="M33 45c-2-6 0-12 3-15-1 5 0 10 2 14z"/><path d="M67 45c2-6 0-12-3-15 1 5 0 10-2 14z"/>',
  headscarf:
    '<path d="M30 46c-2-17 7-27 20-27s22 10 20 27c-1 8-3 14-6 20-4-4-6-9-6-14-3 2-6 3-8 3s-5-1-8-3c0 5-2 10-6 14-3-6-5-12-6-20z"/>',
  turban:
    '<path d="M32 38c-1-10 6-18 18-18s19 8 18 18c-2 1-4 2-6 2l-24 0c-2 0-4-1-6-2z"/><path d="M36 27c6-6 18-6 28 0-3 2-5 4-6 7-5-2-11-2-16 0-1-3-3-5-6-7z"/>',
  cap: '<path d="M32 36c0-9 8-15 18-15s18 6 18 15z"/><path d="M60 35h16c0 2-2 3-5 3H60z"/>',
  beanie:
    '<path d="M32 38c0-10 8-18 18-18s18 8 18 18z"/><rect x="30" y="36" width="40" height="6" rx="3"/><circle cx="50" cy="18" r="3.5"/>',
  goatee: '<path d="M44 52c0 6 3 9 6 9s6-3 6-9c-2 2-4 3-6 3s-4-1-6-3z"/>',
  mustache: '<path d="M42 48c3-2 6-1 8 0 2-1 5-2 8 0-2 4-5 5-8 4-3 1-6 0-8-4z"/>',
  longBeard: '<path d="M35 42c0 14 6 24 15 24s15-10 15-24c-3 4-7 6-15 6s-12-2-15-6z"/>',
};

/** Éléments dessinés avec la couleur du fond, pour se détacher de la silhouette. */
export const CUTS: Record<string, string> = {
  glasses:
    '<g fill="none" stroke-width="2.4"><circle cx="43.5" cy="42" r="4.6"/><circle cx="56.5" cy="42" r="4.6"/><path d="M48 42h4"/></g>',
  tie: '<path d="M44 63l6 9 6-9" fill="none" stroke-width="2.6" stroke-linejoin="round"/>',
  collar: '<path d="M42 64l8 7 8-7" fill="none" stroke-width="2.6" stroke-linejoin="round"/>',
  apron:
    '<path d="M41 63v13M59 63v13M41 76h18M44 88h12" fill="none" stroke-width="2.4" stroke-linecap="round"/>',
  pearls:
    '<g stroke="none"><circle cx="41" cy="66" r="1.8"/><circle cx="45.5" cy="69" r="1.8"/><circle cx="50" cy="70" r="1.8"/><circle cx="54.5" cy="69" r="1.8"/><circle cx="59" cy="66" r="1.8"/></g>',
  jersey:
    '<path d="M44 63c2 3 4 4 6 4s4-1 6-4M29 80v16M71 80v16" fill="none" stroke-width="2.6" stroke-linecap="round"/>',
  headset:
    '<path d="M33 44a17 17 0 0 1 34 0" fill="none" stroke-width="2.4"/><path d="M35 47c1 6 5 8 10 8" fill="none" stroke-width="2" stroke-linecap="round"/>',
  mouth: '<path d="M45 52q5 3 10 0" fill="none" stroke-width="2.2" stroke-linecap="round"/>',
  mic: '<circle cx="50" cy="72" r="2.2" stroke="none"/>',
  glassesSquare:
    '<g fill="none" stroke-width="2.4"><rect x="38.5" y="38.5" width="10" height="7.5" rx="2"/><rect x="51.5" y="38.5" width="10" height="7.5" rx="2"/><path d="M48.5 41h3"/></g>',
  sunglasses:
    '<g stroke="none"><path d="M37 39h11v4c0 3-2 5-5.5 5S37 46 37 43z"/><path d="M52 39h11v4c0 3-2 5-5.5 5S52 46 52 43z"/><rect x="47" y="39" width="6" height="2"/></g>',
  bowtie: '<path d="M44 66l6 3-6 3zM56 66l-6 3 6 3z" stroke="none"/>',
  scarf:
    '<path d="M38 62c4 5 8 7 12 7s8-2 12-7" fill="none" stroke-width="3.2" stroke-linecap="round"/><path d="M56 67l3 12" fill="none" stroke-width="3.2" stroke-linecap="round"/>',
  vneck: '<path d="M42 63l8 10 8-10" fill="none" stroke-width="2.4" stroke-linejoin="round"/>',
  hoodie:
    '<path d="M40 63c2 6 6 9 10 9s8-3 10-9M46 72v8M54 72v8" fill="none" stroke-width="2.2" stroke-linecap="round"/>',
  stethoscope:
    '<path d="M40 63c0 10 4 15 10 15" fill="none" stroke-width="2.2"/><circle cx="52" cy="79" r="2.6" stroke="none"/>',
  chef: '<path d="M42 63l8 5 8-5M50 68v14M45 74h2M45 79h2M53 74h2M53 79h2" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  turtleneck:
    '<path d="M40 62h20M41 66h18" fill="none" stroke-width="2.4" stroke-linecap="round"/>',
  badge: '<rect x="56" y="72" width="7" height="9" rx="1.5" stroke="none"/>',
};

/** Pièces posées devant la tête en « deux tons » ; le reste passe derrière. */
export const FRONT = new Set([
  'short',
  'quiff',
  'buzz',
  'bun',
  'ponytail',
  'grey',
  'officerCap',
  'afroShort',
  'curly',
  'mohawk',
  'twa',
  'pixie',
  'sidePart',
  'pompadour',
  'spaceBuns',
  'pigtails',
  'turban',
  'cap',
  'beanie',
]);
export const BEARDS = new Set(['beard', 'beardLight', 'goatee', 'mustache', 'longBeard']);
