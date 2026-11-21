import type { NotificationItem } from '@newstart/shared';

export const NOTIFICATIONS_STORE = Symbol('NOTIFICATIONS_STORE');

/** Combien de notifications l'écran affiche au plus (Aujourd'hui et Cette semaine tiennent largement dedans). */
export const NOTIFICATIONS_LIMIT = 30;

export interface NotificationsStore {
  /** Les plus récentes d'abord. */
  recent(userId: string, limit: number): Promise<NotificationItem[]>;
  /** Combien de notifications la personne n'a pas encore lues. */
  unreadCount(userId: string): Promise<number>;
  /** Marque comme lues toutes les notifications non lues de la personne. */
  markAllRead(userId: string, now: Date): Promise<void>;
}

export class NotificationsService {
  constructor(private readonly store: NotificationsStore) {}

  list(userId: string): Promise<NotificationItem[]> {
    return this.store.recent(userId, NOTIFICATIONS_LIMIT);
  }

  unreadCount(userId: string): Promise<number> {
    return this.store.unreadCount(userId);
  }

  markAllRead(userId: string, now = new Date()): Promise<void> {
    return this.store.markAllRead(userId, now);
  }
}
