import { HttpException } from '@nestjs/common';
import type { NotebookEntryItem } from '@newstart/shared';

export const NOTEBOOK_STORE = Symbol('NOTEBOOK_STORE');

export type NotebookRow = Omit<NotebookEntryItem, 'createdAt'> & { createdAt: Date };

export interface NotebookStore {
  /** Les entrées du compte, la plus récente d'abord. */
  list(userId: string): Promise<NotebookRow[]>;
  /**
   * Garde la correction de ce message. Rend l'entrée déjà gardée si elle existe.
   * Null si le message n'est pas à cette personne ou n'a pas de version « Plus naturel ».
   */
  add(userId: string, messageId: string): Promise<NotebookRow | null>;
}

const toItem = ({ createdAt, ...row }: NotebookRow): NotebookEntryItem => ({
  ...row,
  createdAt: createdAt.toISOString(),
});

export class NotebookService {
  constructor(private readonly store: NotebookStore) {}

  async list(userId: string) {
    return (await this.store.list(userId)).map(toItem);
  }

  async add(userId: string, messageId: string) {
    const row = await this.store.add(userId, messageId);
    if (!row) {
      throw new HttpException({ code: 'NOT_FOUND', message: 'Correction introuvable.' }, 404);
    }
    return toItem(row);
  }
}
