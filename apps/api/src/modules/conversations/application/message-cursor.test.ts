import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor } from './message-cursor.js';

describe('curseur de messages', () => {
  it('retrouve la date et l’identifiant encodés', () => {
    const cursor = { createdAt: new Date('2026-11-20T10:00:00.000Z'), id: 'm1' };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('refuse un texte qui n’est pas un curseur', () => {
    const b64 = (s: string) => Buffer.from(s).toString('base64url');
    for (const raw of [
      'n’importe quoi',
      b64('pas-une-date|m1'),
      b64('2026-11-20T10:00:00.000Z'),
      b64('2026-11-20T10:00:00.000Z|m1|x'),
      '',
    ]) {
      expect(decodeCursor(raw)).toBeNull();
    }
  });
});
