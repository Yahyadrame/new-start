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

/** Ce que le contact (ou le système, en cas d'échec) a écrit depuis cette date. */
export const repliesAfter = (items: MessageItem[], since: string) =>
  items.filter((m) => m.author !== 'USER' && m.createdAt > since).length;

/**
 * Un message parti depuis `since` attend encore le contact : sa correction arrive avec la réponse,
 * et un message d'échec tient lieu de réponse pour l'un d'eux.
 */
export function isAwaiting(items: MessageItem[], since: string) {
  const open = items.filter(
    (m) => m.author === 'USER' && !m.deleted && !m.correction && m.createdAt >= since,
  );
  return open.length > items.filter((m) => m.author === 'SYSTEM' && m.createdAt > since).length;
}

/** Un message de la personne tout récent sans réponse : l'agent est sans doute encore en train d'écrire. */
export const isFresh = (createdAt: string, now: number = Date.now()) =>
  now - Date.parse(createdAt) < POLL_MS * POLL_LIMIT;

/** La liste des discussions se relit à ce rythme tant que l'appli est à l'écran (avant le temps réel, NS-202). */
export const LIST_POLL_MS = 5000;
/** Événement de fenêtre : une conversation vient d'être marquée lue, la liste doit se relire. */
export const CHATS_CHANGED = 'ns-chats-changed';
