import { describe, expect, it } from 'vitest';
import { LIBRARY_IDS, LIBRARY_SIZE, isLibraryId, librarySpec } from './library';
import {
  AVATAR_VARIANTS,
  CONTACT_AVATARS,
  PALETTES,
  PALETTE_NAMES,
  darken,
  neutralSvg,
} from './neutral-avatar';
import { BODY, CUTS, FRONT, PARTS } from './parts';

function spec(id: string) {
  const s = librarySpec(id);
  if (!s) throw new Error(`silhouette introuvable : ${id}`);
  return s;
}
function contact(id: string) {
  const c = CONTACT_AVATARS[id];
  if (!c) throw new Error(`contact introuvable : ${id}`);
  return c;
}
function part(name: string) {
  return PARTS[name] ?? '';
}

describe('bibliothèque', () => {
  it('compte 360 silhouettes numérotées a001 à a360', () => {
    expect(LIBRARY_SIZE).toBe(360);
    expect(LIBRARY_IDS).toHaveLength(360);
    expect(LIBRARY_IDS[0]).toBe('a001');
    expect(LIBRARY_IDS.at(-1)).toBe('a360');
  });

  it('donne 360 combinaisons différentes', () => {
    const keys = LIBRARY_IDS.map((id) => JSON.stringify(librarySpec(id)));
    expect(new Set(keys).size).toBe(360);
  });

  it('est stable : même identifiant, même silhouette', () => {
    expect(librarySpec('a042')).toEqual(librarySpec('a042'));
    expect(librarySpec('a001')).toEqual({
      palette: 'Quotidien',
      parts: expect.any(Array),
      cut: expect.any(Array),
    });
  });

  it('ne marie pas la barbe longue avec un foulard ou un turban', () => {
    for (const id of LIBRARY_IDS) {
      const { parts } = spec(id);
      if (parts.includes('headscarf') || parts.includes('turban')) {
        expect(parts).not.toContain('longBeard');
      }
    }
  });

  it("n'utilise que des pièces dessinées", () => {
    for (const id of LIBRARY_IDS) {
      const { parts, cut } = spec(id);
      for (const p of parts) expect(PARTS[p], p).toBeTruthy();
      for (const c of cut) expect(CUTS[c], c).toBeTruthy();
    }
    expect([...FRONT].every((p) => PARTS[p])).toBe(true);
  });

  it('reconnaît les identifiants', () => {
    expect(isLibraryId('a360')).toBe(true);
    expect(isLibraryId('a361')).toBe(false);
    expect(librarySpec('jade')).toBeUndefined();
  });
});

describe('neutralSvg', () => {
  const first = spec('a001');

  it('rend un SVG autonome pour chaque variante, thème et forme', () => {
    for (const v of AVATAR_VARIANTS)
      for (const t of ['light', 'dark'] as const)
        for (const s of ['rond', 'carre'] as const) {
          const svg = neutralSvg(first, v, t, s);
          expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
          expect(svg).toContain(BODY);
          expect(svg.endsWith('</svg>')).toBe(true);
        }
  });

  it('découpe en carré arrondi ou en rond', () => {
    expect(neutralSvg(first, 'gris', 'light', 'carre')).toContain('rx="26"');
    expect(neutralSvg(first, 'gris', 'light', 'rond')).toContain(
      '<circle cx="50" cy="50" r="50"/>',
    );
  });

  it('assombrit le fond en thème sombre', () => {
    const [bg, fg] = PALETTES[first.palette] ?? ['', ''];
    expect(neutralSvg(first, 'theme', 'dark', 'rond')).toContain(`fill="${darken(fg, 0.32)}"`);
    expect(neutralSvg(first, 'theme', 'light', 'rond')).toContain(`fill="${bg}"`);
  });

  it("dessine l'anneau selon la forme", () => {
    expect(neutralSvg(first, 'anneau', 'light', 'carre')).toContain('rx="24"');
    expect(neutralSvg(first, 'anneau', 'light', 'rond')).toContain('r="46.5"');
    expect(neutralSvg(first, 'duo', 'light', 'rond')).not.toContain('stroke-width="5"');
  });

  it('passe les cheveux du front devant la tête en deux tons', () => {
    const svg = neutralSvg(contact('jade'), 'duo', 'light', 'rond');
    expect(svg.split(part('bun')).length - 1).toBe(2);
    expect(neutralSvg(contact('jade'), 'gris', 'light', 'rond').split(part('bun')).length - 1).toBe(
      1,
    );
  });

  it('ajoute la frange des coiffures longues et la barbe en dernier', () => {
    expect(neutralSvg(contact('maya'), 'duo', 'light', 'rond')).toContain('M34 40c0-12 7-19');
    const prof = neutralSvg(contact('prof-ade'), 'noir', 'dark', 'rond');
    expect(prof).toContain('fill="#5A5A5A"');
  });

  it('retombe sur la palette Ardoise si la palette est inconnue', () => {
    const svg = neutralSvg({ ...first, palette: 'Inconnue' }, 'theme', 'light', 'rond');
    expect(svg).toContain('#DDE3E8');
  });

  it('couvre les 23 contacts et les 16 palettes', () => {
    expect(Object.keys(CONTACT_AVATARS)).toHaveLength(23);
    expect(PALETTE_NAMES).toHaveLength(16);
  });

  it('dessine chacun des 23 contacts avec une palette connue, sans doublon', () => {
    const svgs = Object.values(CONTACT_AVATARS).map((spec) => {
      expect(PALETTE_NAMES).toContain(spec.palette);
      return neutralSvg(spec, 'duo', 'light', 'carre');
    });
    expect(new Set(svgs).size).toBe(23);
  });
});
