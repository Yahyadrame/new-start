import { HttpException } from '@nestjs/common';
import type { ConversationItem } from '@newstart/shared';
import { isAdult } from '../../../shared/age.js';

export const CONVERSATIONS_STORE = Symbol('CONVERSATIONS_STORE');

export interface ConversationsStore {
  /** Les conversations du compte, la plus récente d'abord. */
  list(userId: string): Promise<ConversationItem[]>;
  birthYear(userId: string): Promise<number | null | undefined>;
  /** Le contact actif de ce slug : `adultOnly` si son thème est réservé aux majeurs, null s'il n'existe pas ou est éteint. */
  agentRule(slug: string): Promise<{ adultOnly: boolean } | null>;
  /** Crée la conversation avec le premier message du contact, ou rend celle qui existe déjà. */
  open(userId: string, slug: string): Promise<ConversationItem>;
}

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
}
