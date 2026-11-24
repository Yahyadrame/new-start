import type { ConversationItem } from '@newstart/shared';
import { describe, expect, it } from 'vitest';
import {
  applyFilter,
  dayLabel,
  FILTERS,
  formatHour,
  formatWhen,
  MAIN_FILTERS,
  matchesQuery,
  MORE_FILTERS,
} from './chats-format';

const item = (id: string, category: string, unreadCount: number) =>
  ({ id, unreadCount, agent: { category } }) as ConversationItem;
const items = [item('a', 'Quotidien', 1), item('b', 'Pro', 0), item('c', 'Quotidien', 0)];

describe('applyFilter', () => {
  it('garde tout, les non lus, ou une catégorie', () => {
    expect(applyFilter(items, 'all')).toHaveLength(3);
    expect(applyFilter(items, 'unread').map((i) => i.id)).toEqual(['a']);
    expect(applyFilter(items, 'Quotidien').map((i) => i.id)).toEqual(['a', 'c']);
    expect(applyFilter(items, 'Voyage')).toEqual([]);
  });
});

describe('FILTERS', () => {
  it('montre trois filtres et range les autres catégories dans le menu', () => {
    expect(MAIN_FILTERS).toEqual(['all', 'unread', 'Quotidien']);
    expect(MORE_FILTERS).toEqual(['Pro', 'Business', 'Voyage']);
    expect(FILTERS).toHaveLength(6);
  });
});

describe('formatWhen', () => {
  const now = new Date(2026, 10, 18, 15, 0);
  it("affiche l'heure pour aujourd'hui", () => {
    expect(formatWhen(new Date(2026, 10, 18, 9, 5).toISOString(), now)).toBe('09:05');
  });
  it('affiche le jour et le mois pour une autre date', () => {
    expect(formatWhen(new Date(2026, 10, 17, 9, 5).toISOString(), now)).toMatch(/17\s+nov/);
  });
});

describe('matchesQuery', () => {
  const chats = [
    { id: 'a', agent: { name: 'Élodie' }, lastMessage: { text: 'See you' } },
    { id: 'b', agent: { name: 'Sam' }, lastMessage: null },
  ] as ConversationItem[];

  it('garde tout quand la recherche est vide', () => {
    expect(matchesQuery(chats, '   ')).toHaveLength(2);
  });

  it('cherche dans le prénom et le dernier message, sans accents ni casse', () => {
    expect(matchesQuery(chats, 'elodie').map((i) => i.id)).toEqual(['a']);
    expect(matchesQuery(chats, 'YOU').map((i) => i.id)).toEqual(['a']);
    expect(matchesQuery(chats, 'sam').map((i) => i.id)).toEqual(['b']);
    expect(matchesQuery(chats, 'zzz')).toEqual([]);
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 10, 24, 15, 0);
  it("dit Aujourd'hui, Hier, puis la date", () => {
    expect(dayLabel(new Date(2026, 10, 24, 8, 0).toISOString(), now)).toBe("Aujourd'hui");
    expect(dayLabel(new Date(2026, 10, 23, 23, 0).toISOString(), now)).toBe('Hier');
    expect(dayLabel(new Date(2026, 10, 17, 9, 0).toISOString(), now)).toContain('17');
  });
  it("ajoute l'année quand ce n'est pas la même", () => {
    expect(dayLabel(new Date(2025, 10, 17, 9, 0).toISOString(), now)).toContain('2025');
  });
});

describe('formatHour', () => {
  it("donne l'heure sur deux chiffres", () => {
    expect(formatHour(new Date(2026, 10, 24, 9, 5).toISOString())).toBe('09:05');
  });
});
