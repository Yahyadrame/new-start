import type { NotificationItem } from '@newstart/shared';

export class NotificationsError extends Error {
  constructor(readonly status: number) {
    super(`notifications ${status}`);
  }
}

/** Les notifications de la personne connectée, les plus récentes d'abord. */
export async function fetchNotifications(token: string): Promise<NotificationItem[]> {
  const res = await fetch('/api/notifications', { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new NotificationsError(res.status);
  return (await res.json()) as NotificationItem[];
}
