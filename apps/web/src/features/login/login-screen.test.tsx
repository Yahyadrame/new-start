import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';

afterEach(cleanup);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const { LoginScreen } = await import('./login-screen');

describe('LoginScreen', () => {
  it("affiche le titre, le retour à l'accueil et le lien vers l'inscription", () => {
    render(<LoginScreen />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.login.title);
    expect(screen.getByRole('link', { name: fr.login.back }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: fr.login.signupLink }).getAttribute('href')).toBe(
      '/signup',
    );
    expect(screen.getByRole('button', { name: fr.login.sendCode })).toBeTruthy();
  });
});
