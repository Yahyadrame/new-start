import type { Session } from '../../shared/auth/session';

export class LoginError extends Error {
  constructor(readonly status: number) {
    super(`auth ${status}`);
  }
}

const post = (path: string, body: object) =>
  fetch(`/api/auth/otp/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'email', ...body }),
  });

/** Demande un code pour un compte existant : sans profil, l'API ne crée rien (NS-102). */
export async function requestLoginCode(email: string): Promise<void> {
  const res = await post('request', { destination: email });
  if (!res.ok) throw new LoginError(res.status);
}

/** Vérifie le code ; l'API ouvre la session et pose le cookie de rafraîchissement. */
export async function verifyLoginCode(email: string, code: string): Promise<Session> {
  const res = await post('verify', { destination: email, code });
  if (!res.ok) throw new LoginError(res.status);
  return (await res.json()) as Session;
}
