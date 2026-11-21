import type { NotificationItem } from '@newstart/shared';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sépare « Aujourd'hui » (même jour sur l'appareil) de « Cette semaine » (les 7 derniers jours).
 * Plus ancien que cela : non affiché, un vieux rappel n'apprend rien.
 */
export function groupNotifications(items: NotificationItem[], now: Date) {
  const today: NotificationItem[] = [];
  const week: NotificationItem[] = [];
  for (const item of items) {
    const at = new Date(item.createdAt);
    if (at.toDateString() === now.toDateString()) today.push(item);
    else if (now.getTime() - at.getTime() < WEEK_MS) week.push(item);
  }
  return { today, week };
}
