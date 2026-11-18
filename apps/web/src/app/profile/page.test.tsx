import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../../shared/auth/session', () => ({ ensureSession: () => new Promise(() => {}) }));
const { default: ProfilePage } = await import('./page');

describe('/profile', () => {
  it('affiche l’écran Profil et réglages', () => {
    render(<ProfilePage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.profile.title);
    expect(screen.getByText(fr.profile.loading)).toBeTruthy();
  });
});
