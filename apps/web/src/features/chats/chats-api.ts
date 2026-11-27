import type {
  ConversationItem,
  MessageItem,
  MessagesPage,
  SearchHit,
  SendMessage,
} from '@newstart/shared';

export class ChatsError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
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

/** Envoie un message. Renvoyer le même `clientId` ne crée jamais de doublon : l'API rend le message déjà enregistré. */
export async function sendMessage(
  token: string,
  conversationId: string,
  body: SendMessage,
): Promise<MessageItem> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return sentMessage(res);
}

/** Envoie une photo en octets bruts. Renvoyer le même `clientId` ne crée pas un second message. */
export async function sendMedia(
  token: string,
  conversationId: string,
  clientId: string,
  file: Blob,
  /** La durée d'un vocal ; une photo n'en a pas. */
  seconds?: number,
): Promise<MessageItem> {
  const length = seconds ? `&seconds=${seconds}` : '';
  const url = `/api/conversations/${conversationId}/media?clientId=${clientId}${length}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': file.type },
    body: file,
  });
  return sentMessage(res);
}

/** La réponse d'un envoi : le message enregistré, ou l'erreur avec le code de l'API. */
async function sentMessage(res: Response): Promise<MessageItem> {
  if (!res.ok) {
    // Deux 429 existent : la limite du jour (USAGE_LIMIT) et la limite de débit (RATE_LIMITED).
    const err = (await res.json().catch(() => null)) as { code?: string } | null;
    throw new ChatsError(res.status, err?.code);
  }
  return (await res.json()) as MessageItem;
}

/** Marque la conversation lue (remet le badge de la liste à zéro). */
export async function markConversationRead(token: string, conversationId: string): Promise<void> {
  const res = await fetch(`/api/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ChatsError(res.status);
}

/** Garde la correction d'un message dans le carnet. Répéter l'appel rend la même entrée, sans doublon. */
export async function addToNotebook(token: string, messageId: string): Promise<void> {
  const res = await fetch('/api/notebook', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messageId }),
  });
  if (!res.ok) throw new ChatsError(res.status);
}

/** La traduction française d'un message du contact ; l'API la garde, un second appel ne coûte rien. */
export async function translateMessage(token: string, messageId: string): Promise<string> {
  const res = await fetch(`/api/messages/${messageId}/translate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ChatsError(res.status);
  return ((await res.json()) as { translationFr: string }).translationFr;
}

/** Efface le texte d'un message ; la bulle reste, marquée supprimée. */
export async function deleteMessage(token: string, messageId: string): Promise<void> {
  const res = await fetch(`/api/messages/${messageId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ChatsError(res.status);
}

/** Remplace le texte d'un message de la personne ; sa correction est refaite côté API. */
export async function editMessage(
  token: string,
  messageId: string,
  text: string,
): Promise<MessageItem> {
  const res = await fetch(`/api/messages/${messageId}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new ChatsError(res.status);
  return (await res.json()) as MessageItem;
}

/** Pose la réaction de la personne sur un message ; `null` la retire. Rend le message à jour. */
export async function reactToMessage(
  token: string,
  messageId: string,
  emoji: string | null,
): Promise<MessageItem> {
  const res = await fetch(`/api/messages/${messageId}/reaction`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ emoji }),
  });
  if (!res.ok) throw new ChatsError(res.status);
  return (await res.json()) as MessageItem;
}

/** Les messages de la personne qui contiennent `q` (2 caractères au moins), du plus récent au plus ancien. */
export async function searchMessages(token: string, q: string): Promise<SearchHit[]> {
  const res = await fetch(`/api/conversations/search?q=${encodeURIComponent(q)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ChatsError(res.status);
  return ((await res.json()) as { items: SearchHit[] }).items;
}
