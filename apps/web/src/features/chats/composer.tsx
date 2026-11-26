'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@newstart/ui';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Plus,
  Smile,
  SendHorizontal,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import fr from '../../shared/i18n/fr.json';
import { formatDuration, useVoiceRecorder, type VoiceClip } from './use-voice-recorder';

const c = fr.conversation;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Ce qui attend dans la barre avant l'envoi : un vocal enregistré ou un fichier choisi. */
export type Draft = ({ kind: 'voice' } & VoiceClip) | { kind: 'file'; file: File; url?: undefined };

/** Les émojis du quotidien, sans bibliothèque : de quoi réagir et se détendre en anglais comme en français. */
export const EMOJIS = [
  '😀',
  '😂',
  '🥹',
  '😊',
  '😍',
  '🥰',
  '😎',
  '🤔',
  '😅',
  '😭',
  '😮',
  '😴',
  '🙄',
  '😬',
  '🤝',
  '🙏',
  '👍',
  '👎',
  '👏',
  '🙌',
  '💪',
  '👋',
  '✌️',
  '🤞',
  '❤️',
  '🔥',
  '✨',
  '🎉',
  '🎶',
  '☕',
  '🍕',
  '🌍',
  '✈️',
  '📚',
  '💡',
  '✅',
  '❌',
  '❓',
  '💬',
  '🎧',
];

const round =
  'grid size-11 shrink-0 place-items-center rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text';

/**
 * Barre d'écriture façon WhatsApp : une pilule (+ et champ) et un bouton rond qui est le micro quand le champ
 * est vide, l'envoi quand il y a du texte. Les vocaux et fichiers se préparent ici ; `onSendMedia` les envoie
 * (NS-047). Sans lui, la barre le dit et garde la pièce jointe.
 */
