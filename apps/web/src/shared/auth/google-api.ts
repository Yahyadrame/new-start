import type { SignupProfile } from '@newstart/shared';
import type { Session } from './session';

export class GoogleSignInError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`auth/google ${status}`);
  }
}

/** Échange le jeton de Google contre une session ; `signup` crée le compte s'il n'existe pas encore. */
export async function signInWithGoogle(idToken: string, signup?: SignupProfile): Promise<Session> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(signup ? { idToken, signup } : { idToken }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { code?: string } | null;
    throw new GoogleSignInError(res.status, body?.code);
  }
  return (await res.json()) as Session;
}
