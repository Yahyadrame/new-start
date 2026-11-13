'use client';

import { Button, Skeleton } from '@newstart/ui';
import { type ReactNode, useEffect, useState } from 'react';
import fr from '../../shared/i18n/fr.json';
import { useServerReady } from './use-server-ready';

const SHOW_AFTER_MS = 500;

/** Affiche « Connexion au serveur… » tant que l'API dort ; sans apiUrl, laisse passer. */
export function ServerGate({
  apiUrl,
  children,
}: {
  apiUrl?: string | undefined;
  children: ReactNode;
}) {
  const { state, retry } = useServerReady(apiUrl);
  const [slow, setSlow] = useState(false);

  // Un serveur déjà éveillé répond en moins d'une demi-seconde : pas d'écran qui clignote.
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  if (state === 'ready') return <>{children}</>;
  if (state === 'checking' && !slow) return null;

  const failed = state === 'unreachable';
  const text = failed ? fr.server.failed : fr.server.waiting;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5 py-8">
      <div role="status" className="flex flex-col gap-2">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em]">{text.title}</h1>
        <p className="text-text-muted">{text.body}</p>
      </div>
      {failed ? (
        <Button onClick={retry} className="self-start">
          {fr.server.retry}
        </Button>
      ) : (
        <Skeleton className="h-1 w-40" />
      )}
    </main>
  );
}
