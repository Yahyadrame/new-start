import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
);
vi.mock('next/navigation', () => ({ notFound }));
vi.mock('../../../features/profile', async () => {
  const actual = await vi.importActual<typeof import('../../../features/profile/sections')>(
    '../../../features/profile/sections',
  );
  return {
    ...actual,
    ProfileScreen: ({ section }: { section: string }) => <p>profil {section}</p>,
  };
});
const { default: Page, generateStaticParams } = await import('./page');

describe('/profile/[section]', () => {
  it('ouvre la page de la rubrique demandée', async () => {
    const ui = await Page({ params: Promise.resolve({ section: 'learning' }) });
    expect(render(ui).getByText('profil learning')).toBeTruthy();
  });

  it('répond « introuvable » pour une rubrique inconnue', async () => {
    await expect(Page({ params: Promise.resolve({ section: 'inconnue' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });

  it('prépare une page par rubrique', () => {
    expect(generateStaticParams().map((p) => p.section)).toEqual([
      'account',
      'learning',
      'notifications',
      'appearance',
      'notebook',
      'data',
    ]);
  });
});
