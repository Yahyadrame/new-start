import type { MessageItem } from '@newstart/shared';
import { cn } from '@newstart/ui';
import fr from '../../shared/i18n/fr.json';
import { formatWhen } from './chats-format';

const c = fr.conversation;

/** Sous un message de la personne : la tournure plus naturelle, ou un mot si rien n'est à corriger. */
function Correction({ correction }: { correction: NonNullable<MessageItem['correction']> }) {
  if (!correction.better) return <p className="px-1 text-xs text-text-muted">{c.perfect}</p>;
  return (
    <aside className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-1 px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
        {c.natural}
      </p>
      <p className="text-[15px] font-medium">{correction.better}</p>
      {correction.whyFr && <p className="text-[13px] text-text-muted">{correction.whyFr}</p>}
    </aside>
  );
}

export function MessageBubble({ message }: { message: MessageItem }) {
  if (message.author === 'SYSTEM') {
    return <li className="self-center text-center text-xs text-text-muted">{message.text}</li>;
  }
  const mine = message.author === 'USER';
  return (
    <li
      className={cn('flex max-w-[85%] flex-col gap-1', mine ? 'items-end self-end' : 'self-start')}
    >
      <p
        className={cn(
          'rounded-2xl px-4 py-2.5 text-[15px] leading-snug whitespace-pre-wrap',
          mine ? 'rounded-br-md bg-accent text-on-accent' : 'rounded-bl-md bg-surface-2',
        )}
      >
        {message.text}
      </p>
      <time dateTime={message.createdAt} className="px-1 text-xs text-text-muted">
        {formatWhen(message.createdAt)}
      </time>
      {mine && message.correction && <Correction correction={message.correction} />}
    </li>
  );
}
