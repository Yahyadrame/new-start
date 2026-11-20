import { describe, expect, it } from 'vitest';
import { MESSAGES_PAGE_SIZE, MessagesQuery, SendMessage } from './messages.js';

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

describe('SendMessage', () => {
  const clientId = '0198f0a0-0000-4000-8000-000000000001';

  it('retire les espaces autour du texte', () => {
    expect(SendMessage.parse({ clientId, text: '  Hello  ' }).text).toBe('Hello');
  });

  it('refuse un texte vide, trop long, ou un clientId qui n’est pas un UUID', () => {
    expect(SendMessage.safeParse({ clientId, text: '   ' }).success).toBe(false);
    expect(SendMessage.safeParse({ clientId, text: 'x'.repeat(2001) }).success).toBe(false);
    expect(SendMessage.safeParse({ clientId: 'abc', text: 'Hi' }).success).toBe(false);
    expect(SendMessage.safeParse({ text: 'Hi' }).success).toBe(false);
  });
});
