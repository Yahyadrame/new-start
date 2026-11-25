import { HttpException } from '@nestjs/common';
import {
  MESSAGES_PAGE_SIZE,
  type ConversationItem,
  type MessageItem,
  type MessagesPage,
  type SearchHit,
  type SendMessage,
  SEARCH_LIMIT,
} from '@newstart/shared';
import { isAdult } from '../../../shared/age.js';
import { escapeLike, makeExcerpt } from './excerpt.js';
import type { ReplyScheduler } from './agent-reply.js';
import { decodeCursor, encodeCursor, type MessageCursor } from './message-cursor.js';

export const CONVERSATIONS_STORE = Symbol('CONVERSATIONS_STORE');

/** Un message tel que le stockage le rend : la date n'est pas encore mise en texte. */
export type MessageRow = Omit<MessageItem, 'createdAt' | 'deleted' | 'edited' | 'replyTo'> & {
  createdAt: Date;
  deletedAt: Date | null;
  editedAt: Date | null;
  replyTo:
    (Omit<NonNullable<MessageItem['replyTo']>, 'deleted'> & { deletedAt: Date | null }) | null;
};

/** Un message trouvé tel que le stockage le rend : le texte entier, la date pas encore en texte. */
export type SearchRow = Omit<SearchHit, 'excerpt' | 'createdAt'> & {
  text: string;
  createdAt: Date;
};

export interface ConversationsStore {
  /**
   * Les messages de la personne (jamais ceux du système) dont le texte contient `like` sans tenir
   * compte de la casse, du plus récent au plus ancien, au plus `limit`. `like` est déjà protégé.
   */
  search(userId: string, like: string, limit: number): Promise<SearchRow[]>;
  /** Les conversations du compte, la plus récente d'abord. */
  list(userId: string): Promise<ConversationItem[]>;
  birthYear(userId: string): Promise<number | null | undefined>;
  /** Le contact actif de ce slug : `adultOnly` si son thème est réservé aux majeurs, null s'il n'existe pas ou est éteint. */
  agentRule(slug: string): Promise<{ adultOnly: boolean } | null>;
  /** Crée la conversation avec le premier message du contact, ou rend celle qui existe déjà. */
  open(userId: string, slug: string): Promise<ConversationItem>;
  /**
   * Au plus `limit` messages de la conversation, du plus récent au plus ancien, avant le curseur.
   * Renvoie null si la conversation n'existe pas ou n'est pas à cette personne.
   */
  messages(
    userId: string,
    conversationId: string,
    before: MessageCursor | null,
    limit: number,
  ): Promise<MessageRow[] | null>;
  /** Remet `unreadCount` à 0 et date la lecture des messages du contact. Faux si la conversation n'est pas à elle. */
  markRead(userId: string, conversationId: string): Promise<boolean>;
  /**
   * Ajoute le message de la personne. Si ce `clientId` est déjà enregistré dans la conversation,
   * rend le message existant (`created: false`) sans rien ajouter. Null si la conversation n'est pas à elle.
   * Un nouveau message au-delà de `dailyLimit` messages aujourd'hui n'est pas créé : `{ limited: true }`.
   */
  deleteMessage(userId: string, messageId: string): Promise<boolean>;
  /**
   * Remplace le texte d'un message de la personne (pas supprimé), date la modification et efface sa
   * correction pour qu'elle soit refaite. Null s'il n'existe pas ou n'est pas à elle ; `changed: false` si le texte est le même.
   */
  editMessage(
    userId: string,
    messageId: string,
    text: string,
  ): Promise<{ row: MessageRow; conversationId: string; changed: boolean } | null>;

  send(
    userId: string,
    conversationId: string,
    message: SendMessage,
    dailyLimit: number,
  ): Promise<{ row: MessageRow; created: boolean } | { limited: true } | null>;
}

const toItem = ({ deletedAt, editedAt, replyTo, ...row }: MessageRow): MessageItem => ({
  ...row,
  edited: editedAt !== null,
  replyTo: replyTo && {
    id: replyTo.id,
    author: replyTo.author,
    text: replyTo.text,
    deleted: replyTo.deletedAt !== null,
  },
  createdAt: row.createdAt.toISOString(),
  deleted: deletedAt !== null,
});

