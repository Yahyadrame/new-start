import { describe, expect, it } from 'vitest';
import { MESSAGES_PAGE_SIZE, MessagesQuery } from './messages.js';

describe('MessagesQuery', () => {
  it('accepte l’absence de curseur, refuse un curseur vide ou trop long', () => {
    expect(MessagesQuery.safeParse({}).success).toBe(true);
    expect(MessagesQuery.safeParse({ cursor: 'abc' }).success).toBe(true);
    expect(MessagesQuery.safeParse({ cursor: '' }).success).toBe(false);
    expect(MessagesQuery.safeParse({ cursor: 'x'.repeat(101) }).success).toBe(false);
  });

  it('fixe la page à 30 messages', () => {
    expect(MESSAGES_PAGE_SIZE).toBe(30);
  });
});
