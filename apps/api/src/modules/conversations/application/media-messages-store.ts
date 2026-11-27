import type { MessageRow } from './conversations.js';

export interface NewMediaMessage {
  clientId: string;
  kind: 'AUDIO' | 'IMAGE';
  /** La transcription d'un vocal ; vide pour une photo. */
  text: string;
  mediaKey: string;
  mediaProvider: string;
  mediaSeconds: number | null;
}

/** Limites par personne et par jour : tous les messages, et les fichiers du genre envoyé. */
export interface DailyLimits {
  messages: number;
  media: number;
}

export type SentMessage = { row: MessageRow; created: boolean };

export interface MediaMessagesStore {
  /**
   * À appeler avant de transcrire et de ranger le fichier. Null si la conversation n'est pas à la
   * personne ; le message existant si ce `clientId` est déjà envoyé ; `limited` quand la limite des
   * messages ou celle des vocaux (ou des photos) est atteinte ; sinon `ready`.
   */
  check(
    userId: string,
    conversationId: string,
    clientId: string,
    kind: NewMediaMessage['kind'],
    limits: DailyLimits,
  ): Promise<SentMessage | { limited: 'messages' | 'media' } | { ready: true } | null>;
  /**
   * Ajoute le message. À appeler seulement après un `check` qui a rendu `ready` : la propriété de la
   * conversation n'est pas revérifiée ici. `created: false` quand un envoi simultané du même `clientId`
   * a gagné.
   */
  create(userId: string, conversationId: string, media: NewMediaMessage): Promise<SentMessage>;
}
