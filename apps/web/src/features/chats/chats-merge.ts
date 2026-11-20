import type { MessageItem } from '@newstart/shared';

/** Toutes les 2 s, pendant 60 s au plus : le temps de la réponse, avant le temps réel (NS-202). */
export const POLL_MS = 2000;
export const POLL_LIMIT = 30;

/** Ajoute les messages relus à ceux de l'écran et met à jour les autres (une correction arrive après coup). */
export function mergeLatest(shown: MessageItem[], fetched: MessageItem[]): MessageItem[] {
  const byId = new Map(shown.map((m) => [m.id, m]));
  for (const m of fetched) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

/** Le contact (ou le système, en cas d'échec) a écrit après ce message de la personne. */
export const hasReplyAfter = (items: MessageItem[], since: string) =>
  items.some((m) => m.author !== 'USER' && m.createdAt > since);

/** Un message de la personne tout récent sans réponse : l'agent est sans doute encore en train d'écrire. */
export const isFresh = (createdAt: string, now: number = Date.now()) =>
  now - Date.parse(createdAt) < POLL_MS * POLL_LIMIT;
