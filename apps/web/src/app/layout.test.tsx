import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'inter-var' }),
  Space_Grotesk: () => ({ variable: 'grotesk-var' }),
}));
const { default: RootLayout, metadata } = await import('./layout');

describe('RootLayout', () => {
  it('déclare la page en français avec les polices, le script de thème et le contenu', () => {
    const html = renderToStaticMarkup(<RootLayout>contenu</RootLayout>);
    expect(html).toContain('lang="fr"');
    expect(html).toContain('inter-var grotesk-var');
    expect(html).toContain('ns-theme');
    expect(html).toContain('contenu');
    expect(metadata.title).toBe('new start');
  });
});
