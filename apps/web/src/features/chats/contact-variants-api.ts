import type { ContactVariant, ContactVariants } from '@newstart/shared';

export class ContactVariantsError extends Error {
  constructor(readonly status: number) {
    super(`contact-variants ${status}`);
  }
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` });

export async function getContactVariants(token: string): Promise<ContactVariants> {
  const res = await fetch('/api/me/contact-variants', { headers: auth(token) });
  if (!res.ok) throw new ContactVariantsError(res.status);
  return (await res.json()) as ContactVariants;
}

/** Enregistre le ton et la difficulté d'un contact ; `null` revient aux réglages d'origine. */
export async function saveContactVariant(
  token: string,
  slug: string,
  variant: ContactVariant | null,
): Promise<void> {
  const url = `/api/me/contact-variants/${encodeURIComponent(slug)}`;
  const res = await fetch(
    url,
    variant
      ? {
          method: 'PUT',
          headers: { ...auth(token), 'content-type': 'application/json' },
          body: JSON.stringify(variant),
        }
      : { method: 'DELETE', headers: auth(token) },
  );
  if (!res.ok) throw new ContactVariantsError(res.status);
}
