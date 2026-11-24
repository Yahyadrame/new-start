'use client';

import { Button, Input } from '@newstart/ui';
import { SendHorizontal } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import fr from '../../shared/i18n/fr.json';

const c = fr.conversation;

/** Champ d'écriture : Entrée ou le bouton envoient, et le champ se vide aussitôt. */
export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const empty = text.trim() === '';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (empty) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form
      onSubmit={submit}
      className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-bg px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <label htmlFor="composer" className="sr-only">
        {c.composerLabel}
      </label>
      <Input
        id="composer"
        value={text}
        maxLength={2000}
        autoComplete="off"
        placeholder={c.composerPlaceholder}
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        type="submit"
        size="icon"
        disabled={empty}
        aria-label={c.send}
        className="rounded-full"
      >
        <SendHorizontal aria-hidden="true" />
      </Button>
    </form>
  );
}
