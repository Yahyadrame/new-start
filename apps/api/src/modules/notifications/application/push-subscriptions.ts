import type { PushSubscriptionInput } from '@newstart/shared';

export const PUSH_SUBSCRIPTIONS_STORE = Symbol('PUSH_SUBSCRIPTIONS_STORE');

export interface PushSubscriptionsStore {
  /** Crée l'abonnement, ou le met à jour s'il existe déjà : l'endpoint est unique, et un appareil passe à la personne connectée. */
  save(userId: string, subscription: PushSubscriptionInput): Promise<void>;
  /** Les appareils abonnés de la personne. */
  forUser(userId: string): Promise<PushSubscriptionInput[]>;
  /** Supprime l'abonnement d'un appareil (expiré côté navigateur). */
  remove(endpoint: string): Promise<void>;
  /** Supprime l'abonnement de la personne pour cet appareil ; ne touche jamais à celui d'une autre. */
  removeOwn(userId: string, endpoint: string): Promise<void>;
}

export class PushSubscriptionsService {
  constructor(private readonly store: PushSubscriptionsStore) {}

  subscribe(userId: string, subscription: PushSubscriptionInput): Promise<void> {
    return this.store.save(userId, subscription);
  }

  unsubscribe(userId: string, endpoint: string): Promise<void> {
    return this.store.removeOwn(userId, endpoint);
  }
}
