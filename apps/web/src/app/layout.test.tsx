import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const localFont = vi.hoisted(() =>
  vi.fn((o: { src: string; variable: string }) => ({ variable: `class${o.variable}` })),
);
vi.mock('next/font/local', () => ({ default: localFont }));
const { default: RootLayout, metadata } = await import('./layout');
// Les polices se déclarent au chargement du module : on garde les appels avant tout nettoyage de mocks.
const fontCalls = [...localFont.mock.calls];

describe('RootLayout', () => {
  it('déclare la page en français avec les polices, le script de thème et le contenu', () => {
    const html = renderToStaticMarkup(<RootLayout>contenu</RootLayout>);
    expect(html).toContain('lang="fr"');
    expect(html).toContain('class--font-inter class--font-space-grotesk');
    expect(fontCalls).toHaveLength(2);
    for (const [options] of fontCalls) expect(options.src).toMatch(/\.woff2$/);
    expect(html).toContain('ns-theme');
    expect(html).toContain('contenu');
    expect(metadata.title).toBe('new start');
  });
});
