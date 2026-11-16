import type { SignupFormValues } from './signup-schema';

export class RequestCodeError extends Error {
  constructor(readonly status: number) {
    super(`otp/request ${status}`);
  }
}

/** Envoie le profil et demande le code par e-mail (le compte naît à la vérification, NS-102). */
export async function requestCode({ email, ...signup }: SignupFormValues): Promise<void> {
  const res = await fetch('/api/auth/otp/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'email', destination: email, signup }),
  });
  if (!res.ok) throw new RequestCodeError(res.status);
}
