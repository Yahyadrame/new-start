import { describe, expect, it } from 'vitest';
import { PushSubscriptionInput, PushUnsubscribeInput } from './push.js';

const valid = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys: { p256dh: 'BPk', auth: 'xyz' },
};

describe('PushSubscriptionInput', () => {
  it('accepte un abonnement complet', () => {
    expect(PushSubscriptionInput.parse(valid)).toEqual(valid);
  });

  it('refuse un endpoint qui n’est pas en https', () => {
    expect(PushSubscriptionInput.safeParse({ ...valid, endpoint: 'http://x.test/a' }).success).toBe(
      false,
    );
  });

  it('refuse un endpoint qui n’est pas une URL', () => {
    expect(PushSubscriptionInput.safeParse({ ...valid, endpoint: 'pas une url' }).success).toBe(
      false,
    );
  });

  it('refuse des clés absentes ou vides', () => {
    expect(PushSubscriptionInput.safeParse({ endpoint: valid.endpoint }).success).toBe(false);
    expect(
      PushSubscriptionInput.safeParse({ ...valid, keys: { p256dh: '', auth: 'a' } }).success,
    ).toBe(false);
  });
});

describe('PushUnsubscribeInput', () => {
  it('ne garde que l’endpoint, qui doit être en https', () => {
    expect(PushUnsubscribeInput.parse(valid)).toEqual({ endpoint: valid.endpoint });
    expect(PushUnsubscribeInput.safeParse({ endpoint: 'http://x.test/a' }).success).toBe(false);
    expect(PushUnsubscribeInput.safeParse({}).success).toBe(false);
  });
});
