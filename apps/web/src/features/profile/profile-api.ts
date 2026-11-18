import type { Me, MePatch } from '@newstart/shared';

export class ProfileError extends Error {
  constructor(readonly status: number) {
    super(`me ${status}`);
  }
}

const headers = (token: string) => ({ authorization: `Bearer ${token}` });

async function read(res: Response): Promise<Me> {
  if (!res.ok) throw new ProfileError(res.status);
  return (await res.json()) as Me;
}

export async function getMe(token: string): Promise<Me> {
  return read(await fetch('/api/me', { headers: headers(token) }));
}

export async function patchMe(token: string, patch: MePatch): Promise<Me> {
  return read(
    await fetch('/api/me', {
      method: 'PATCH',
      headers: { ...headers(token), 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  );
}
