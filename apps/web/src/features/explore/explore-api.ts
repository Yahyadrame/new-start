import type { AgentCard, ConversationItem, TopicItem } from '@newstart/shared';

export class ExploreError extends Error {
  constructor(readonly status: number) {
    super(`explore ${status}`);
  }
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` });

async function read<T>(res: Response): Promise<T> {
  if (!res.ok) throw new ExploreError(res.status);
  return (await res.json()) as T;
}

export async function listTopics(token: string): Promise<TopicItem[]> {
  return read(await fetch('/api/topics', { headers: auth(token) }));
}

export async function listAgents(
  token: string,
  filter: { topic?: string | undefined; q?: string | undefined },
): Promise<AgentCard[]> {
  const params = new URLSearchParams();
  if (filter.topic) params.set('topic', filter.topic);
  if (filter.q) params.set('q', filter.q);
  return read(await fetch(`/api/agents?${params}`, { headers: auth(token) }));
}

export async function startConversation(
  token: string,
  agentSlug: string,
): Promise<ConversationItem> {
  return read(
    await fetch('/api/conversations', {
      method: 'POST',
      headers: { ...auth(token), 'content-type': 'application/json' },
      body: JSON.stringify({ agentSlug }),
    }),
  );
}
