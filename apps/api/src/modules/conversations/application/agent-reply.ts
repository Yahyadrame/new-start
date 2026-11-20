import { Logger } from '@nestjs/common';
import {
  AGENT_PROMPT_VERSION,
  askAgent,
  buildAgentSystem,
  DISTRESS_REPLY_FR,
  detectDistress,
  withRetry,
  type AgentReply,
  type LlmProvider,
} from '@newstart/ai';

export const AGENT_REPLY_STORE = Symbol('AGENT_REPLY_STORE');

/** Nombre de messages relus pour répondre (docs/09-ia-agents.md). */
export const HISTORY_SIZE = 16;

export const FAILURE_TEXT = "Le message n'est pas passé. Renvoie-le.";

export interface ReplyContext {
  agent: { name: string; persona: string; style: string; accent: string };
  learner: { firstName: string; level: string; goal: string };
  /** Du plus ancien au plus récent, le message de la personne en dernier. */
  history: { author: 'USER' | 'AGENT'; text: string }[];
}

export interface AgentReplyStore {
  /** Null si le message n'existe plus ou a déjà reçu sa réponse (la correction en est la trace). */
  context(conversationId: string, messageId: string): Promise<ReplyContext | null>;
  /** Enregistre la correction du message, puis la réponse de l'agent, ensemble ; sans effet si déjà fait. */
  saveReply(conversationId: string, messageId: string, reply: AgentReply): Promise<void>;
  /** Ajoute le message système d'échec. */
  saveFailure(conversationId: string): Promise<void>;
}

/** Ce que `ConversationsService` appelle après un envoi ; rend la main tout de suite. */
export interface ReplyScheduler {
  schedule(conversationId: string, messageId: string): void;
}

const log = new Logger('AgentReply');

export class AgentReplyService implements ReplyScheduler {
  constructor(
    private readonly store: AgentReplyStore,
    private readonly llm: LlmProvider,
    private readonly sleep?: (ms: number) => Promise<void>,
  ) {}

  schedule(conversationId: string, messageId: string) {
    this.reply(conversationId, messageId).catch((error: unknown) =>
      log.error(`La réponse de l'agent a échoué : ${error instanceof Error ? error.message : ''}`),
    );
  }

  async reply(conversationId: string, messageId: string) {
    const context = await this.store.context(conversationId, messageId);
    if (!context) return;
    const last = context.history.at(-1);
    if (last?.author === 'USER' && detectDistress(last.text)) {
      // Cas de détresse : l'agent sort du jeu, sans appel à l'IA ni correction (docs/09-ia-agents.md).
      await this.store.saveReply(conversationId, messageId, {
        reply: DISTRESS_REPLY_FR,
        fix: null,
      });
      log.log('Message de détresse : réponse de soutien enregistrée');
      return;
    }
    const system = buildAgentSystem(context);
    const messages = context.history.map(({ author, text }) => ({
      role: author === 'USER' ? ('user' as const) : ('assistant' as const),
      content: text,
    }));
    let answer: AgentReply;
    try {
      const { reply, fix } = await withRetry(() => askAgent(this.llm, { system, messages }), {
        retries: 2,
        delayMs: 1000,
        ...(this.sleep && { sleep: this.sleep }),
      });
      answer = { reply, fix };
    } catch (error) {
      log.warn(`Pas de réponse de l'IA (${AGENT_PROMPT_VERSION}) : ${String(error)}`);
      await this.store.saveFailure(conversationId);
      return;
    }
    await this.store.saveReply(conversationId, messageId, answer);
    log.log(`Réponse enregistrée (${AGENT_PROMPT_VERSION}, ${answer.fix ? 'corrigé' : 'parfait'})`);
  }
}
