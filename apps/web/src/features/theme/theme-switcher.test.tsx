import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_KEY } from './theme';
import { ThemeSwitcher } from './theme-switcher';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ThemeSwitcher', () => {
  it('propose Système, Clair et Sombre avec Système choisi par défaut', () => {
    render(<ThemeSwitcher />);
    expect(screen.getByRole('button', { name: 'Système' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Clair' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(screen.getByRole('button', { name: 'Sombre' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });
  it('applique et enregistre le thème choisi', () => {
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'Sombre' }));
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(screen.getByRole('button', { name: 'Sombre' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
  it('retrouve le choix enregistré au chargement', () => {
    window.localStorage.setItem(THEME_KEY, 'light');
    render(<ThemeSwitcher />);
    expect(screen.getByRole('button', { name: 'Clair' }).getAttribute('aria-pressed')).toBe('true');
  });
  it('applique quand même le thème si le stockage est indisponible', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'Clair' }));
    expect(document.documentElement.dataset['theme']).toBe('light');
  });
});
