import type { ConversationItem } from '@newstart/shared';

export const CONVERSATIONS_STORE = Symbol('CONVERSATIONS_STORE');

export interface ConversationsStore {
  /** Les conversations du compte, la plus récente d'abord. */
  list(userId: string): Promise<ConversationItem[]>;
}

export class ConversationsService {
  constructor(private readonly store: ConversationsStore) {}

  list(userId: string) {
    return this.store.list(userId);
  }
}
