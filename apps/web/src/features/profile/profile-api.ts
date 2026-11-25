import type { Me, MePatch, NotebookEntryItem } from '@newstart/shared';

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

/** Le fichier d'export tel que l'API le renvoie (JSON), prêt à être enregistré. */
export async function exportMe(token: string): Promise<Blob> {
  const res = await fetch('/api/me/export', { headers: headers(token) });
  if (!res.ok) throw new ProfileError(res.status);
  return res.blob();
}

/** Supprime le compte, puis efface le cookie de session (best effort : le jeton n'existe déjà plus). */
export async function deleteMe(token: string): Promise<void> {
  const res = await fetch('/api/me', { method: 'DELETE', headers: headers(token) });
  if (!res.ok) throw new ProfileError(res.status);
  await logout();
}

/** Ferme la session : l'API efface le cookie de rafraîchissement (best effort, la session locale part de toute façon). */
export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
}

/** Le carnet de la personne, l'entrée la plus récente d'abord. */
export async function listNotebook(token: string): Promise<NotebookEntryItem[]> {
  const res = await fetch('/api/notebook', { headers: headers(token) });
  if (!res.ok) throw new ProfileError(res.status);
  return (await res.json()) as NotebookEntryItem[];
}
