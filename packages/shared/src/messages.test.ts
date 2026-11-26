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
  it('accepte un message cité, qui doit être un identifiant', () => {
    expect(SendMessage.parse({ clientId, text: 'Hi', replyToId: clientId }).replyToId).toBe(
      clientId,
    );
    expect(SendMessage.safeParse({ clientId, text: 'Hi', replyToId: 'x' }).success).toBe(false);
  });

  it('accepte la marque « transféré », facultative', () => {
    expect(SendMessage.parse({ clientId, text: 'Hi', forwarded: true }).forwarded).toBe(true);
    expect(SendMessage.parse({ clientId, text: 'Hi' }).forwarded).toBeUndefined();
    expect(SendMessage.safeParse({ clientId, text: 'Hi', forwarded: 'oui' }).success).toBe(false);
  });

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
