'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(pointer: fine)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(QUERY);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

/** Vrai avec une souris ou un pavé tactile (ordinateur), faux sur un écran tactile (téléphone, tablette). */
export const useFinePointer = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(QUERY).matches ?? false,
    () => false,
  );
