import { HttpException } from '@nestjs/common';
import type { SttProvider } from '@newstart/ai';

export const VOICE_STORE = Symbol('VOICE_STORE');

export interface VoiceStore {
  hasConsent(userId: string): Promise<boolean>;
  setConsent(userId: string, accepted: boolean): Promise<void>;
}

const fail = (status: number, code: string, message: string) =>
  new HttpException({ code, message }, status);

/** Une réponse du test tient dans 1 Mo (environ 60 s), moins que la limite des vocaux envoyés. */
const MAX_ANSWER_BYTES = 1024 * 1024;

/** Consentement aux enregistrements vocaux, et transcription d'une réponse du test. L'audio n'est jamais gardé. */
export class Voice {
  constructor(
    private readonly store: VoiceStore,
    private readonly stt: SttProvider,
  ) {}

  async consent(userId: string) {
    return { accepted: await this.store.hasConsent(userId) };
  }

  setConsent(userId: string, accepted: boolean) {
    return this.store.setConsent(userId, accepted);
  }

  async transcribe(userId: string, audio: Uint8Array, mimeType: string) {
    if (!(await this.store.hasConsent(userId)))
      throw fail(403, 'VOICE_CONSENT_REQUIRED', "Accepte d'abord les enregistrements vocaux.");
    if (audio.byteLength === 0) throw fail(400, 'VALIDATION_FAILED', "Aucun son n'a été reçu.");
    if (audio.byteLength > MAX_ANSWER_BYTES)
      throw fail(413, 'VALIDATION_FAILED', 'Cet enregistrement est trop long.');
    // L'adaptateur factice renverrait un faux texte : mieux vaut proposer d'écrire.
    if (this.stt.name === 'fake') throw this.unavailable();
    try {
      const { text, fake } = await this.stt.transcribe({ audio, mimeType });
      // Repli factice en cours de route : plafond du mois atteint ou quota du fournisseur épuisé.
      if (fake) throw this.unavailable();
      return { text: text.trim() };
    } catch {
      throw this.unavailable();
    }
  }

  private unavailable() {
    return fail(
      503,
      'AI_UNAVAILABLE',
      "Je n'arrive pas à t'écouter pour l'instant. Écris ta réponse.",
    );
  }
}
