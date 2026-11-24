import { z } from 'zod';

/** Abonnement Web Push tel que le navigateur le donne (`PushSubscription.toJSON()`), envoyé à `POST /push/subscriptions`. */
export const PushSubscriptionInput = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionInput>;

/** Corps de `DELETE /push/subscriptions` : l'appareil à désabonner. */
export const PushUnsubscribeInput = PushSubscriptionInput.pick({ endpoint: true });
export type PushUnsubscribeInput = z.infer<typeof PushUnsubscribeInput>;
