import { HttpException } from '@nestjs/common';
import { gradeCard, type CardState, type Grade } from '../domain/scheduler.js';

export const REVIEWS_STORE = Symbol('REVIEWS_STORE');

export interface DueCard {
  id: string;
  expressionId: number;
  text: string;
  meaningFr: string;
  due: Date;
}

export interface ReviewsStore {
  /** Les cartes échues, la plus ancienne d'abord. */
  due(userId: string, now: Date, limit: number): Promise<DueCard[]>;
  /** L'état d'une carte de cette personne ; null si elle n'existe pas ou n'est pas à elle. */
  find(userId: string, cardId: string): Promise<CardState | null>;
  save(cardId: string, state: CardState): Promise<void>;
}

export const DUE_LIMIT = 20;

export class ReviewsService {
  constructor(private readonly store: ReviewsStore) {}

  async listDue(userId: string, now = new Date()) {
    const cards = await this.store.due(userId, now, DUE_LIMIT);
    return cards.map(({ due, ...card }) => ({ ...card, due: due.toISOString() }));
  }

  /** Enregistre la réponse et rend la prochaine échéance. */
  async grade(userId: string, cardId: string, grade: Grade, now = new Date()) {
    const state = await this.store.find(userId, cardId);
    if (!state) {
      throw new HttpException({ code: 'NOT_FOUND', message: 'Carte introuvable.' }, 404);
    }
    const next = gradeCard(state, grade, now);
    await this.store.save(cardId, next);
    return { due: next.due.toISOString() };
  }
}
