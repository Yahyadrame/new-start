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

export type SentMessage = { row: MessageRow; created: boolean };

export interface MediaMessagesStore {
  /** Vrai si la personne a accepté les enregistrements vocaux. */
  hasVoiceConsent(userId: string): Promise<boolean>;
  /** Le nombre de vocaux (ou de photos) que la personne a envoyés aujourd'hui, à son heure. */
  sentToday(userId: string, kind: NewMediaMessage['kind']): Promise<number>;
  /**
   * À appeler avant de transcrire et de ranger le fichier. Null si la conversation n'est pas à la
   * personne ; le message existant si ce `clientId` est déjà envoyé ; `limited` quand la limite du
   * jour des vocaux (ou des photos) est atteinte ; sinon `ready`. Les fichiers ne comptent pas dans la
   * limite des messages écrits.
   */
  check(
    userId: string,
    conversationId: string,
    clientId: string,
    kind: NewMediaMessage['kind'],
    dailyLimit: number,
  ): Promise<SentMessage | { limited: true } | { ready: true } | null>;
  /**
   * Ajoute le message. À appeler seulement après un `check` qui a rendu `ready` : la propriété de la
   * conversation n'est pas revérifiée ici. `created: false` quand un envoi simultané du même `clientId`
   * a gagné.
   */
  create(userId: string, conversationId: string, media: NewMediaMessage): Promise<SentMessage>;
}