export function Composer({
  onSend,
  onSendMedia,
  reply = null,
  onCancelReply,
  edit = null,
  onCancelEdit,
}: {
  onSend: (text: string) => void;
  /** Le message cité : une bande au-dessus du champ, avec un bouton pour l'abandonner. */
  reply?: { name: string; text: string } | null;
  onCancelReply?: () => void;
  /** Le message en cours de modification : le champ reprend son texte et « Envoyer » l'enregistre. */
  edit?: { id: string; text: string } | null;
  onCancelEdit?: () => void;
  onSendMedia?: (draft: Draft) => void;
}) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder((clip) => setDraft({ kind: 'voice', ...clip }));
  const empty = text.trim() === '';

  // Passer en modification reprend le texte du message ; la quitter vide le champ.
  const editId = edit?.id;
  const editText = edit?.text;
  useEffect(() => {
    setText(editText ?? '');
  }, [editId]);

  // Libère l'aperçu (URL locale) quand la pièce jointe change ou que l'écran se ferme.
  useEffect(() => {
    const url = draft?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [draft]);

  const send = () => {
    if (empty) return;
    onSend(text.trim());
    setText('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (draft) {
      if (onSendMedia) {
        onSendMedia(draft);
        setDraft(null);
        setNotice(null);
      } else setNotice(c.mediaSoon);
      return;
    }
    send();
  };

  // Entrée envoie, Maj+Entrée passe à la ligne (comme sur WhatsApp Web).
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    send();
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return setNotice(c.fileTooBig);
    setNotice(null);
    setDraft({ kind: 'file', file });
  };

  const shell =
    'sticky bottom-[var(--kb,0px)] w-full min-w-0 bg-surface-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-4';
  const note =
    notice ??
    (recorder.error ? (recorder.error === 'denied' ? c.micDenied : c.micUnavailable) : null);

  if (recorder.recording) {
    return (
      <div className={`${shell} flex items-center gap-2`}>
        <button
          type="button"
          aria-label={c.recordingCancel}
          onClick={recorder.cancel}
          className={`${round} border border-line bg-bg text-text`}
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
        <p
          role="timer"
          aria-label={c.recording}
          className="flex min-h-11 flex-1 items-center gap-2 rounded-full border border-line bg-bg px-4 text-base"
        >
          <span aria-hidden="true" className="size-2.5 animate-pulse rounded-full bg-danger" />
          {formatDuration(recorder.seconds)}
        </p>
        <button
          type="button"
          aria-label={c.recordingStop}
          onClick={recorder.stop}
          className={`${round} bg-accent text-on-accent`}
        >
          <Square aria-hidden="true" className="size-4 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={shell}>
      {note && (
        <p role="status" className="px-3 pb-2 text-sm text-text-muted">
          {note}
        </p>
      )}
      {edit && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border-l-4 border-accent-text bg-bg py-1 pr-1 pl-3">
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="font-semibold">{c.editing}</p>
            <p className="truncate text-text-muted">{edit.text}</p>
          </div>
          <button
            type="button"
            aria-label={c.editCancel}
            onClick={onCancelEdit}
            className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      )}
      {reply && !edit && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border-l-4 border-accent-text bg-bg py-1 pr-1 pl-3">
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="font-semibold">{c.replyingTo.replace('{name}', reply.name)}</p>
            <p className="truncate text-text-muted">{reply.text}</p>
          </div>
          <button
            type="button"
            aria-label={c.replyCancel}
            onClick={onCancelReply}
            className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 items-end rounded-3xl border border-line bg-bg focus-within:border-text-muted focus-within:ring-1 focus-within:ring-text-muted">
          {draft ? (
            <DraftPreview
              draft={draft}
              onRemove={() => {
                setDraft(null);
                setNotice(null);
              }}
            />
          ) : (
            <>
              <Popover open={menu} onOpenChange={setMenu}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={c.attach}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
                  >
                    <Plus aria-hidden="true" className="size-6" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56" side="top">
                  <MenuItem
                    icon={<ImageIcon aria-hidden="true" className="size-5" />}
                    label={c.attachPhoto}
                    onClick={() => {
                      setMenu(false);
                      photoInput.current?.click();
                    }}
                  />
                  <MenuItem
                    icon={<FileText aria-hidden="true" className="size-5" />}
                    label={c.attachFile}
                    onClick={() => {
                      setMenu(false);
                      fileInput.current?.click();
                    }}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={c.emoji}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
                  >
                    <Smile aria-hidden="true" className="size-6" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72" side="top">
                  <ul className="grid grid-cols-6 gap-1">
                    {EMOJIS.map((emoji) => (
                      <li key={emoji}>
                        <button
                          type="button"
                          aria-label={c.emojiInsert.replace('{emoji}', emoji)}
                          onClick={() => setText((t) => t + emoji)}
                          className="grid size-11 w-full place-items-center rounded-xl text-2xl hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-text"
                        >
                          {emoji}
                        </button>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
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
                className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 pr-4 text-base leading-snug [field-sizing:content] placeholder:text-text-muted outline-none"
              />
            </>
          )}
        </div>
        {empty && !draft && !edit ? (
          <button
            type="button"
            aria-label={c.record}
            onClick={() => void recorder.start()}
            className={`${round} bg-accent text-on-accent`}
          >
            <Mic aria-hidden="true" className="size-5" />
          </button>
        ) : (
          <button type="submit" aria-label={c.send} className={`${round} bg-accent text-on-accent`}>
            <SendHorizontal aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        hidden
        data-testid="photo-input"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={fileInput}
        type="file"
        hidden
        data-testid="file-input"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </form>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-base hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-text"
    >
      {icon}
      {label}
    </button>
  );
}

function DraftPreview({ draft, onRemove }: { draft: Draft; onRemove: () => void }) {
  return (
    <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 py-1 pl-3">
      {draft.kind === 'voice' ? (
        <>
          <audio
            controls
            src={draft.url}
            aria-label={c.draftVoice.replace('{duration}', formatDuration(draft.seconds))}
            className="h-9 min-w-0 flex-1"
          />
        </>
      ) : (
        <>
          {draft.file.type.startsWith('image/') ? (
            <ImageIcon aria-hidden="true" className="size-6 shrink-0 text-text-muted" />
          ) : (
            <FileText aria-hidden="true" className="size-6 shrink-0 text-text-muted" />
          )}
          <span className="min-w-0 flex-1 truncate text-base">{draft.file.name}</span>
        </>
      )}
      <button
        type="button"
        aria-label={c.draftRemove}
        onClick={onRemove}
        className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
