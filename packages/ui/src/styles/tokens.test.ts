import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

/** Valeur d'un jeton dans le premier bloc `selector { … }` qui le définit. */
function token(block: RegExp, name: string): string {
  const body = css.match(block)?.[1] ?? '';
  const m = body.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  if (!m?.[1]) throw new Error(`jeton ${name} introuvable`);
  return m[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const light = /:root\s*\{([^}]*)\}/;
const dark = /:root\[data-theme='dark'\]\s*\{([^}]*)\}/;

describe('contraste du rouge danger (4,5:1, docs/04-design-system.md)', () => {
  it.each([
    ['clair', light, ['bg', 'surface-1']],
    ['sombre', dark, ['bg', 'surface-1']],
  ] as const)('le texte d’erreur se lit sur les fonds du thème %s', (_n, block, surfaces) => {
    const danger = token(block, 'color-danger');
    for (const s of surfaces) {
      expect(
        contrast(danger, token(block === dark ? dark : light, `color-${s}`)),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('le texte blanc du bouton plein se lit dans les deux thèmes', () => {
    expect(contrast(token(light, 'color-danger-solid'), '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('le thème sombre automatique reprend le rouge du thème sombre', () => {
    const auto = css.match(/prefers-color-scheme: dark\)\s*\{[\s\S]*?\{([^}]*)\}/)?.[1] ?? '';
    expect(auto).toContain(`--color-danger: ${token(dark, 'color-danger')}`);
  });
});
