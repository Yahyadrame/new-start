import { HttpException } from '@nestjs/common';
import { isTransient, withRetry, type LlmProvider } from '@newstart/ai';

export const TRANSLATION_STORE = Symbol('TRANSLATION_STORE');

export interface TranslationStore {
  /** Le message d'un contact IA, dans une conversation de cette personne ; null sinon. */
  find(
    userId: string,
    messageId: string,
  ): Promise<{ text: string; translationFr: string | null } | null>;
  save(messageId: string, translationFr: string): Promise<void>;
}

const SYSTEM =
  "Traduis en français le message de l'utilisateur, qui est écrit en anglais. " +
  'Réponds par la traduction seule, sans guillemets ni commentaire. ' +
  'Garde le ton, les mots familiers et les noms propres.';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TranslationService {
  constructor(
    private readonly store: TranslationStore,
    private readonly llm: LlmProvider,
    private readonly sleep?: (ms: number) => Promise<void>,
  ) {}

  /** Traduit un message d'agent ; la première traduction est gardée, les suivantes ne rappellent pas l'IA. */
  async translate(userId: string, messageId: string): Promise<{ translationFr: string }> {
    const message = UUID.test(messageId) ? await this.store.find(userId, messageId) : null;
    if (!message) {
      throw new HttpException({ code: 'NOT_FOUND', message: "Ce message n'existe pas." }, 404);
    }
    if (message.translationFr) return { translationFr: message.translationFr };
    let translationFr: string;
    try {
      const answer = await withRetry(
        () =>
          this.llm.complete({
            system: SYSTEM,
            messages: [{ role: 'user', content: message.text }],
          }),
        {
          retries: 1,
          delayMs: 500,
          retryOn: isTransient,
          ...(this.sleep && { sleep: this.sleep }),
        },
      );
      translationFr = answer.text.trim();
    } catch {
      translationFr = '';
    }
    if (!translationFr) {
      throw new HttpException(
        {
          code: 'AI_UNAVAILABLE',
          message: 'La traduction ne marche pas pour le moment. Réessaie dans un instant.',
        },
        503,
      );
    }
    await this.store.save(messageId, translationFr);
    return { translationFr };
  }
}
