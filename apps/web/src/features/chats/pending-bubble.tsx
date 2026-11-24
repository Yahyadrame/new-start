import fr from '../../shared/i18n/fr.json';

const c = fr.conversation;

export type PendingMessage = { clientId: string; text: string; status: 'sending' | 'failed' };

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
      <p className="rounded-[18px] rounded-br-[6px] bg-accent px-4 py-2.5 text-[15px] leading-snug whitespace-pre-wrap text-on-accent opacity-70">
        {message.text}
      </p>
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
