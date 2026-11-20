import { HttpException } from '@nestjs/common';
import {
  MESSAGES_PAGE_SIZE,
  type ConversationItem,
  type MessageItem,
  type MessagesPage,
} from '@newstart/shared';
import { isAdult } from '../../../shared/age.js';
import { decodeCursor, encodeCursor, type MessageCursor } from './message-cursor.js';

export const CONVERSATIONS_STORE = Symbol('CONVERSATIONS_STORE');

/** Un message tel que le stockage le rend : la date n'est pas encore mise en texte. */
export type MessageRow = Omit<MessageItem, 'createdAt'> & { createdAt: Date };

export interface ConversationsStore {
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
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ConversationsService {
  constructor(
    private readonly store: ConversationsStore,
    private readonly currentYear: () => number = () => new Date().getFullYear(),
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
      items: page.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      nextCursor:
        rows.length > MESSAGES_PAGE_SIZE && last
          ? encodeCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }
}
