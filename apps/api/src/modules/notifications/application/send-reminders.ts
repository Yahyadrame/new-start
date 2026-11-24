import type { PushSender } from '../../../shared/push/push.js';
import { localDay } from '../../../shared/progress/streak.js';
import type { PushSubscriptionsStore } from './push-subscriptions.js';
import { reminderDue, type ReminderState } from '../../../shared/notifications/reminder.js';

export const REMINDERS_STORE = Symbol('REMINDERS_STORE');

export type ReminderCandidate = ReminderState & { userId: string };

/** Port de stockage des rappels. */
export interface RemindersStore {
  /** Les personnes qui ont choisi une heure de rappel. */
  candidates(): Promise<ReminderCandidate[]>;
  /** Écrit le rappel du jour ; rend false s'il existe déjà (clé unique personne + jour). */
  record(userId: string, day: string, title: string, body: string): Promise<boolean>;
}

export const REMINDER_TITLE = 'Ton rappel du jour';
export const REMINDER_BODY = 'Quelques minutes d’anglais aujourd’hui ? Ta série compte sur toi.';

/** Où envoyer le push : l'adaptateur et la liste des appareils. Sans lui, le rappel reste dans l'écran Notifications. */
export type ReminderPush = { sender: PushSender; subscriptions: PushSubscriptionsStore };

export const REMINDER_URL = '/notifications';

export class SendReminders {
  constructor(
    private readonly store: RemindersStore,
    private readonly push?: ReminderPush,
  ) {}

  /** Écrit les rappels dus à `now` et rend leur nombre. Peut tourner aussi souvent qu'on veut : un seul rappel par jour. */
  async execute(now: Date): Promise<number> {
    let sent = 0;
    for (const c of await this.store.candidates()) {
      if (!reminderDue(c, now)) continue;
      if (
        await this.store.record(c.userId, localDay(now, c.timezone), REMINDER_TITLE, REMINDER_BODY)
      ) {
        sent += 1;
        await this.pushTo(c.userId);
      }
    }
    return sent;
  }

  // ponytail: un push `failed` n'est pas réessayé (le rappel du jour est déjà écrit) ; ajouter une file si ça arrive souvent.
  private async pushTo(userId: string): Promise<void> {
    if (!this.push) return;
    const payload = { title: REMINDER_TITLE, body: REMINDER_BODY, url: REMINDER_URL };
    for (const subscription of await this.push.subscriptions.forUser(userId)) {
      const result = await this.push.sender.send(subscription, payload);
      if (result === 'gone') await this.push.subscriptions.remove(subscription.endpoint);
    }
  }
}
