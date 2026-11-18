import { HttpException } from '@nestjs/common';
import type { LlmProvider } from '@newstart/ai';
import { LEVEL_TEST_LENGTH, type LevelAnswerBody, type LevelResult } from '@newstart/shared';
import { evaluateLevel } from './evaluate-level.js';

export const LEVEL_STORE = Symbol('LEVEL_STORE');

export interface LevelStore {
  /** Enregistre la réponse ; refaire le test réécrit la même ligne. */
  saveAnswer(userId: string, position: number, text: string): Promise<void>;
  listAnswers(userId: string): Promise<{ position: number; text: string }[]>;
  saveLevel(userId: string, level: LevelResult['level']): Promise<void>;
  /** Crée la conversation avec Jade et son premier message ; sans effet si elle existe déjà. */
  openFirstChat(userId: string): Promise<void>;
}

/** Après une réponse : la question suivante, ou le résultat après la dernière. */
export type LevelStep = { done: false; next: number } | ({ done: true } & LevelResult);

export class LevelTest {
  constructor(
    private readonly store: LevelStore,
    private readonly llm: LlmProvider,
  ) {}

  async answer(userId: string, { position, text }: LevelAnswerBody): Promise<LevelStep> {
    await this.store.saveAnswer(userId, position, text);
    if (position < LEVEL_TEST_LENGTH) return { done: false, next: position + 1 };

    const saved = new Map((await this.store.listAnswers(userId)).map((a) => [a.position, a.text]));
    const answers = Array.from({ length: LEVEL_TEST_LENGTH }, (_, i) => saved.get(i + 1));
    if (answers.some((a) => a === undefined))
      throw new HttpException(
        { code: 'LEVEL_TEST_INCOMPLETE', message: "Réponds d'abord aux questions précédentes." },
        409,
      );
    const result = await evaluateLevel(this.llm, answers as string[]);
    await this.store.saveLevel(userId, result.level);
    await this.store.openFirstChat(userId);
    return { done: true, ...result };
  }
}
