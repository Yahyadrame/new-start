import { describe, expect, it, vi } from 'vitest';
import { PushSubscriptionsService } from './push-subscriptions.js';

describe('PushSubscriptionsService', () => {
  it('enregistre l’abonnement pour la personne connectée', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const subscription = { endpoint: 'https://push.test/a', keys: { p256dh: 'k', auth: 'a' } };
    await new PushSubscriptionsService({ save }).subscribe('u1', subscription);
    expect(save).toHaveBeenCalledWith('u1', subscription);
  });
});
