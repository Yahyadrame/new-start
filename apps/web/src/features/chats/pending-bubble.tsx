import { STICKERS } from '@newstart/shared';
import { Sticker } from '@newstart/ui';
import { Mic } from 'lucide-react';
import fr from '../../shared/i18n/fr.json';
import { LocalPhoto } from './local-photo';
import { formatDuration } from './use-voice-recorder';

const c = fr.conversation;

export type PendingMessage = {
  clientId: string;
  text: string;
  status: 'sending' | 'failed';
  /** Le message cité, gardé pour que le nouvel essai parte avec la même citation. */
  replyToId?: string;
  /** L'identifiant du sticker quand le message en est un. */
  sticker?: string;
  /** La photo réduite, quand le message en est une. */
  photo?: Blob;
  /** L'enregistrement et sa durée, quand le message est un vocal. */
  voice?: { blob: Blob; seconds: number };
};

/** Message de la personne pas encore confirmé par l'API : en cours d'envoi, ou parti en échec. */
export function PendingBubble({
  message,
  onRetry,
}: {
  message: PendingMessage;
  onRetry: () => void;
}) {
  return (
    <li className="flex max-w-[80%] flex-col items-end gap-1 self-end">
      <PendingContent message={message} />
      {message.status === 'sending' ? (
        <p role="status" className="px-1 text-xs text-text-muted">
          {c.sending}
        </p>
      ) : (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 px-1 text-right text-xs font-medium text-text underline underline-offset-2"
        >
          {c.sendFailed}
        </button>
      )}
    </li>
  );
}

function PendingContent({ message }: Readonly<{ message: PendingMessage }>) {
  if (message.photo) {
    return (
      <LocalPhoto
        blob={message.photo}
        alt={c.photo}
        className="aspect-square w-60 max-w-full rounded-[18px] opacity-70"
      />
    );
  }
  if (message.voice) {
    return (
      <p className="flex items-center gap-2 rounded-[18px] rounded-br-[6px] bg-accent px-4 py-2.5 text-[15px] leading-snug text-on-accent opacity-70">
        <Mic aria-hidden="true" className="size-4 shrink-0" />
        {c.draftVoice.replace('{duration}', formatDuration(message.voice.seconds))}
      </p>
    );
  }
  const sticker = STICKERS.find((s) => s.id === message.sticker);
  if (sticker) {
    return (
      <div className="flex flex-col items-center opacity-70">
        <Sticker parts={sticker.parts} alt={sticker.text} className="size-28" />
        <span className="text-[13px] font-semibold">{sticker.text}</span>
      </div>
    );
  }
  return (
    <p className="rounded-[18px] rounded-br-[6px] bg-accent px-4 py-2.5 text-[15px] leading-snug whitespace-pre-wrap text-on-accent opacity-70">
      {message.text}
    </p>
  );
}
