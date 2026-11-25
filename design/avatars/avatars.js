/* Silhouettes neutres New Start — génère un SVG par contact et par variante. Utilisable dans le navigateur et dans Node. */
(function (root) {
  const HEAD = '<circle cx="50" cy="41" r="16"/>';
  const BODY = '<path d="M17 92c2-19 15-30 33-30s31 11 33 30c-9 7-20 10-33 10s-24-3-33-10z"/>';
  const P = {
    short: '<path d="M33 40c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/>',
    quiff: '<path d="M33 40c-1-13 7-21 17-21 6 0 11 2 14 6 3 0 5 3 3 6l0 9c-3-7-9-10-17-10s-14 3-17 10z"/><path d="M46 21c4-6 12-7 17-3-5 0-9 2-11 5z"/>',
    buzz: '<path d="M34.5 38c0-11 7-17.5 15.5-17.5S65.5 27 65.5 38c-4-4-9-6-15.5-6s-11.5 2-15.5 6z"/>',
    bun: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><circle cx="50" cy="17" r="7.5"/>',
    long: '<path d="M30 44c0-16 9-25 20-25s20 9 20 25c0 9 2 16 6 22-7 3-15 4-26 4s-19-1-26-4c4-6 6-13 6-22z"/>',
    ponytail: '<path d="M33 41c-1-13 7-21 17-21s18 8 17 21c-3-7-9-10-17-10s-14 3-17 10z"/><path d="M64 30c7 2 10 9 9 18-1 6-4 10-7 12 1-6 1-12-2-18z"/>',
    bob: '<path d="M31 44c0-15 8-24 19-24s19 9 19 24l1 12c-3 1-6 1-8 0l-1-14c-3-5-7-8-11-9-4 1-8 4-11 9l-1 14c-2 1-5 1-8 0z"/>',
    curly: '<circle cx="38" cy="30" r="8"/><circle cx="50" cy="25" r="9"/><circle cx="62" cy="30" r="8"/><circle cx="34" cy="39" r="6"/><circle cx="66" cy="39" r="6"/>',
    afroShort: '<circle cx="40" cy="31" r="6"/><circle cx="47" cy="26.5" r="6"/><circle cx="54" cy="26.5" r="6"/><circle cx="61" cy="31" r="6"/>',
    grey: '<path d="M34 37c0-11 7-17 16-17s16 6 16 17c-3-5-9-7-16-7s-13 2-16 7z"/>',
    officerCap: '<path d="M31 32c0-7 8-12 19-12s19 5 19 12z"/><rect x="29" y="31" width="42" height="5" rx="2.5"/><path d="M34 36h32l-3 5H37z"/>',
    beard: '<path d="M35 42c1 11 7 17 15 17s14-6 15-17c-3 4-7 6-15 6s-12-2-15-6z"/>',
    beardLight: '<path d="M37 47c2 7 7 10 13 10s11-3 13-10c-4 3-8 4-13 4s-9-1-13-4z"/>'
  };
  /* éléments dessinés avec la couleur du fond pour se détacher de la silhouette */
  const CUT = {
    glasses: '<g fill="none" stroke-width="2.4"><circle cx="43.5" cy="42" r="4.6"/><circle cx="56.5" cy="42" r="4.6"/><path d="M48 42h4"/></g>',
    tie: '<path d="M44 63l6 9 6-9" fill="none" stroke-width="2.6" stroke-linejoin="round"/>',
    collar: '<path d="M42 64l8 7 8-7" fill="none" stroke-width="2.6" stroke-linejoin="round"/>',
    apron: '<path d="M41 63v13M59 63v13M41 76h18M44 88h12" fill="none" stroke-width="2.4" stroke-linecap="round"/>',
    pearls: '<g stroke="none"><circle cx="41" cy="66" r="1.8"/><circle cx="45.5" cy="69" r="1.8"/><circle cx="50" cy="70" r="1.8"/><circle cx="54.5" cy="69" r="1.8"/><circle cx="59" cy="66" r="1.8"/></g>',
    jersey: '<path d="M44 63c2 3 4 4 6 4s4-1 6-4M29 80v16M71 80v16" fill="none" stroke-width="2.6" stroke-linecap="round"/>',
    headset: '<path d="M33 44a17 17 0 0 1 34 0" fill="none" stroke-width="2.4"/><path d="M35 47c1 6 5 8 10 8" fill="none" stroke-width="2" stroke-linecap="round"/>',
    mouth: '<path d="M45 52q5 3 10 0" fill="none" stroke-width="2.2" stroke-linecap="round"/>',
    mic: '<circle cx="50" cy="72" r="2.2" stroke="none"/>'
  };
  const OVER_UNUSED = { /* éléments dessinés dans la couleur de la silhouette, par-dessus */
    headset: '<path d="M32.5 41a17.5 17.5 0 0 1 35 0" fill="none" stroke-width="3"/><rect x="29" y="38" width="6" height="10" rx="3"/><rect x="65" y="38" width="6" height="10" rx="3"/><path d="M33 47c0 6 5 9 12 9" fill="none" stroke-width="2.2"/>'
  };

  const CONTACTS = [
    { slug: 'jade', n: 'Jade', cat: 'Quotidien', parts: ['bun'] },
    { slug: 'sam', n: 'Sam', cat: 'Quotidien', parts: ['short'], cut: ['apron'] },
    { slug: 'leo', n: 'Leo', cat: 'Quotidien', parts: ['quiff'], cut: ['collar'] },
    { slug: 'carter', n: 'Mrs. Carter', cat: 'Pro', parts: ['curly'], cut: ['glasses', 'pearls'] },
    { slug: 'emma', n: 'Emma Lin', cat: 'Pro', parts: ['ponytail'], cut: ['headset', 'collar'] },
    { slug: 'daniel', n: 'Daniel Ross', cat: 'Business', parts: ['short'], cut: ['tie'] },
    { slug: 'grant', n: 'Officer Grant', cat: 'Voyage', parts: ['officerCap'], cut: ['collar'] },
    { slug: 'maya', n: 'Maya Reed', cat: 'Amour', parts: ['long'] },
    { slug: 'kofi', n: 'Kofi Owusu', cat: 'Amour', parts: ['afroShort', 'beardLight'], cut: ['mouth'] },
    { slug: 'marcus', n: 'Marcus', cat: 'Sport', parts: ['buzz'], cut: ['jersey'] },
    { slug: 'nina', n: 'Nina Shah', cat: 'Actualité', parts: ['bob'], cut: ['mic'] },
    { slug: 'prof-ade', n: 'Prof. Adeyemi', cat: 'Études', parts: ['grey', 'beard'], cut: ['glasses', 'mouth', 'collar'] }
  ];
  /* couleur de thème : fond clair / silhouette ; en sombre, le fond est assombri */
  const CAT = {
    'Quotidien': ['#DCEBFA', '#7FA6CC'], 'Pro': ['#E6E1F5', '#9A8BC9'], 'Business': ['#F5E6D0', '#C29A5F'],
    'Voyage': ['#D6EFE9', '#5FA89A'], 'Amour': ['#F7DEE4', '#C97E8E'], 'Sport': ['#E3F0D2', '#86AD5C'],
    'Actualité': ['#F3EACB', '#B49B4C'], 'Études': ['#E8E3DB', '#A08F78']
  };
  const THEMES = {
    light: { grey: ['#E4E4E4', '#A6A6A6'], ink: '#000000' },
    dark: { grey: ['#2A2A2A', '#6B6B6B'], ink: '#F2F2F2' }
  };
  const VARIANTS = [
    { id: 'gris', label: 'Gris neutre' },
    { id: 'theme', label: 'Couleur du thème' },
    { id: 'duo', label: 'Deux tons' },
    { id: 'anneau', label: 'Anneau' },
    { id: 'noir', label: 'Noir premium' },
    { id: 'vert', label: 'Vert New Start' },
    { id: 'initiales', label: 'Initiales' }
  ];
  /* pièces posées devant la tête en deux tons ; les barbes forment un groupe à part */
  const FRONT = { short: 1, quiff: 1, buzz: 1, bun: 1, ponytail: 1, grey: 1, officerCap: 1, afroShort: 1, curly: 1 };
  const BEARDS = new Set(['beard', 'beardLight']);
  const SHAPES = [{ id: 'rond', label: 'Rond' }, { id: 'carre', label: 'Carré arrondi' }];
  const darken = (hex, k) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * k)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
  const initials = n => n.replace(/^(Mrs\.|Prof\.|Officer) /, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  function colors(c, variant, theme) {
    if (variant === 'gris' || variant === 'anneau') return THEMES[theme].grey;
    if (variant === 'noir') return theme === 'light' ? ['#141414', '#5C5C5C'] : ['#1C1C1C', '#8A8A8A'];
    if (variant === 'vert') return theme === 'light' ? ['#CCFF00', '#000000'] : ['#CCFF00', '#000000'];
    const [bg, fg] = CAT[c.cat];
    return theme === 'light' ? [bg, fg] : [darken(fg, 0.32), fg];
  }
  function svg(c, variant, theme, uid, shape) {
    const [bg, fg] = colors(c, variant, theme);
    const id = 'c' + (uid || c.slug + variant + theme + (shape || ''));
    const clip = shape === 'carre' ? '<rect width="100" height="100" rx="26"/>' : '<circle cx="50" cy="50" r="50"/>';
    const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${c.n}"><defs><clipPath id="${id}">${clip}</clipPath></defs><g clip-path="url(#${id})">`;
    if (variant === 'initiales') {
      const [b2, f2] = colors(c, 'theme', theme);
      return `${open}<rect width="100" height="100" fill="${b2}"/><text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="34" fill="${theme === 'light' ? darken(f2, 0.6) : '#F2F2F2'}">${initials(c.n)}</text></g></svg>`;
    }
    const hairCol = variant === 'duo' ? darken(fg, theme === 'light' ? 0.62 : 0.6) : (variant === 'noir' ? '#CCFF00' : fg);
    const bodyCol = variant === 'noir' ? fg : fg;
    const hair = (c.parts || []).map(p => P[p]).join('');
    const cut = (c.cut || []).map(p => CUT[p]).join('');
    const ring = variant === 'anneau' ? `<circle cx="50" cy="50" r="${shape === 'carre' ? 0 : 46.5}" fill="none" stroke="${CAT[c.cat][1]}" stroke-width="5"/>${shape === 'carre' ? `<rect x="2.5" y="2.5" width="95" height="95" rx="24" fill="none" stroke="${CAT[c.cat][1]}" stroke-width="5"/>` : ''}` : '';
    const behind = variant === 'duo' || variant === 'noir';
    const inner = behind
      ? `<g fill="${hairCol}">${hair}</g><g fill="${bodyCol}">${BODY + HEAD}</g><g fill="${hairCol}">${hairTop(c, false)}</g><g fill="${variant === 'noir' ? (theme === 'light' ? '#3A3A3A' : '#5A5A5A') : hairCol}">${hairTop(c, true)}</g>`
      : `<g fill="${fg}">${hair + BODY + HEAD}</g>`;
    return `${open}<rect width="100" height="100" fill="${bg}"/>${inner}<g stroke="${bg}" fill="${bg}">${cut}</g>${ring}</g></svg>`;
  }
  /* en deux tons, la partie des cheveux posée sur le front doit passer devant la tête */
  function hairTop(c, beards) {
    const isBeard = p => BEARDS.has(p);
    if (beards) return (c.parts || []).filter(isBeard).map(p => P[p]).join('');
    return (c.parts || []).filter(p => FRONT[p]).map(p => P[p]).join('') + ((c.parts || []).some(p => p === 'bob' || p === 'long') ? '<path d="M34 40c0-12 7-19 16-19s16 7 16 19c-4-6-9-8-16-8s-12 2-16 8z"/>' : '');
  }
  const api = { CONTACTS, VARIANTS, SHAPES, CAT, P, CUT, FRONT, BEARDS, svg, initials };
  if (typeof module !== 'undefined') module.exports = api; else root.NSNeutral = api;
})(this);
