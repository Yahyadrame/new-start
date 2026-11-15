import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WelcomeScreen } from './welcome-screen';

afterEach(cleanup);

describe('WelcomeScreen', () => {
  it('affiche le titre, la promesse et le logo', () => {
    render(<WelcomeScreen />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Parle anglais. Pour de vrai.',
    );
    expect(screen.getByAltText('Logo new start').getAttribute('src')).toBe('/logo-icon.svg');
    expect(screen.getByText(/15 minutes par jour/)).toBeTruthy();
  });
  it('montre un exemple de conversation en anglais', () => {
    render(<WelcomeScreen />);
    const bubbles = screen.getByRole('list', { name: 'Exemple de conversation en anglais' });
    expect(bubbles.querySelectorAll('li')).toHaveLength(3);
    expect(screen.getByText('Hey! You must be the new roommate.')).toBeTruthy();
    expect(screen.getByText('Toi : Hi! Nice to meet you.')).toBeTruthy();
  });
  it("mène à l'inscription et à la connexion avec de vrais liens", () => {
    render(<WelcomeScreen />);
    expect(screen.getByRole('link', { name: 'Commencer gratuitement' }).getAttribute('href')).toBe(
      '/signup',
    );
    expect(screen.getByRole('link', { name: "J'ai déjà un compte" }).getAttribute('href')).toBe(
      '/login',
    );
  });
});
