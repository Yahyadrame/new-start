import { setTimeout as delay } from 'node:timers/promises';
import { Logger } from '@nestjs/common';
import {
  AGENT_PROMPT_VERSION,
  askAgent,
  BlockedReplyError,
  buildAgentSystem,
  checkAgentReply,
  DISTRESS_REPLY_FR,
  detectDistress,
  isTransient,
  withRetry,
  type AgentReply,
  type LlmProvider,
} from '@newstart/ai';
import { STICKER_IDS } from '@newstart/shared';

export const AGENT_REPLY_STORE = Symbol('AGENT_REPLY_STORE');

/** Nombre de messages relus pour répondre (docs/09-ia-agents.md). */
export const HISTORY_SIZE = 16;

/** Les contacts ne jouent ni le partenaire ni le manque (docs/09-ia-agents.md). */
const AGENT_STICKERS: readonly string[] = STICKER_IDS.filter(
  (id) => id !== 'kiss' && id !== 'miss-you',
);

/** Temps de réponse d'une personne : selon la longueur, entre 4 s et 15 s, temps de l'IA compris. */
const humanDelayMs = (reply: string) => Math.min(15_000, Math.max(4000, 3000 + 50 * reply.length));

export const FAILURE_TEXT = "Le message n'est pas passé. Renvoie-le.";

export interface ReplyContext {
  agent: { name: string; persona: string; style: string; accent: string };
  learner: { firstName: string; level: string; goal: string; interests?: string[] };
  /** Du plus ancien au plus récent, le message de la personne en dernier. */
  history: { author: 'USER' | 'AGENT'; text: string }[];
  /** La personne vient d'envoyer un sticker : le contact peut en renvoyer un. */
  stickerReceived?: boolean;
  /** Le message à traiter est une photo : il n'a rien à corriger. */
  photoReceived?: boolean;
}

export interface AgentReplyStore {
  /** Null si le message n'existe plus ou a déjà reçu sa réponse (la correction en est la trace). */
  context(
    conversationId: string,
    messageId: string,
    options?: ContextOptions,
  ): Promise<ReplyContext | null>;
  /** Enregistre la correction du message, puis la réponse de l'agent, ensemble ; sans effet si déjà fait. */
  saveReply(
    conversationId: string,
    messageId: string,
    reply: AgentReply,
    options?: ReplyOptions,
  ): Promise<void>;
  /** Ajoute le message système d'échec. */
  saveFailure(conversationId: string): Promise<void>;
  /** Efface la correction d'un message, pour qu'elle soit refaite. */
  clearCorrection(messageId: string): Promise<void>;
}

/** `withLaterReplies` : relire aussi les réponses du contact arrivées après ce message. */
export interface ContextOptions {
  withLaterReplies?: boolean;
}

/** `correctionOnly` : un message modifié reçoit une nouvelle correction, mais pas de nouvelle réponse. */
export interface ReplyOptions {
  correctionOnly?: boolean;
}

/** Ce que `ConversationsService` appelle après un envoi ; rend la main tout de suite. */
export interface ReplyScheduler {
  schedule(conversationId: string, messageId: string, options?: ReplyOptions): void;
}

const log = new Logger('AgentReply');

const isDistress = ({ history }: ReplyContext) => {
  const last = history.at(-1);
  return last?.author === 'USER' && detectDistress(last.text);
};

export class AgentReplyService implements ReplyScheduler {
  // ponytail: files en mémoire, valables pour une seule instance de l'API ; file de jobs au-delà.
  private readonly queues = new Map<string, Promise<unknown>>();
  /** Réponses de soutien envoyées par conversation, tant que sa file n'est pas vide. */
  private readonly alerts = new Map<string, number>();

  constructor(
    private readonly store: AgentReplyStore,
    private readonly llm: LlmProvider,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => delay(ms),
  ) {}

