import { describe, expect, it } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { isSection, SECTIONS } from './sections';

describe('sections du profil', () => {
  it('reconnaît les rubriques et refuse le reste', () => {
    for (const s of SECTIONS) expect(isSection(s)).toBe(true);
    expect(isSection('inconnue')).toBe(false);
    expect(isSection('')).toBe(false);
    // Les clés héritées de l'objet ne sont pas des rubriques.
    expect(isSection('constructor')).toBe(false);
  });

  it('a un titre et un résumé en français pour chaque rubrique', () => {
    for (const s of SECTIONS) {
      expect(fr.profile.sections[s].title.length).toBeGreaterThan(0);
      expect(fr.profile.sections[s].hint.length).toBeGreaterThan(0);
    }
  });
});
