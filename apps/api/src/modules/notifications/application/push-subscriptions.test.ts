import { describe, expect, it, vi } from 'vitest';
import { PushSubscriptionsService } from './push-subscriptions.js';

describe('PushSubscriptionsService', () => {
  it('enregistre l’abonnement pour la personne connectée', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const subscription = { endpoint: 'https://push.test/a', keys: { p256dh: 'k', auth: 'a' } };
    await new PushSubscriptionsService({
      save,
      forUser: vi.fn(),
      remove: vi.fn(),
      removeOwn: vi.fn(),
    }).subscribe('u1', subscription);
    expect(save).toHaveBeenCalledWith('u1', subscription);
  });

  it('désabonne l’appareil de la personne connectée', async () => {
    const removeOwn = vi.fn().mockResolvedValue(undefined);
    await new PushSubscriptionsService({
      save: vi.fn(),
      forUser: vi.fn(),
      remove: vi.fn(),
      removeOwn,
    }).unsubscribe('u1', 'https://push.test/a');
    expect(removeOwn).toHaveBeenCalledWith('u1', 'https://push.test/a');
  });
});
