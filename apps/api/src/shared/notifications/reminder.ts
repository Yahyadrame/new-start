import { localDay } from '../progress/streak.js';

export interface ReminderState {
  /** Heure choisie, « HH:MM » ; null = pas de rappel. */
  reminderTime: string | null;
  timezone: string;
  /** Dernier jour d'activité, AAAA-MM-JJ. */
  lastActiveDay: string | null;
  /** Jour du dernier rappel envoyé, AAAA-MM-JJ (lu dans `NotificationLog`). */
  lastReminderDay: string | null;
  pausedUntil: Date | null;
}

/** L'heure « HH:MM » de `now` dans le fuseau de la personne. */
const localTime = (now: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);

/**
 * Faut-il envoyer le rappel maintenant ? Un seul par jour au maximum, à l'heure choisie ou après,
 * seulement si la personne n'a pas encore pratiqué aujourd'hui et n'est pas en pause.
 */
export function reminderDue(state: ReminderState, now: Date): boolean {
  if (!state.reminderTime) return false;
  if (state.pausedUntil !== null && state.pausedUntil > now) return false;
  const today = localDay(now, state.timezone);
  if (state.lastActiveDay === today || state.lastReminderDay === today) return false;
  return localTime(now, state.timezone) >= state.reminderTime;
}
