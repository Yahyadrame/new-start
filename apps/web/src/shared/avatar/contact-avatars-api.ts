import type { AvatarChoice, ContactAvatars } from '@newstart/shared';

export class ContactAvatarsError extends Error {
  constructor(readonly status: number) {
    super(`contact-avatars ${status}`);
  }
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` });

export async function getContactAvatars(token: string): Promise<ContactAvatars> {
  const res = await fetch('/api/me/contact-avatars', { headers: auth(token) });
  if (!res.ok) throw new ContactAvatarsError(res.status);
  return (await res.json()) as ContactAvatars;
}

/** Enregistre la silhouette choisie pour un contact ; `null` revient à l'originale. */
export async function saveContactAvatar(
  token: string,
  slug: string,
  choice: AvatarChoice | null,
): Promise<void> {
  const url = `/api/me/contact-avatars/${encodeURIComponent(slug)}`;
  const res = await fetch(
    url,
    choice
      ? {
          method: 'PUT',
          headers: { ...auth(token), 'content-type': 'application/json' },
          body: JSON.stringify(choice),
        }
      : { method: 'DELETE', headers: auth(token) },
  );
  if (!res.ok) throw new ContactAvatarsError(res.status);
}
