import { describe, expect, it } from 'vitest';
import { escapeLike, makeExcerpt } from './excerpt.js';

describe('makeExcerpt', () => {
  it('rend un texte court tel quel, espaces ramenés à un', () => {
    expect(makeExcerpt('  Hello\n  world ', 'world')).toBe('Hello world');
  });

  it('centre un texte long sur le mot trouvé, avec « … » aux bouts coupés', () => {
    const text = `${'a '.repeat(100)}needle${' b'.repeat(100)}`;
    const out = makeExcerpt(text, 'NEEDLE');
    expect(out).toContain('needle');
    expect(out.startsWith('…')).toBe(true);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(142);
  });

  it('commence au début quand le mot est près du début', () => {
    const out = makeExcerpt(`needle ${'x'.repeat(300)}`, 'needle');
    expect(out.startsWith('needle')).toBe(true);
    expect(out.endsWith('…')).toBe(true);
  });

  it('finit au dernier caractère quand le mot est près de la fin', () => {
    const out = makeExcerpt(`${'x'.repeat(300)} needle`, 'needle');
    expect(out.endsWith('needle')).toBe(true);
    expect(out.startsWith('…')).toBe(true);
  });

  it('retombe sur le début si le mot n’est pas dans le texte (accent plié, etc.)', () => {
    expect(makeExcerpt('y'.repeat(300), 'zz').startsWith('yyy')).toBe(true);
  });
});

describe('escapeLike', () => {
  it('protège %, _ et \\', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});
