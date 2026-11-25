import { useState } from 'react';
import type { MessageItem } from '@newstart/shared';
import { cn } from '@newstart/ui';
import fr from '../../shared/i18n/fr.json';
import { CheckCheck } from 'lucide-react';
import { formatHour } from './chats-format';

const c = fr.conversation;

type Save = 'idle' | 'saving' | 'saved' | 'failed';

/** Bouton de la carte : un échec laisse le bouton actif pour réessayer. */
function NotebookButton({ onAdd }: { onAdd: () => Promise<void> }) {
  const [state, setState] = useState<Save>('idle');
  if (state === 'saved') return <p className="text-[13px] font-semibold">{c.addedToNotebook}</p>;
  const add = () => {
    setState('saving');
    onAdd().then(
      () => setState('saved'),
      () => setState('failed'),
    );
  };
  return (
    <button
      type="button"
      onClick={add}
      disabled={state === 'saving'}
      className="min-h-11 self-start rounded-full border border-line px-4 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-accent-text disabled:opacity-60"
    >
      {state === 'saving'
        ? c.addingToNotebook
        : state === 'failed'
          ? c.addToNotebookFailed
          : c.addToNotebook}
    </button>
  );
}

/** Sous un message du contact : « Traduire » puis la traduction ; un échec laisse le bouton actif. */
function Translation({
  initial,
  onTranslate,
}: {
  initial: string | null;
  onTranslate: (() => Promise<string>) | undefined;
}) {
  const [text, setText] = useState(initial);
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle');
  if (text) return <p className="px-1 text-[13px] text-text-muted">{text}</p>;
  if (!onTranslate) return null;
  const run = () => {
    setState('loading');
    onTranslate().then(setText, () => setState('failed'));
  };
  return (
    <button
      type="button"
      onClick={run}
      disabled={state === 'loading'}
      className="min-h-11 self-start rounded-full px-3 text-[13px] font-semibold text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text disabled:opacity-60"
    >
      {state === 'loading' ? c.translating : state === 'failed' ? c.translateFailed : c.translate}
    </button>
  );
}

/** Sous un message de la personne : la tournure plus naturelle, ou un mot si rien n'est à corriger. */
function Correction({
  correction,
  onAdd,
}: {
  correction: NonNullable<MessageItem['correction']>;
  onAdd: (() => Promise<void>) | undefined;
}) {
  if (!correction.better) return <p className="px-1 text-xs text-text-muted">{c.perfect}</p>;
  return (
    <aside className="flex flex-col gap-1 rounded-[18px] border border-line bg-bg px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
        {c.natural}
      </p>
      <p className="text-[15px] font-medium">{correction.better}</p>
      {correction.whyFr && <p className="text-[13px] text-text-muted">{correction.whyFr}</p>}
      {onAdd && <NotebookButton onAdd={onAdd} />}
    </aside>
  );
}

export function MessageBubble({
  message,
  highlighted = false,
  onAddToNotebook,
  onTranslate,
}: {
  message: MessageItem;
  /** Entoure la bulle : le message qu'on vient de retrouver par la recherche. */
  highlighted?: boolean;
  /** Traduit un message du contact ; sans elle, pas de bouton. */
  onTranslate?: (messageId: string) => Promise<string>;
  /** Garde la correction de ce message dans le carnet ; sans elle, la carte n'a pas de bouton. */
  onAddToNotebook?: (messageId: string) => Promise<void>;
}) {
  if (message.author === 'SYSTEM') {
    return <li className="self-center text-center text-xs text-text-muted">{message.text}</li>;
  }
  const mine = message.author === 'USER';
  return (
    <li
      id={`message-${message.id}`}
      className={cn(
        'flex max-w-[85%] min-w-0 flex-col gap-1 sm:max-w-[75%]',
        mine ? 'items-end self-end' : 'self-start',
      )}
    >
      <p
        className={cn(
          'rounded-[18px] px-4 py-2.5 text-[15px] leading-snug break-words whitespace-pre-wrap [overflow-wrap:anywhere]',
          mine ? 'rounded-br-[6px] bg-accent text-on-accent' : 'rounded-bl-[6px] bg-bg',
          highlighted && 'ring-2 ring-accent-text ring-offset-2 ring-offset-surface-1',
        )}
      >
        {message.text}
      </p>
      <span className="flex items-center gap-1 px-1 text-xs text-text-muted">
        <time dateTime={message.createdAt}>{formatHour(message.createdAt)}</time>
        {mine && <CheckCheck aria-hidden="true" className="size-3.5" />}
      </span>
      {!mine && (
        <Translation
          initial={message.translationFr}
          onTranslate={onTranslate && (() => onTranslate(message.id))}
        />
      )}
      {mine && message.correction && (
        <Correction
          correction={message.correction}
          onAdd={onAddToNotebook && (() => onAddToNotebook(message.id))}
        />
      )}
    </li>
  );
}
