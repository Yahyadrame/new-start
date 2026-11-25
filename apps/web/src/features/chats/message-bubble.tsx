import { useState } from 'react';
import type { MessageItem } from '@newstart/shared';
import { cn, Popover, PopoverContent, PopoverTrigger } from '@newstart/ui';
import fr from '../../shared/i18n/fr.json';
import { Ban, CheckCheck, Copy, MoreHorizontal, Pencil, Reply, Trash2 } from 'lucide-react';
import { QuotedMessage } from './quoted-message';
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

const item =
  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-base hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-text disabled:opacity-60';

/** Menu d'un message : copier, et supprimer après une confirmation. */
function Actions({
  text,
  onReply,
  onEdit,
  onDelete,
}: {
  text: string;
  onReply: (() => void) | undefined;
  onEdit: (() => void) | undefined;
  onDelete: (() => Promise<void>) | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setAsk(false);
      setNote(null);
    }
  };
  const copy = () =>
    navigator.clipboard.writeText(text).then(
      () => setNote(c.copied),
      () => setNote(c.copyFailed),
    );
  const remove = () => {
    setBusy(true);
    onDelete?.().then(
      () => close(false),
      () => {
        setBusy(false);
        setNote(c.deleteFailed);
      },
    );
  };
  return (
    <Popover open={open} onOpenChange={close}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={c.messageActions}
          className="-my-3 grid size-11 place-items-center rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60" side="top">
        {ask ? (
          <div className="flex flex-col gap-1">
            <p className="px-3 py-2 text-base font-semibold">{c.deleteAsk}</p>
            <button type="button" className={item} disabled={busy} onClick={remove}>
              <Trash2 aria-hidden="true" className="size-5 text-danger" />
              {c.deleteConfirm}
            </button>
            <button type="button" className={item} disabled={busy} onClick={() => setAsk(false)}>
              {c.deleteCancel}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {onReply && (
              <button
                type="button"
                className={item}
                onClick={() => {
                  close(false);
                  onReply();
                }}
              >
                <Reply aria-hidden="true" className="size-5" />
                {c.reply}
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                className={item}
                onClick={() => {
                  close(false);
                  onEdit();
                }}
              >
                <Pencil aria-hidden="true" className="size-5" />
                {c.edit}
              </button>
            )}
            <button type="button" className={item} onClick={() => void copy()}>
              <Copy aria-hidden="true" className="size-5" />
              {c.copy}
            </button>
            {onDelete && (
              <button type="button" className={item} onClick={() => setAsk(true)}>
                <Trash2 aria-hidden="true" className="size-5" />
                {c.delete}
              </button>
            )}
          </div>
        )}
        {note && (
          <p role="status" className="px-3 pt-2 text-sm text-text-muted">
            {note}
          </p>
        )}
      </PopoverContent>
    </Popover>
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
  onDelete,
  onReply,
  onEdit,
  agentName = '',
}: {
  message: MessageItem;
  /** Le nom du contact, pour citer ses messages. */
  agentName?: string;
  /** Répond en citant ce message ; sans elle, le menu n'a pas « Répondre ». */
  onReply?: (message: MessageItem) => void;
  /** Modifie ce message (le sien) ; sans elle, le menu n'a pas « Modifier ». */
  onEdit?: (message: MessageItem) => void;
  /** Entoure la bulle : le message qu'on vient de retrouver par la recherche. */
  highlighted?: boolean;
  /** Traduit un message du contact ; sans elle, pas de bouton. */
  onTranslate?: (messageId: string) => Promise<string>;
  /** Efface le message ; sans elle, le menu ne propose que « Copier ». */
  onDelete?: (messageId: string) => Promise<void>;
  /** Garde la correction de ce message dans le carnet ; sans elle, la carte n'a pas de bouton. */
  onAddToNotebook?: (messageId: string) => Promise<void>;
}) {
  if (message.author === 'SYSTEM') {
    return <li className="self-center text-center text-xs text-text-muted">{message.text}</li>;
  }
  const mine = message.author === 'USER';
  if (message.deleted) {
    return (
      <li
        id={`message-${message.id}`}
        className={cn('max-w-[85%] min-w-0 sm:max-w-[75%]', mine ? 'self-end' : 'self-start')}
      >
        <p className="flex items-center gap-2 rounded-[18px] border border-line bg-bg px-4 py-2.5 text-[15px] text-text-muted italic">
          <Ban aria-hidden="true" className="size-4 shrink-0" />
          {c.deleted}
        </p>
      </li>
    );
  }
  return (
    <li
      id={`message-${message.id}`}
      className={cn(
        'flex max-w-[85%] min-w-0 flex-col gap-1 sm:max-w-[75%]',
        mine ? 'items-end self-end' : 'self-start',
      )}
    >
      <div
        className={cn(
          'rounded-[18px] px-4 py-2.5 text-[15px] leading-snug break-words whitespace-pre-wrap [overflow-wrap:anywhere]',
          mine ? 'rounded-br-[6px] bg-accent text-on-accent' : 'rounded-bl-[6px] bg-bg',
          highlighted && 'ring-2 ring-accent-text ring-offset-2 ring-offset-surface-1',
        )}
      >
        {message.replyTo && (
          <QuotedMessage quote={message.replyTo} agentName={agentName} onDark={mine} />
        )}
        <p>{message.text}</p>
      </div>
      <span className="flex items-center gap-1 px-1 text-xs text-text-muted">
        {message.edited && <span>{c.edited}</span>}
        <time dateTime={message.createdAt}>{formatHour(message.createdAt)}</time>
        {mine && <CheckCheck aria-hidden="true" className="size-3.5" />}
        <Actions
          text={message.text}
          onReply={onReply && (() => onReply(message))}
          onEdit={mine && onEdit ? () => onEdit(message) : undefined}
          onDelete={onDelete && (() => onDelete(message.id))}
        />
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
