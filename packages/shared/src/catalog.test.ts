import { describe, expect, it } from 'vitest';
import { AgentsQuery, TopicItem } from './catalog.js';

describe('AgentsQuery', () => {
  it('accepte aucun filtre, un thème ou une recherche', () => {
    expect(AgentsQuery.safeParse({}).success).toBe(true);
    expect(AgentsQuery.parse({ topic: 'sport', q: ' Marc ' })).toEqual({
      topic: 'sport',
      q: 'Marc',
    });
  });

  it('refuse une recherche vide ou trop longue', () => {
    expect(AgentsQuery.safeParse({ q: '   ' }).success).toBe(false);
    expect(AgentsQuery.safeParse({ q: 'x'.repeat(51) }).success).toBe(false);
    expect(AgentsQuery.safeParse({ topic: '' }).success).toBe(false);
  });
});

describe('TopicItem', () => {
  it('refuse un nombre de contacts négatif', () => {
    expect(TopicItem.safeParse({ slug: 'love', nameFr: 'Amour', agentCount: -1 }).success).toBe(
      false,
    );
  });
});
