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
