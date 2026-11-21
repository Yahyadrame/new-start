import * as webpush from 'web-push';
import { describe, expect, it, vi } from 'vitest';
import {
  createPushSender,
  FakePushSender,
  WebPushSender,
  type PushSubscriptionData,
} from './push.js';

const sub: PushSubscriptionData = {
  endpoint: 'https://push.example.test/abc',
  keys: { p256dh: 'p', auth: 'a' },
};
const payload = { title: 'T', body: 'B', url: '/chats' };
const vapid = { publicKey: 'pub', privateKey: 'priv', subject: 'mailto:contact@example.test' };

describe('WebPushSender', () => {
  it('envoie le message en JSON avec les clés VAPID et rend « sent »', async () => {
    const sendNotification = vi.fn().mockResolvedValue({ statusCode: 201 });
    const result = await new WebPushSender(vapid, { sendNotification }).send(sub, payload);
    expect(result).toBe('sent');
    expect(sendNotification).toHaveBeenCalledWith(sub, JSON.stringify(payload), {
      TTL: 86400,
      vapidDetails: vapid,
    });
  });

  it.each([404, 410])(
    'rend « gone » quand le service répond %i (abonnement expiré)',
    async (statusCode) => {
      const sendNotification = vi
        .fn()
        .mockRejectedValue(Object.assign(new Error('x'), { statusCode }));
      expect(await new WebPushSender(vapid, { sendNotification }).send(sub, payload)).toBe('gone');
    },
  );

  it('rend « failed » pour une autre erreur, sans la propager', async () => {
    const sendNotification = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('x'), { statusCode: 500 }));
    expect(await new WebPushSender(vapid, { sendNotification }).send(sub, payload)).toBe('failed');
    const reseau = vi.fn().mockRejectedValue(new Error('réseau'));
    expect(await new WebPushSender(vapid, { sendNotification: reseau }).send(sub, payload)).toBe(
      'failed',
    );
  });

  it('utilise la vraie bibliothèque web-push par défaut', () => {
    expect(typeof webpush.sendNotification).toBe('function');
    expect(() => new WebPushSender(vapid)).not.toThrow();
  });
});

describe('FakePushSender', () => {
  it('garde les envois en mémoire', async () => {
    const fake = new FakePushSender();
    expect(await fake.send(sub, payload)).toBe('sent');
    expect(fake.outbox).toEqual([{ subscription: sub, payload }]);
  });

  it('simule un abonnement expiré', async () => {
    const fake = new FakePushSender();
    expect(await fake.send({ ...sub, endpoint: 'https://push.example.test/gone' }, payload)).toBe(
      'gone',
    );
    expect(fake.outbox).toHaveLength(0);
  });
});

describe('createPushSender', () => {
  it('rend WebPushSender quand les trois variables VAPID sont posées', () => {
    expect(
      createPushSender({
        VAPID_PUBLIC_KEY: 'pub',
        VAPID_PRIVATE_KEY: 'priv',
        VAPID_SUBJECT: 'mailto:contact@example.test',
      }),
    ).toBeInstanceOf(WebPushSender);
  });

  it('rend FakePushSender si une variable manque', () => {
    expect(createPushSender({})).toBeInstanceOf(FakePushSender);
    expect(createPushSender({ VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv' })).toBeInstanceOf(
      FakePushSender,
    );
  });
});
