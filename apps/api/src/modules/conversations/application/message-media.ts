import type { MessageItem } from '@newstart/shared';
import type { MediaProvider, MediaStores } from '../../../shared/media/media-store.js';

/** Durée d'un lien de lecture. */
const LINK_TTL_SECONDS = 3600;
/** Les vocaux sont effacés par le stockage au bout de ce délai ; les photos restent. */
const VOICE_KEPT_MS = 30 * 86_400_000;

/** Les colonnes des médias, telles que le stockage des messages les rend. */
export interface MediaColumns {
  kind?: 'TEXT' | 'AUDIO' | 'IMAGE' | undefined;
  mediaKey?: string | null | undefined;
  mediaProvider?: string | null | undefined;
  mediaSeconds?: number | null | undefined;
  /** Pour un fichier repris par un transfert : quand il a été rangé. */
  mediaStoredAt?: Date | null | undefined;
}

/** Vrai quand le stockage a effacé ce vocal ; les photos n'expirent pas. */
export const voiceExpired = (kind: 'AUDIO' | 'IMAGE', storedAt: Date, now: Date) =>
  kind === 'AUDIO' && now.getTime() - storedAt.getTime() > VOICE_KEPT_MS;

/** Le vocal ou la photo d'un message, avec son lien de lecture ; rien pour un texte ou un message supprimé. */
export async function presentMedia(
  row: MediaColumns & { createdAt: Date; deletedAt: Date | null },
  { stores }: MediaStores,
  now: Date,
): Promise<MessageItem['media']> {
  const { kind, mediaKey, mediaProvider, mediaSeconds, createdAt, deletedAt } = row;
  if (deletedAt || (kind !== 'AUDIO' && kind !== 'IMAGE')) return undefined;
  const store = stores[mediaProvider as MediaProvider];
  const expired = voiceExpired(kind, row.mediaStoredAt ?? createdAt, now);
  const url =
    store && mediaKey && !expired ? await store.signedUrl(mediaKey, LINK_TTL_SECONDS) : null;
  return { kind, url, seconds: mediaSeconds ?? null };
}
