import type { ConversationItem } from '@newstart/shared';

/** Les trois filtres toujours visibles dans la rangée. */
export const MAIN_FILTERS = ['all', 'unread', 'Quotidien'] as const;
/** Les autres catégories, rangées dans le menu « Plus ». */
export const MORE_FILTERS = ['Pro', 'Business', 'Voyage'] as const;
export const FILTERS = [...MAIN_FILTERS, ...MORE_FILTERS] as const;
export type Filter = (typeof FILTERS)[number];

export function applyFilter(items: ConversationItem[], filter: Filter): ConversationItem[] {
  if (filter === 'all') return items;
  if (filter === 'unread') return items.filter((i) => i.unreadCount > 0);
  return items.filter((i) => i.agent.category === filter);
}

/** Garde les discussions dont le prénom ou le dernier message contient la recherche (sans tenir compte des accents ni de la casse). */
export function matchesQuery(items: ConversationItem[], query: string): ConversationItem[] {
  const fold = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const q = fold(query.trim());
  if (!q) return items;
  return items.filter((i) => fold(`${i.agent.name} ${i.lastMessage?.text ?? ''}`).includes(q));
}

/** L'heure pour aujourd'hui, sinon le jour et le mois ("17 nov."). */
export function formatWhen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** L'heure d'un message ("09:14"), sans le jour : le séparateur de la conversation le donne. */
export function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Le jour d'un message pour le séparateur : "Aujourd'hui", "Hier", sinon "17 nov." (avec l'année si ce n'est pas la même). */
export function dayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86_400_000,
  );
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}

/** Coupe `text` en morceaux, ceux qui contiennent `query` (sans tenir compte de la casse) marqués `match`. */
export function splitMatch(text: string, query: string): { text: string; match: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, match: false }];
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'));
  return parts
    .filter(Boolean)
    .map((part) => ({ text: part, match: part.toLowerCase() === q.toLowerCase() }));
}
