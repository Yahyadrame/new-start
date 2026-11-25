import type { ChatBackground } from '@newstart/shared';

/** Lit le fond de conversation choisi dans le Profil (lecture seule, utilisée par le chat). */
export async function getChatBackground(token: string): Promise<ChatBackground> {
  const res = await fetch('/api/me', { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`me ${res.status}`);
  return ((await res.json()) as { chatBackground: ChatBackground }).chatBackground;
}
