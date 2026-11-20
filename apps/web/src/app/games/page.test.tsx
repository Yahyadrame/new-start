import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('next/navigation', () => ({
  usePathname: () => '/games',
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock('../../shared/auth/session', () => ({ ensureSession: () => new Promise(() => {}) }));
const { default: Page } = await import('./page');

describe('/games', () => {
  it('affiche l’écran des jeux avec son titre', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.games.title);
  });
});
