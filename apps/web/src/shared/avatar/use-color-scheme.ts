'use client';

import { useSyncExternalStore } from 'react';

export type ColorScheme = 'light' | 'dark';

const QUERY = '(prefers-color-scheme: dark)';

/** Thème affiché : le choix posé sur <html> (`data-theme`), sinon celui de l'appareil. */
export function readColorScheme(): ColorScheme {
  const forced = document.documentElement.getAttribute('data-theme');
  if (forced === 'light' || forced === 'dark') return forced;
  return window.matchMedia?.(QUERY).matches ? 'dark' : 'light';
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(QUERY);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  media?.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    media?.removeEventListener('change', onChange);
  };
}

/** Le thème clair ou sombre en cours, mis à jour quand on le change dans Apparence. */
export const useColorScheme = (): ColorScheme =>
  useSyncExternalStore(subscribe, readColorScheme, () => 'light');
