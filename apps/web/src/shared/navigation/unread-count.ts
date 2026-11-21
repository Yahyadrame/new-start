/** Le nombre de notifications non lues de la personne connectée (point de la cloche). */
export async function fetchUnreadCount(token: string): Promise<number> {
  const res = await fetch('/api/notifications/unread-count', {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`unread-count ${res.status}`);
  return ((await res.json()) as { count: number }).count;
}
