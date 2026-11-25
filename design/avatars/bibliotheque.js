/* Bibliothèque d'avatars New Start (NS-065) : multiplie les silhouettes de avatars.js dans le même trait.
   Une silhouette est définie par un identifiant (« a001 » à « a360 ») : pièces et palette sont recalculées
   de façon déterministe, rien n'est stocké. Utilisable dans le navigateur et dans Node. */
(function (root) {
  const N = typeof require !== 'undefined' ? require('./avatars.js') : root.NSNeutral;

  /* ---- nouvelles pièces (même repère 100 × 100 : tête centrée en 50 41, rayon 16) ---- */
  const HAIR = {
    mohawk: '<path d="M45 29c-1-9 1-15 5-16 4 1 6 7 5 16-3-2-7-2-10 0z"/>',
    afroBig: '<circle cx="50" cy="24" r="11"/><circle cx="37" cy="30" r="9"/><circle cx="63" cy="30" r="9"/><circle cx="32" cy="41" r="7"/><circle cx="68" cy="41" r="7"/><path d="M34 38c0-8 7-12 16-12s16 4 16 12c-3-4-9-6-16-6s-13 2-16 6z"/>',
    twa: '<circle cx="41" cy="30" r="5"/><circle cx="50" cy="26" r="5.5"/><circle cx="59" cy="30" r="5"/><circle cx="36" cy="37" r="4"/><circle cx="64" cy="37" r="4"/>',
    pixie: '<path d="M33 41c-2-13 6-21 17-21 7 0 13 4 15 10-3-2-6-3-10-2-7 1-13 5-15 13z"/>',
    sidePart: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-2-6-6-9-10-10-7 5-14 5-20 10z"/>',
    pompadour: '<path d="M33 40c-1-12 6-19 14-20 4-5 14-5 18 1 3 3 3 8 2 19-3-7-9-10-17-10s-13 3-17 10z"/>',
    spaceBuns: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><circle cx="35" cy="21" r="6.5"/><circle cx="65" cy="21" r="6.5"/>',
    pigtails: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><path d="M33 40c-6 2-9 8-8 17 4-1 7-5 8-9z"/><path d="M67 40c6 2 9 8 8 17-4-1-7-5-8-9z"/>',
    braids: '<path d="M32 42c0-14 8-23 18-23s18 9 18 23c-3-7-9-10-18-10s-15 3-18 10z"/><path d="M33 42l-3 22 5 0 2-18z"/><path d="M67 42l3 22-5 0-2-18z"/>',
    locs: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><rect x="30" y="38" width="4.5" height="26" rx="2.2"/><rect x="36" y="42" width="4" height="22" rx="2"/><rect x="60" y="42" width="4" height="22" rx="2"/><rect x="65.5" y="38" width="4.5" height="26" rx="2.2"/>',
    wavy: '<path d="M29 44c0-17 9-25 21-25s21 8 21 25c0 12 3 18 7 24-8 2-13 1-17-3-3 3-7 4-11 4s-8-1-11-4c-4 4-9 5-17 3 4-6 7-12 7-24z"/>',
    balding: '<path d="M33 45c-2-6 0-12 3-15-1 5 0 10 2 14z"/><path d="M67 45c2-6 0-12-3-15 1 5 0 10-2 14z"/>',
    headscarf: '<path d="M30 46c-2-17 7-27 20-27s22 10 20 27c-1 8-3 14-6 20-4-4-6-9-6-14-3 2-6 3-8 3s-5-1-8-3c0 5-2 10-6 14-3-6-5-12-6-20z"/>',
    turban: '<path d="M32 38c-1-10 6-18 18-18s19 8 18 18c-2 1-4 2-6 2l-24 0c-2 0-4-1-6-2z"/><path d="M36 27c6-6 18-6 28 0-3 2-5 4-6 7-5-2-11-2-16 0-1-3-3-5-6-7z"/>',
    cap: '<path d="M32 36c0-9 8-15 18-15s18 6 18 15z"/><path d="M60 35h16c0 2-2 3-5 3H60z"/>',
    beanie: '<path d="M32 38c0-10 8-18 18-18s18 8 18 18z"/><rect x="30" y="36" width="40" height="6" rx="3"/><circle cx="50" cy="18" r="3.5"/>',
    goatee: '<path d="M44 52c0 6 3 9 6 9s6-3 6-9c-2 2-4 3-6 3s-4-1-6-3z"/>',
    mustache: '<path d="M42 48c3-2 6-1 8 0 2-1 5-2 8 0-2 4-5 5-8 4-3 1-6 0-8-4z"/>',
    longBeard: '<path d="M35 42c0 14 6 24 15 24s15-10 15-24c-3 4-7 6-15 6s-12-2-15-6z"/>'
  };
  const CUTS = {
    glassesSquare: '<g fill="none" stroke-width="2.4"><rect x="38.5" y="38.5" width="10" height="7.5" rx="2"/><rect x="51.5" y="38.5" width="10" height="7.5" rx="2"/><path d="M48.5 41h3"/></g>',
    sunglasses: '<g stroke="none"><path d="M37 39h11v4c0 3-2 5-5.5 5S37 46 37 43z"/><path d="M52 39h11v4c0 3-2 5-5.5 5S52 46 52 43z"/><rect x="47" y="39" width="6" height="2"/></g>',
    bowtie: '<path d="M44 66l6 3-6 3zM56 66l-6 3 6 3z" stroke="none"/>',
    scarf: '<path d="M38 62c4 5 8 7 12 7s8-2 12-7" fill="none" stroke-width="3.2" stroke-linecap="round"/><path d="M56 67l3 12" fill="none" stroke-width="3.2" stroke-linecap="round"/>',
    vneck: '<path d="M42 63l8 10 8-10" fill="none" stroke-width="2.4" stroke-linejoin="round"/>',
    hoodie: '<path d="M40 63c2 6 6 9 10 9s8-3 10-9M46 72v8M54 72v8" fill="none" stroke-width="2.2" stroke-linecap="round"/>',
    stethoscope: '<path d="M40 63c0 10 4 15 10 15" fill="none" stroke-width="2.2"/><circle cx="52" cy="79" r="2.6" stroke="none"/>',
    chef: '<path d="M42 63l8 5 8-5M50 68v14M45 74h2M45 79h2M53 74h2M53 79h2" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    turtleneck: '<path d="M40 62h20M41 66h18" fill="none" stroke-width="2.4" stroke-linecap="round"/>',
    badge: '<rect x="56" y="72" width="7" height="9" rx="1.5" stroke="none"/>'
  };
  Object.assign(N.P, HAIR);
  Object.assign(N.CUT, CUTS);
  /* devant la tête en deux tons : tout ce qui est posé sur le front ; le reste passe derrière */
  ['mohawk', 'twa', 'pixie', 'sidePart', 'pompadour', 'spaceBuns', 'pigtails', 'turban', 'cap', 'beanie'].forEach(k => { N.FRONT[k] = 1; });
  ['goatee', 'mustache', 'longBeard'].forEach(k => N.BEARDS.add(k));

  /* ---- palettes : les 8 d'origine (par catégorie) et 8 nouvelles ---- */
  Object.assign(N.CAT, {
    'Corail': ['#F8DDD3', '#D2806A'], 'Indigo': ['#DDE0F7', '#7681C7'], 'Menthe': ['#D5F0DE', '#5BAA7C'],
    'Ardoise': ['#DDE3E8', '#7C8C9A'], 'Prune': ['#EBD9EA', '#A56BA3'], 'Ocre': ['#F4E3C4', '#C79A3C'],
    'Ciel': ['#D3EBF5', '#5FA3C4'], 'Lilas': ['#F6DCEF', '#C377B0']
  });
  const PALETTES = Object.keys(N.CAT);

  /* ---- tirage déterministe : un identifiant → toujours la même silhouette ---- */
  const HEADS = [
    ['short'], ['quiff'], ['buzz'], ['bun'], ['long'], ['ponytail'], ['bob'], ['curly'], ['afroShort'], ['grey'],
    ['mohawk'], ['afroBig'], ['twa'], ['pixie'], ['sidePart'], ['pompadour'], ['spaceBuns'], ['pigtails'], ['braids'],
    ['locs'], ['wavy'], ['balding'], ['headscarf'], ['turban'], ['cap'], ['beanie']
  ];
  const BEARD = [null, 'beardLight', 'beard', 'goatee', 'mustache', 'longBeard'];
  const EYES = [null, 'glasses', 'glassesSquare', 'sunglasses'];
  const OUTFIT = [null, 'collar', 'tie', 'bowtie', 'scarf', 'vneck', 'hoodie', 'turtleneck', 'stethoscope', 'chef', 'jersey', 'badge'];
  /* la barbe longue ne se marie pas avec un foulard ou un turban */
  const bad = (h, b) => (h[0] === 'headscarf' || h[0] === 'turban') && b === 'longBeard';

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const COUNT = 360;
  const all = [];
  HEADS.forEach(h => BEARD.forEach(b => EYES.forEach(e => OUTFIT.forEach(o => { if (!bad(h, b)) all.push({ h, b, e, o }); }))));
  /* mélange fixe : les 360 premières combinaisons forment la bibliothèque */
  const rnd = mulberry32(2026);
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  /* on répartit les coiffures : jamais plus de 18 silhouettes pour la même coiffure */
  const seen = {}; const picked = [];
  for (const c of all) { const k = c.h[0]; seen[k] = (seen[k] || 0) + 1; if (seen[k] <= Math.ceil(COUNT / HEADS.length) + 4) picked.push(c); if (picked.length === COUNT) break; }

  const LIBRARY = picked.map((c, i) => {
    const id = 'a' + String(i + 1).padStart(3, '0');
    const parts = c.h.concat(c.b ? [c.b] : []);
    const cut = [c.e, c.o].filter(Boolean);
    return { slug: id, n: 'Avatar ' + (i + 1), cat: PALETTES[i % PALETTES.length], parts, cut };
  });
  const byId = Object.fromEntries(LIBRARY.map(a => [a.slug, a]));

  /* svg d'une silhouette de la bibliothèque, avec une palette au choix (par défaut celle de l'identifiant) */
  function lib(id, variant, theme, shape, palette) {
    const a = byId[id]; if (!a) throw new Error('avatar inconnu : ' + id);
    return N.svg(palette ? Object.assign({}, a, { cat: palette }) : a, variant, theme, null, shape);
  }
  const api = { LIBRARY, PALETTES, lib, COUNT };
  if (typeof module !== 'undefined') module.exports = api; else root.NSLibrary = api;
})(this);
