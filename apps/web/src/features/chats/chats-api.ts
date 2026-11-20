import type { ConversationItem, MessagesPage } from '@newstart/shared';

export class ChatsError extends Error {
  constructor(readonly status: number) {
    super(`conversations ${status}`);
  }
}

export async function listConversations(token: string): Promise<ConversationItem[]> {
  const res = await fetch('/api/conversations', { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new ChatsError(res.status);
  return (await res.json()) as ConversationItem[];
}

/** Une page de l'historique, du plus récent au plus ancien ; `cursor` mène aux messages plus anciens. */
export async function listMessages(
  token: string,
  conversationId: string,
  cursor?: string | undefined,
): Promise<MessagesPage> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const res = await fetch(`/api/conversations/${conversationId}/messages${query}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ChatsError(res.status);
  return (await res.json()) as MessagesPage;
}
