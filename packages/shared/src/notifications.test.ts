import { describe, expect, it } from 'vitest';
import { NotificationItem } from './notifications.js';

const item = {
  id: 'n1',
  kind: 'reminder',
  title: 'Ton rappel du jour',
  body: 'Quelques minutes d’anglais ?',
  createdAt: '2026-11-21T19:00:00.000Z',
  read: false,
};

describe('NotificationItem', () => {
  it('accepte une notification complète', () => {
    expect(NotificationItem.parse(item)).toEqual(item);
  });

  it('refuse une notification sans état de lecture', () => {
    expect(NotificationItem.safeParse({ ...item, read: undefined }).success).toBe(false);
  });
});