const notFound = () =>
  new HttpException({ code: 'NOT_FOUND', message: "Cette conversation n'existe pas." }, 404);

const limitReached = () =>
  new HttpException(
    {
      code: 'USAGE_LIMIT',
      message: "Tu as bien pratiqué aujourd'hui. Reviens demain, Jade t'attend.",
    },
    429,
  );

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ConversationsService {
  constructor(
    private readonly store: ConversationsStore,
    private readonly currentYear: () => number = () => new Date().getFullYear(),
    private readonly replies?: ReplyScheduler,
    private readonly messagesPerDay = 60,
  ) {}

  list(userId: string) {
    return this.store.list(userId);
  }

  async start(userId: string, slug: string) {
    const rule = await this.store.agentRule(slug);
    if (!rule) {
      throw new HttpException({ code: 'NOT_FOUND', message: "Ce contact n'existe pas." }, 404);
    }
    if (rule.adultOnly && !isAdult(await this.store.birthYear(userId), this.currentYear())) {
      throw new HttpException(
        { code: 'TOPIC_ADULT_ONLY', message: 'Ce contact est réservé aux personnes majeures.' },
        403,
      );
    }
    return this.store.open(userId, slug);
  }

  async search(userId: string, query: string) {
    const rows = await this.store.search(userId, escapeLike(query), SEARCH_LIMIT);
    return {
      items: rows.map(({ text, createdAt, ...row }) => ({
        ...row,
        excerpt: makeExcerpt(text, query),
        createdAt: createdAt.toISOString(),
      })),
    };
  }

  /** Efface le texte d'un message de la personne (le sien ou celui d'un contact) ; la bulle reste, vide. */
  async remove(userId: string, messageId: string): Promise<void> {
    const done = UUID.test(messageId) && (await this.store.deleteMessage(userId, messageId));
    if (!done) {
      throw new HttpException({ code: 'NOT_FOUND', message: "Ce message n'existe pas." }, 404);
    }
  }

  /** Modifie le texte d'un message de la personne ; sa correction est refaite, sans nouvelle réponse du contact. */
  async edit(userId: string, messageId: string, text: string) {
    const done = UUID.test(messageId)
      ? await this.store.editMessage(userId, messageId, text)
      : null;
    if (!done) {
      throw new HttpException({ code: 'NOT_FOUND', message: "Ce message n'existe pas." }, 404);
    }
    if (done.changed)
      this.replies?.schedule(done.conversationId, done.row.id, { correctionOnly: true });
    return toItem(done.row);
  }

  async messages(userId: string, conversationId: string, cursor?: string): Promise<MessagesPage> {
    const before = cursor === undefined ? null : decodeCursor(cursor);
    if (cursor !== undefined && !before) {
      throw new HttpException({ code: 'VALIDATION_FAILED', message: 'Curseur invalide.' }, 400);
    }
    const rows = UUID.test(conversationId)
      ? await this.store.messages(userId, conversationId, before, MESSAGES_PAGE_SIZE + 1)
      : null;
    if (!rows) {
      throw new HttpException(
        { code: 'NOT_FOUND', message: "Cette conversation n'existe pas." },
        404,
      );
    }
    const page = rows.slice(0, MESSAGES_PAGE_SIZE);
    const last = page.at(-1);
    return {
      items: page.map(toItem),
      nextCursor:
        rows.length > MESSAGES_PAGE_SIZE && last
          ? encodeCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }

  async markRead(userId: string, conversationId: string) {
    const done = UUID.test(conversationId) && (await this.store.markRead(userId, conversationId));
    if (!done) throw notFound();
  }

  async send(userId: string, conversationId: string, message: SendMessage) {
    const sent = UUID.test(conversationId)
      ? await this.store.send(userId, conversationId, message, this.messagesPerDay)
      : null;
    if (!sent) throw notFound();
    if ('limited' in sent) throw limitReached();
    // Un renvoi (`created: false`) ne relance pas l'agent : il a déjà répondu ou répond encore.
    if (sent.created) this.replies?.schedule(conversationId, sent.row.id);
    return { message: toItem(sent.row), created: sent.created };
  }
}
