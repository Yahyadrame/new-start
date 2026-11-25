import { z } from 'zod';

/** Un message de l'historique, tel que `GET /conversations/:id/messages` le renvoie. */
export const MessageItem = z.object({
  id: z.string(),
  author: z.enum(['USER', 'AGENT', 'SYSTEM']),
  text: z.string(),
  translationFr: z.string().nullable(),
  createdAt: z.string(),
  /** La correction « Plus naturel » d'un message de la personne, ou null. */
  correction: z.object({ better: z.string().nullable(), whyFr: z.string().nullable() }).nullable(),
});
export type MessageItem = z.infer<typeof MessageItem>;

/** Une page de l'historique : du plus récent au plus ancien, `nextCursor` mène aux messages plus anciens. */
export const MessagesPage = z.object({
  items: z.array(MessageItem),
  nextCursor: z.string().nullable(),
});
export type MessagesPage = z.infer<typeof MessagesPage>;

export const MESSAGES_PAGE_SIZE = 30;

/** Paramètres de `GET /conversations/:id/messages`. */
export const MessagesQuery = z.object({ cursor: z.string().min(1).max(100).optional() });
export type MessagesQuery = z.infer<typeof MessagesQuery>;

/** Corps de `POST /conversations/:id/messages` : `clientId` rend le renvoi sans risque de doublon. */
export const SendMessage = z.object({
  clientId: z.uuid(),
  text: z.string().trim().min(1).max(2000),
});
export type SendMessage = z.infer<typeof SendMessage>;

/** Paramètres de `GET /conversations/search` : le texte cherché, sans espaces autour. */
export const SearchQuery = z.object({ q: z.string().trim().min(2).max(100) });
export type SearchQuery = z.infer<typeof SearchQuery>;

/** Un message trouvé : `excerpt` est un extrait autour du premier mot trouvé, `…` aux bouts coupés. */
export const SearchHit = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  author: z.enum(['USER', 'AGENT']),
  excerpt: z.string(),
  createdAt: z.string(),
  agent: z.object({ slug: z.string(), name: z.string(), initials: z.string() }),
});
export type SearchHit = z.infer<typeof SearchHit>;

export const SearchResults = z.object({ items: z.array(SearchHit) });
export type SearchResults = z.infer<typeof SearchResults>;

export const SEARCH_LIMIT = 30;
