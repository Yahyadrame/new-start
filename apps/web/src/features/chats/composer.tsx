'use client';

import { SendHorizontal } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import fr from '../../shared/i18n/fr.json';

const c = fr.conversation;

/** Champ d'écriture : Entrée ou le bouton envoient, et le champ se vide aussitôt. */
export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const empty = text.trim() === '';

  const send = () => {
    if (empty) return;
    onSend(text.trim());
    setText('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send();
  };

  // Entrée envoie, Maj+Entrée passe à la ligne (comme sur WhatsApp Web).
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    send();
  };

  return (
    <form
      onSubmit={submit}
      className="sticky bottom-0 flex w-full min-w-0 items-end gap-2 bg-surface-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-4"
    >
      <label htmlFor="composer" className="sr-only">
        {c.composerLabel}
      </label>
      <textarea
        id="composer"
        rows={1}
        value={text}
        maxLength={2000}
        autoComplete="off"
        enterKeyHint="send"
        placeholder={c.composerPlaceholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-3xl border border-line bg-bg px-4 py-2.5 text-[15px] leading-snug [field-sizing:content] placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
      />
      <button
        type="submit"
        disabled={empty}
        aria-label={c.send}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text disabled:opacity-50"
      >
        <SendHorizontal aria-hidden="true" className="size-5" />
      </button>
    </form>
  );
}
