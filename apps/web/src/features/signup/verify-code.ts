import type { Session } from '../../shared/auth/session';

export class VerifyCodeError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`otp/verify ${status}`);
  }
}

/** Vérifie le code ; l'API crée le compte, ouvre la session et pose le cookie de rafraîchissement. */
export async function verifyCode(email: string, code: string): Promise<Session> {
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'email', destination: email, code }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { code?: string } | null;
    throw new VerifyCodeError(res.status, body?.code);
  }
  return (await res.json()) as Session;
}
