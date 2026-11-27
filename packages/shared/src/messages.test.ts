import { describe, expect, it } from 'vitest';
import {
  MediaQuery,
  MESSAGES_PAGE_SIZE,
  MessagesQuery,
  REACTIONS,
  SendMessage,
  SetReaction,
  VoiceAvailability,
} from './messages.js';

describe('MediaQuery', () => {
  const clientId = '0198f0a0-0000-4000-8000-000000000002';

  it('lit la durée d’un vocal en nombre ; une photo n’en a pas', () => {
    expect(MediaQuery.parse({ clientId, seconds: '4' })).toEqual({ clientId, seconds: 4 });
    expect(MediaQuery.parse({ clientId })).toEqual({ clientId });
  });

  it.each([
    {},
    { clientId: 'zzz' },
    { clientId: [clientId, clientId] },
    { clientId, seconds: '0' },
    { clientId, seconds: '121' },
    { clientId, seconds: '2.5' },
    { clientId, seconds: 'abc' },
  ])('refuse %o', (query) => {
    expect(MediaQuery.safeParse(query).success).toBe(false);
  });
});

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

describe('SendMessage, sticker', () => {
  it('accepte un sticker du catalogue, pas un autre identifiant', () => {
    const clientId = crypto.randomUUID();
    expect(SendMessage.parse({ clientId, text: 'Thanks!', sticker: 'thanks' }).sticker).toBe(
      'thanks',
    );
    expect(SendMessage.safeParse({ clientId, text: 'x', sticker: 'inconnu' }).success).toBe(false);
  });
});

describe('SetReaction', () => {
  it('accepte un des six émojis ou null, rien d’autre', () => {
    expect(REACTIONS).toHaveLength(6);
    expect(SetReaction.parse({ emoji: '❤️' }).emoji).toBe('❤️');
    expect(SetReaction.parse({ emoji: null }).emoji).toBeNull();
    expect(SetReaction.safeParse({ emoji: '🦄' }).success).toBe(false);
    expect(SetReaction.safeParse({}).success).toBe(false);
  });
});

describe('VoiceAvailability', () => {
  it('accepte le vocal disponible, ou une des trois raisons du refus', () => {
    expect(VoiceAvailability.parse({ available: true })).toEqual({ available: true });
    for (const reason of ['disabled', 'unconfigured', 'quota']) {
      expect(VoiceAvailability.safeParse({ available: false, reason }).success).toBe(true);
    }
    expect(VoiceAvailability.safeParse({ available: false }).success).toBe(false);
    expect(VoiceAvailability.safeParse({ available: false, reason: 'autre' }).success).toBe(false);
  });
});

describe('SendMessage, transfert d’un vocal ou d’une photo', () => {
  const clientId = '0198f0a0-0000-4000-8000-000000000001';
  const mediaFromId = '0198f0a0-0000-7000-8000-000000000003';

  it('accepte un texte vide quand le message reprend un fichier', () => {
    expect(SendMessage.parse({ clientId, text: '', mediaFromId }).mediaFromId).toBe(mediaFromId);
  });

  it('refuse un identifiant de message mal formé', () => {
    expect(SendMessage.safeParse({ clientId, text: '', mediaFromId: 'x' }).success).toBe(false);
  });
});
