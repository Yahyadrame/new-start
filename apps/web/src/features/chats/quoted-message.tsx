import type { MessageItem } from '@newstart/shared';
import { cn } from '@newstart/ui';
import fr from '../../shared/i18n/fr.json';
import { previewText } from './chats-format';

const c = fr.conversation;

/** Le message auquel on répond : son auteur et deux lignes de son texte. `onDark` pour une bulle de la personne. */
export function QuotedMessage({
  quote,
  agentName,
  onDark = false,
}: Readonly<{
  quote: NonNullable<MessageItem['replyTo']>;
  agentName: string;
  onDark?: boolean;
}>) {
  const name = quote.author === 'USER' ? c.quoteYou : agentName;
  return (
    <div
      className={cn(
        'mb-1.5 rounded-lg border-l-4 px-2.5 py-1.5 text-[13px]',
        onDark ? 'border-on-accent bg-black/10' : 'border-accent-text bg-surface-1',
      )}
    >
      <p className="font-semibold">{name}</p>
      <p className={cn('line-clamp-2', quote.deleted && 'italic')}>
        {quote.deleted ? c.deleted : previewText(quote.text, quote.mediaKind)}
      </p>
    </div>
  );
}
