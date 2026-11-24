import type { ConversationItem } from '@newstart/shared';

export const FILTERS = ['all', 'unread', 'Quotidien', 'Pro', 'Business', 'Voyage'] as const;
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
