'use client';

import { useEffect, useState } from 'react';
import fr from '../../shared/i18n/fr.json';
import { THEME_KEY, type Theme, applyTheme, readTheme } from './theme';

const options: Theme[] = ['system', 'light', 'dark'];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => setTheme(readTheme(window.localStorage)), []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour cette visite seulement.
    }
  }

  return (
    <div
      role="group"
      aria-label={fr.theme.label}
      className="inline-flex rounded-full bg-surface-1 p-1"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={theme === option}
          onClick={() => choose(option)}
          className="min-h-11 rounded-full px-4 text-sm font-semibold aria-pressed:bg-accent aria-pressed:text-on-accent"
        >
          {fr.theme[option]}
        </button>
      ))}
    </div>
  );
}
