import { beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_KEY, applyTheme, isTheme, readTheme, storeTheme, themeInitScript } from './theme';

beforeEach(() => document.documentElement.removeAttribute('data-theme'));

describe('theme', () => {
  it('reconnaît seulement les trois thèmes', () => {
    expect(['system', 'light', 'dark'].every(isTheme)).toBe(true);
    expect(isTheme('violet')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
  it('pose data-theme pour clair et sombre, le retire pour système', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    applyTheme('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
  it('lit le choix enregistré, système par défaut', () => {
    expect(readTheme({ getItem: () => 'dark' })).toBe('dark');
    expect(readTheme({ getItem: () => 'n’importe quoi' })).toBe('system');
    expect(readTheme({ getItem: () => null })).toBe('system');
    expect(readTheme(undefined)).toBe('system');
  });
  it('retombe sur système quand le stockage lève une erreur', () => {
    expect(
      readTheme({
        getItem: () => {
          throw new Error('bloqué');
        },
      }),
    ).toBe('system');
  });
  it('le script d’initialisation applique le thème enregistré avant l’affichage', () => {
    window.localStorage.setItem(THEME_KEY, 'dark');
    new Function(themeInitScript)();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    window.localStorage.setItem(THEME_KEY, 'system');
    document.documentElement.removeAttribute('data-theme');
    new Function(themeInitScript)();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    window.localStorage.clear();
  });

  it('garde le thème choisi, sans erreur si le stockage est bloqué', () => {
    const setItem = vi.fn();
    storeTheme('dark', { setItem });
    expect(setItem).toHaveBeenCalledWith(THEME_KEY, 'dark');
    expect(() =>
      storeTheme('light', {
        setItem: () => {
          throw new Error('bloqué');
        },
      }),
    ).not.toThrow();
    expect(() => storeTheme('light', undefined)).not.toThrow();
  });
});
