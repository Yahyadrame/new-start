'use client';

import { WifiOff } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import fr from '../i18n/fr.json';

const t = fr.offline;

const subscribe = (notify: () => void) => {
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
  return () => {
    window.removeEventListener('online', notify);
    window.removeEventListener('offline', notify);
  };
};

/** Bandeau en haut de l'écran quand le navigateur n'a plus de réseau ; il disparaît au retour. */
export function OfflineBanner() {
  // Côté serveur on suppose le réseau présent : pas de bandeau dans le HTML initial.
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-text px-4 py-2 text-sm font-medium text-bg"
    >
      <WifiOff aria-hidden="true" className="size-4" />
      <span>
        {t.title} {t.hint}
      </span>
    </div>
  );
}
