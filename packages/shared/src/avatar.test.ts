import { describe, expect, it } from 'vitest';
import { ContactAvatars } from './avatar.js';

describe('ContactAvatars', () => {
  it('accepte un choix par contact', () => {
    const value = {
      jade: { id: 'a001' },
      sam: { id: 'a360', palette: 'Lilas', variant: 'anneau' },
    };
    expect(ContactAvatars.parse(value)).toEqual(value);
  });

  it('refuse une silhouette hors bibliothèque', () => {
    expect(ContactAvatars.safeParse({ jade: { id: 'a361' } }).success).toBe(false);
  });
});
