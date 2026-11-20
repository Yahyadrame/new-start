import { describe, expect, it } from 'vitest';
import { ConversationItem, StartConversation } from './conversations.js';

const item = {
  id: 'c1',
  agent: {
    slug: 'jade',
    name: 'Jade',
    initials: 'J',
    roleFr: 'Coloc · familier',
    category: 'Quotidien',
  },
  lastMessage: { author: 'AGENT', text: 'Heyyy!' },
  lastMessageAt: '2026-11-18T10:00:00.000Z',
  unreadCount: 1,
};

describe('ConversationItem', () => {
  it('accepte une ligne avec ou sans dernier message', () => {
    expect(ConversationItem.safeParse(item).success).toBe(true);
    expect(ConversationItem.safeParse({ ...item, lastMessage: null }).success).toBe(true);
  });

  it('refuse un compteur négatif ou un auteur inconnu', () => {
    expect(ConversationItem.safeParse({ ...item, unreadCount: -1 }).success).toBe(false);
    expect(
      ConversationItem.safeParse({ ...item, lastMessage: { author: 'BOT', text: 'x' } }).success,
    ).toBe(false);
  });
});

describe('StartConversation', () => {
  it('veut un slug de contact non vide', () => {
    expect(StartConversation.safeParse({ agentSlug: 'jade' }).success).toBe(true);
    expect(StartConversation.safeParse({ agentSlug: '' }).success).toBe(false);
    expect(StartConversation.safeParse({}).success).toBe(false);
  });
});
