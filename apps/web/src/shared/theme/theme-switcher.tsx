'use client';

import { useEffect, useState } from 'react';
import fr from '../i18n/fr.json';
import { type Theme, applyTheme, readTheme, storeTheme } from './theme';

const options: Theme[] = ['system', 'light', 'dark'];

/** `onChange` prévient l'écran du profil, qui enregistre aussi le choix sur le compte. */
export function ThemeSwitcher({ onChange }: { onChange?: (theme: Theme) => void }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => setTheme(readTheme(window.localStorage)), []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
    storeTheme(next, window.localStorage);
    onChange?.(next);
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
