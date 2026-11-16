import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);
import fr from '../../shared/i18n/fr.json';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const { SignupScreen } = await import('./signup-screen');

describe('SignupScreen', () => {
  it('pose la question du prénom et propose de revenir', () => {
    render(<SignupScreen />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fr.signup.title);
    expect(screen.getByRole('link', { name: fr.signup.back }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('img', { name: fr.signup.stepLabel })).toBeTruthy();
  });
});
