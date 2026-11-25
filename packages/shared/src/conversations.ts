import { z } from 'zod';

/** Une ligne de la liste des discussions, telle que `GET /conversations` la renvoie. */
export const ConversationItem = z.object({
  id: z.string(),
  agent: z.object({
    slug: z.string(),
    name: z.string(),
    initials: z.string(),
    roleFr: z.string(),
    category: z.string(),
    /** Accent de la voix du contact (`en-US`, `en-GB`, `en-NG`). */
    accent: z.string(),
  }),
  /** Le dernier message, ou null si la conversation est encore vide. */
  lastMessage: z
    .object({ author: z.enum(['USER', 'AGENT', 'SYSTEM']), text: z.string() })
    .nullable(),
  lastMessageAt: z.string(),
  unreadCount: z.number().int().min(0),
});
export type ConversationItem = z.infer<typeof ConversationItem>;

/** Corps de `POST /conversations` : le contact à qui l'on veut écrire. */
export const StartConversation = z.object({ agentSlug: z.string().min(1).max(40) });
export type StartConversation = z.infer<typeof StartConversation>;
