import { describe, expect, it } from 'vitest';
import { addFrenchKeywords } from './emoji-search-fr';

const emoji = (native: string, keywords?: string[]) => ({ keywords, skins: [{ native }] });

describe('addFrenchKeywords', () => {
  it('ajoute les mots français devant les anglais, avec et sans accents', () => {
    const data = { emojis: { elephant: emoji('🐘', ['animal', 'nature']) } };
    addFrenchKeywords(data, [{ unicode: '🐘', label: 'éléphant', tags: ['trompe'] }]);
    expect(data.emojis.elephant.keywords).toEqual([
      'éléphant',
      'elephant',
      'trompe',
      'animal',
      'nature',
    ]);
  });

  it('découpe les mots composés et accepte « coeur » comme « d’accord » tapé au clavier', () => {
    const data = { emojis: { x: emoji('❤️') } };
    addFrenchKeywords(data, [{ unicode: '❤️', label: 'cœur rouge', tags: ['d’accord'] }]);
    expect(data.emojis.x.keywords).toEqual(
      expect.arrayContaining(['cœur', 'coeur', 'rouge', "d'accord", 'accord']),
    );
    expect(data.emojis.x.keywords).not.toContain('d');
  });

  it('ignore la ponctuation et le sélecteur de variante, et laisse les émojis sans traduction', () => {
    const data = { emojis: { flag: emoji('🇸🇳'), heart: emoji('❤'), other: emoji('🆕', ['new']) } };
    addFrenchKeywords(data, [
      { unicode: '🇸🇳', label: 'drapeau : Sénégal' },
      { unicode: '❤️', label: 'cœur' },
    ]);
    expect(data.emojis.flag.keywords).toEqual(['drapeau', 'sénégal', 'senegal']);
    expect(data.emojis.heart.keywords).toContain('coeur');
    expect(data.emojis.other.keywords).toEqual(['new']);
  });
});
