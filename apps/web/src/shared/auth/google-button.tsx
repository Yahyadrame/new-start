'use client';

import type { SignupProfile } from '@newstart/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import fr from '../i18n/fr.json';
import { GoogleSignInError, signInWithGoogle } from './google-api';
import { setSession } from './session';

const t = fr.google;
const SCRIPT = 'https://accounts.google.com/gsi/client';

type Gis = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

function loadGis(): Promise<Gis> {
  const w = window as unknown as { google?: Gis };
  if (w.google?.accounts) return Promise.resolve(w.google);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (w.google ? resolve(w.google) : reject(new Error('gis')));
    script.onerror = () => reject(new Error('gis'));
    document.head.append(script);
  });
}

/** Le thème se pose sur <html data-theme> ; sans choix, c'est le réglage du système qui décide. */
export function isDarkTheme(): boolean {
  const choice = document.documentElement.getAttribute('data-theme');
  if (choice) return choice === 'dark';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function googleMessage(err: unknown): string {
  if (!(err instanceof GoogleSignInError)) return t.errors.server;
  if (err.status === 404) return t.errors.notFound;
  if (err.status === 409) return t.errors.conflict;
  if (err.status === 503) return t.errors.unavailable;
  if (err.status === 401) return t.errors.rejected;
  return t.errors.server;
}

/**
 * « Continuer avec Google » (NS-103). Rien ne s'affiche tant que `NEXT_PUBLIC_GOOGLE_CLIENT_ID` n'est pas posé.
 * À l'inscription, `getProfile` rend le profil saisi (ou null s'il est incomplet) pour créer le compte.
 */
export function GoogleButton({
  redirectTo,
  getProfile,
  onError,
}: {
  redirectTo: string;
  getProfile?: () => SignupProfile | null;
  onError: (message: string | null) => void;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  // Le bouton est rendu une fois : les dernières valeurs passent par la ref.
  const latest = useRef({ getProfile, onError, redirectTo });
  latest.current = { getProfile, onError, redirectTo };

  useEffect(() => {
    if (!clientId) return;
    let alive = true;
    loadGis()
      .then((gis) => {
        const el = host.current;
        if (!alive || !el) return;
        gis.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            const { getProfile: profile, onError: fail, redirectTo: to } = latest.current;
            fail(null);
            const signup = profile?.();
            if (profile && !signup) return fail(t.errors.profile);
            try {
              setSession(await signInWithGoogle(credential, signup ?? undefined));
              router.push(to);
            } catch (err) {
              fail(googleMessage(err));
            }
          },
        });
        const dark = isDarkTheme();
        gis.accounts.id.renderButton(el, {
          type: 'standard',
          theme: dark ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          locale: 'fr',
          width: Math.min(400, Math.max(200, el.clientWidth)),
        });
      })
      .catch(() => alive && latest.current.onError(t.errors.unavailable));
    return () => {
      alive = false;
    };
  }, [clientId, router]);

  if (!clientId) return null;
  return (
    <>
      <p aria-hidden="true" className="text-center text-[14px] text-text-muted">
        {t.or}
      </p>
      <div ref={host} data-testid="google-button" className="flex min-h-11 justify-center" />
    </>
  );
}
