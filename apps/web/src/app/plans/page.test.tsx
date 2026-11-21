import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('next/navigation', () => ({ usePathname: () => '/plans' }));
const { default: Page } = await import('./page');

describe('/plans', () => {
  it('affiche l’écran provisoire avec son titre', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.comingSoon.plans.title);
  });
});
