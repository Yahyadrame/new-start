import type { ConversationItem } from '@newstart/shared';

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