  /** Une conversation répond à ses messages un par un, dans l'ordre. */
  schedule(conversationId: string, messageId: string, options: ReplyOptions = {}) {
    const previous = this.queues.get(conversationId);
    const run = this.reply(conversationId, messageId, options, previous).catch((error: unknown) =>
      log.error(`La réponse de l'agent a échoué : ${error instanceof Error ? error.message : ''}`),
    );
    const tail: Promise<unknown> = Promise.all([previous, run]).then(() => {
      if (this.queues.get(conversationId) !== tail) return;
      this.queues.delete(conversationId);
      this.alerts.delete(conversationId);
    });
    this.queues.set(conversationId, tail);
  }

  /** `previous` : les réponses encore en préparation dans cette conversation. */
  async reply(
    conversationId: string,
    messageId: string,
    options: ReplyOptions = {},
    previous?: Promise<unknown>,
  ) {
    const alerts = this.alerts.get(conversationId) ?? 0;
    if (previous) {
      // La détresse n'attend pas son tour.
      if (!options.correctionOnly) {
        const now = await this.store.context(conversationId, messageId);
        if (now && isDistress(now)) return this.support(conversationId, messageId);
      }
      await previous;
      // La réponse d'avant a pu corriger l'ancien texte du message modifié.
      if (options.correctionOnly) await this.store.clearCorrection(messageId);
    }
    const started = Date.now();
    const context = await this.store.context(
      conversationId,
      messageId,
      ...(previous && !options.correctionOnly ? [{ withLaterReplies: true }] : []),
    );
    if (!context) return;
    if (isDistress(context)) {
      if (!options.correctionOnly) await this.support(conversationId, messageId);
      return;
    }
    // Après une réponse de soutien, les réponses légères encore en attente ne partent plus.
    const quiet = () => options.correctionOnly || (this.alerts.get(conversationId) ?? 0) !== alerts;
    const stickers = context.stickerReceived && !options.correctionOnly ? AGENT_STICKERS : [];
    const system = buildAgentSystem({ ...context, stickers: [...stickers] });
    const messages = context.history.map(({ author, text }) => ({
      role: author === 'USER' ? ('user' as const) : ('assistant' as const),
      content: text,
    }));
    let answer: AgentReply;
    try {
      answer = await withRetry(
        async () => {
          const { reply, fix, sticker } = await askAgent(this.llm, { system, messages });
          // Garde de sortie : une réponse refusée est redemandée, sans jamais être enregistrée.
          const blocked = checkAgentReply(reply);
          if (blocked) throw new BlockedReplyError(blocked);
          // Seul un identifiant proposé est gardé : jamais une invention du modèle.
          return {
            reply,
            fix: context.photoReceived ? null : fix,
            ...(sticker && stickers.includes(sticker) && { sticker }),
          };
        },
        {
          retries: 2,
          delayMs: 1000,
          retryOn: (error) => isTransient(error) || error instanceof BlockedReplyError,
          sleep: this.sleep,
        },
      );
    } catch (error) {
      log.warn(`Pas de réponse de l'IA (${AGENT_PROMPT_VERSION}) : ${String(error)}`);
      // Une correction manquée après une modification n'a rien à signaler : le message n'a simplement pas de correction.
      if (!quiet()) await this.store.saveFailure(conversationId);
      return;
    }
    const wait = humanDelayMs(answer.reply) - (Date.now() - started);
    if (!quiet() && wait > 0) await this.sleep(wait);
    await this.store.saveReply(
      conversationId,
      messageId,
      answer,
      quiet() ? { correctionOnly: true } : options,
    );
    log.log(`Réponse enregistrée (${AGENT_PROMPT_VERSION}, ${answer.fix ? 'corrigé' : 'parfait'})`);
  }

  /** Cas de détresse : l'agent sort du jeu, sans appel à l'IA ni correction (docs/09-ia-agents.md). */
  private async support(conversationId: string, messageId: string) {
    this.alerts.set(conversationId, (this.alerts.get(conversationId) ?? 0) + 1);
    await this.store.saveReply(conversationId, messageId, { reply: DISTRESS_REPLY_FR, fix: null });
    log.log('Message de détresse : réponse de soutien enregistrée');
  }
}
