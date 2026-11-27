import { randomUUID } from 'node:crypto';
import { HttpException } from '@nestjs/common';
import type { SttProvider } from '@newstart/ai';
import { VOICE_MAX_SECONDS, type VoiceAvailability } from '@newstart/shared';
import type { MediaStores } from '../../../shared/media/media-store.js';
import { sniffMedia } from '../../../shared/media/sniff.js';
import { notFound, presentMessage, UUID } from './conversations.js';
import type { MediaMessagesStore, SentMessage } from './media-messages-store.js';

export interface MediaLimits {
  voiceEnabled: boolean;
  voicePerDay: number;
  photosPerDay: number;
}

export interface MediaUpload {
  clientId: string;
  data: Uint8Array;
  /** Durée d'un vocal, annoncée par le client. */
  seconds?: number | undefined;
}

type CheckedUpload = {
  clientId: string;
  data: Uint8Array;
  file: NonNullable<ReturnType<typeof sniffMedia>>;
  mediaSeconds: number | null;
};

const fail = (status: number, code: string, message: string) =>
  new HttpException({ code, message }, status);
const invalid = (message: string) => fail(400, 'VALIDATION_FAILED', message);
const voiceUnavailable = (message = 'Les vocaux sont indisponibles pour le moment.') =>
  fail(503, 'VOICE_UNAVAILABLE', `${message} Écris ton message.`);

// ponytail: la durée annoncée n'est pas mesurée ; la taille (4 Mo) et la limite du jour bornent le coût
function voiceLength(seconds: number | undefined): number {
  if (!seconds || !Number.isInteger(seconds) || seconds < 1 || seconds > VOICE_MAX_SECONDS) {
    throw invalid(`Un vocal dure de 1 à ${VOICE_MAX_SECONDS} secondes.`);
  }
  return seconds;
}

/** Envoi d'une photo ou d'un vocal : contrôle, transcription, rangement du fichier puis message. */
export class MediaSend {
  // ponytail: file en mémoire, donc une par instance de l'API ; avec plusieurs instances, réserver le compteur en base
  private readonly queue = new Map<string, Promise<unknown>>();

  constructor(
    private readonly store: MediaMessagesStore,
    private readonly stt: SttProvider,
    private readonly media: MediaStores,
    private readonly limits: MediaLimits,
  ) {}

  async send(userId: string, conversationId: string, { clientId, data, seconds }: MediaUpload) {
    if (!UUID.test(conversationId)) throw notFound();
    if (!UUID.test(clientId)) throw invalid('Identifiant de message invalide.');
    const file = sniffMedia(data);
    if (!file) throw invalid('Envoie une photo (JPEG, PNG ou WebP) ou un vocal.');
    const mediaSeconds = file.kind === 'AUDIO' ? voiceLength(seconds) : null;
    // Un envoi à la fois par personne et par type : la limite est lue avant la transcription et
    // comptée après, des envois simultanés passeraient donc tous.
    return this.inTurn(`${userId}:${file.kind}`, () =>
      this.deliver(userId, conversationId, { clientId, data, file, mediaSeconds }),
    );
  }

  /** L'état du micro avant d'enregistrer. Une panne du fournisseur ne se voit qu'à l'envoi. */
  async voiceAvailability(userId: string): Promise<VoiceAvailability> {
    if (!this.limits.voiceEnabled) return { available: false, reason: 'disabled' };
    if (this.stt.name === 'fake' || !this.media.active) {
      return { available: false, reason: 'unconfigured' };
    }
    const sent = await this.store.sentToday(userId, 'AUDIO');
    return sent < this.limits.voicePerDay
      ? { available: true }
      : { available: false, reason: 'quota' };
  }

  private async inTurn<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queue.get(key) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(task);
    this.queue.set(key, next);
    try {
      return await next;
    } finally {
      if (this.queue.get(key) === next) this.queue.delete(key);
    }
  }

  private async deliver(
    userId: string,
    conversationId: string,
    { clientId, data, file, mediaSeconds }: CheckedUpload,
  ) {
    const voice = file.kind === 'AUDIO';
    const limit = voice ? this.limits.voicePerDay : this.limits.photosPerDay;
    const found = await this.store.check(userId, conversationId, clientId, file.kind, limit);
    if (!found) throw notFound();
    // Un renvoi passe toujours : le message est déjà là, quoi qu'il se soit passé depuis.
    if ('row' in found) return this.result(found);

    const { active } = this.media;
    const target = active && this.media.stores[active];
    if (!target) {
      throw fail(
        503,
        'MEDIA_UNAVAILABLE',
        "L'envoi de photos et de vocaux est indisponible pour le moment.",
      );
    }
    if (voice) await this.allowVoice(userId);
    if ('limited' in found) {
      throw fail(
        429,
        'USAGE_LIMIT',
        voice
          ? `Tu as envoyé tes ${limit} vocaux du jour. Tu peux encore écrire, et les vocaux reviennent demain.`
          : `Tu as envoyé tes ${limit} photos du jour. Elles reviennent demain.`,
      );
    }
    // La transcription d'abord : si elle échoue, rien n'est rangé ni compté.
    const text = voice ? await this.transcribe(data, file.contentType) : '';
    const key = `${voice ? 'audio' : 'image'}/${userId}/${randomUUID()}.${file.ext}`;
    await target.put({ key, data, contentType: file.contentType });
    let sent: SentMessage;
    try {
      sent = await this.store.create(userId, conversationId, {
        clientId,
        kind: file.kind,
        text,
        mediaKey: key,
        mediaProvider: active,
        mediaSeconds,
      });
    } catch (error) {
      // Pas de fichier sans message : personne ne pourrait plus l'effacer.
      await target.delete(key).catch(() => undefined);
      throw error;
    }
    if (!sent.created) await target.delete(key).catch(() => undefined);
    return this.result(sent);
  }

  private async result({ row, created }: SentMessage) {
    return { message: await presentMessage(row, this.media), created };
  }

  private async allowVoice(userId: string) {
    if (!this.limits.voiceEnabled)
      throw voiceUnavailable('Les vocaux sont désactivés pour le moment.');
    if (this.stt.name === 'fake') throw voiceUnavailable();
    if (!(await this.store.hasVoiceConsent(userId))) {
      throw fail(403, 'VOICE_CONSENT_REQUIRED', "Accepte d'abord les enregistrements vocaux.");
    }
  }

  private async transcribe(audio: Uint8Array, mimeType: string) {
    const heard = await this.stt.transcribe({ audio, mimeType }).catch(() => null);
    // `fake` : repli factice (plafond ou quota du fournisseur), ce ne sont pas les paroles.
    if (!heard || heard.fake) throw voiceUnavailable();
    return heard.text.trim();
  }
}
