import { z } from 'zod';
import { StickerId } from './stickers.js';

/** Un message de l'historique, tel que `GET /conversations/:id/messages` le renvoie. */
export const MessageItem = z.object({
  id: z.string(),
  author: z.enum(['USER', 'AGENT', 'SYSTEM']),
  text: z.string(),
  translationFr: z.string().nullable(),
  createdAt: z.string(),
  /** Message supprimé par la personne : `text` est vide, la bulle devient « Message supprimé ». */
  deleted: z.boolean(),
  /** La personne a modifié son message : la bulle porte la mention « modifié ». */
  edited: z.boolean(),
  /** Le message a été transféré depuis une autre conversation : la bulle porte la mention « transféré ». */
  forwarded: z.boolean(),
  /** L'identifiant du sticker quand le message en est un ; `text` porte alors sa légende en anglais. */
  sticker: z.string().nullable(),
  /** La réaction de la personne à ce message (un des émojis de `REACTIONS`), ou null. */
  reaction: z.string().nullable(),
  /** Le message cité quand celui-ci répond en citant ; `text` est vide si le message cité a été supprimé. */
  replyTo: z
    .object({
      id: z.string(),
      author: z.enum(['USER', 'AGENT', 'SYSTEM']),
      text: z.string(),
      deleted: z.boolean(),
      /** Présent quand le message cité est un vocal ou une photo : `text` peut alors être vide. */
      mediaKind: z.enum(['AUDIO', 'IMAGE']).optional(),
    })
    .nullable(),
  /** La correction « Plus naturel » d'un message de la personne, ou null. */
  correction: z.object({ better: z.string().nullable(), whyFr: z.string().nullable() }).nullable(),
  /**
   * Le vocal ou la photo du message (absent pour un texte) ; `text` porte alors la transcription ou la
   * légende. `url` expire au bout d'une heure, et vaut null si le fichier n'est plus lisible.
   */
  media: z
    .object({
      kind: z.enum(['AUDIO', 'IMAGE']),
      url: z.string().nullable(),
      seconds: z.number().nullable(),
      /** Vrai pour un vocal de plus de 30 jours, effacé par le stockage. */
      expired: z.boolean().optional(),
      /** L'onde d'un vocal, en barres de 0 à 100 ; absente si elle n'a pas été envoyée. */
      peaks: z.array(z.number()).optional(),
    })
    .optional(),
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

/** Durée la plus longue d'un vocal. */
export const VOICE_MAX_SECONDS = 120;

/** Nombre de barres au plus dans l'onde d'un vocal. */
export const VOICE_PEAKS_MAX = 64;

/** Une barre de l'onde, de 0 à 100, telle qu'elle est écrite dans l'adresse. */
const Peak = z
  .string()
  .regex(/^\d{1,3}$/)
  .transform(Number)
  .pipe(z.number().max(100));

/** Paramètres de `POST /conversations/:id/media` ; `seconds` : la durée d'un vocal, `peaks` : son onde. */
export const MediaQuery = z.object({
  clientId: z.string().uuid(),
  seconds: z.coerce.number().int().min(1).max(VOICE_MAX_SECONDS).optional(),
  peaks: z
    .string()
    .transform((peaks) => peaks.split(','))
    .pipe(z.array(Peak).max(VOICE_PEAKS_MAX))
    .optional(),
});
export type MediaQuery = z.infer<typeof MediaQuery>;

/** Réponse de `GET /conversations/voice-availability` : le micro, et pourquoi il est indisponible. */
export const VoiceAvailability = z.discriminatedUnion('available', [
  z.object({ available: z.literal(true) }),
  z.object({ available: z.literal(false), reason: z.enum(['disabled', 'unconfigured', 'quota']) }),
]);
export type VoiceAvailability = z.infer<typeof VoiceAvailability>;

/** Corps de `POST /conversations/:id/messages` : `clientId` rend le renvoi sans risque de doublon. */
export const SendMessage = z
  .object({
    clientId: z.uuid(),
    text: z.string().trim().max(2000),
    /** Le message auquel on répond, dans la même conversation. */
    replyToId: z.uuid().optional(),
    /** Le texte vient d'un message transféré depuis une autre conversation. */
    forwarded: z.boolean().optional(),
    /** Envoie ce sticker : l'API remplace `text` par sa légende. */
    sticker: StickerId.optional(),
    /**
     * Transfère le vocal ou la photo de ce message : le fichier et son texte viennent de lui, les autres
     * champs sont ignorés.
     */
    mediaFromId: z.uuid().optional(),
  })
  .refine((message) => message.mediaFromId !== undefined || message.text.length > 0, {
    path: ['text'],
    message: 'Le message est vide.',
  });
export type SendMessage = z.infer<typeof SendMessage>;

/** Corps de `PATCH /messages/:id` : le nouveau texte d'un message de la personne. */
export const EditMessage = z.object({ text: z.string().trim().min(1).max(2000) });
export type EditMessage = z.infer<typeof EditMessage>;

/** Les réactions rapides proposées sur un message. */
export const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

/** Corps de `PUT /messages/:id/reaction` : l'émoji choisi, ou null pour retirer la réaction. */
export const SetReaction = z.object({ emoji: z.enum(REACTIONS).nullable() });
export type SetReaction = z.infer<typeof SetReaction>;

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
