'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newstart/ui';
import {
  Image as ImageIcon,
  Mic,
  Keyboard,
  Sticker as StickerIcon,
  SendHorizontal,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useFinePointer } from '../../shared/use-fine-pointer';
import { compressImage } from './compress-image';
import { EmojiPanel } from './emoji-panel';
import { LocalPhoto } from './local-photo';
import { StickerPanel } from './sticker-panel';
import fr from '../../shared/i18n/fr.json';
import { formatDuration, useVoiceRecorder, type VoiceClip } from './use-voice-recorder';

const c = fr.conversation;

/** Ce qui attend dans la barre avant l'envoi : un vocal enregistré ou une photo réduite. */
type Draft = ({ kind: 'voice' } & VoiceClip) | { kind: 'photo'; blob: Blob; url?: undefined };

const round =
  'grid size-11 shrink-0 place-items-center rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text';

/**
 * Barre d'écriture façon WhatsApp : une pilule (photo et champ) et un bouton rond qui est le micro quand le
 * champ est vide, l'envoi quand il y a du texte. Les photos et les vocaux se préparent ici avant de partir.
 */
export function Composer({
  onSend,
  onSendPhoto,
  onSendVoice,
  onSendSticker,
  onMicRequest,
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
  /** Envoie la photo choisie ; sans lui, la barre n'a pas de bouton photo. */
  onSendPhoto?: (photo: Blob) => void;
  /** Envoie le vocal enregistré, avec sa durée en secondes. */
  onSendVoice?: (voice: Blob, seconds: number) => void;
  /** Envoie le sticker choisi dans le panneau ; sans lui, la barre n'a pas de bouton stickers. */
  onSendSticker?: (stickerId: string) => void;
  /** Dit si l'enregistrement peut commencer (accord aux vocaux) avant d'ouvrir le micro. */
  onMicRequest?: () => Promise<boolean>;
}) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [stickers, setStickers] = useState(false);
  const desktop = useFinePointer();
  const [notice, setNotice] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const bar = useRef<HTMLFormElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const asking = useRef(false);
  const recorder = useVoiceRecorder((clip) => setDraft({ kind: 'voice', ...clip }));
  const empty = text.trim() === '';
  // Pendant une modification, la pièce jointe attend : « Envoyer » enregistre le texte.
  const attachment = edit ? null : draft;

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

  // Comme sur WhatsApp : le panneau prend la place du clavier, et la touche clavier la lui rend.
  const toggleStickers = () => {
    if (stickers) {
      setStickers(false);
      field.current?.focus();
    } else {
      field.current?.blur();
      setStickers(true);
    }
  };

  // Le panneau se ferme avec Échap (le focus revient au bouton) ou au toucher en dehors de la barre.
  // Un clic, pas un appui : faire défiler les messages le laisse ouvert.
  useEffect(() => {
    if (!stickers) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      // Déjà traité par la liste d'émojis ou une fenêtre ; une recherche remplie se vide d'abord.
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (e.target instanceof HTMLInputElement && e.target.type === 'search' && e.target.value)
        return;
      setStickers(false);
      toggle.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (!bar.current?.contains(e.target as Node)) setStickers(false);
    };
    document.addEventListener('keydown', onKey);
    // En capture : la cible est encore dans la page, même si le clic la fait disparaître.
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick, true);
    };
  }, [stickers]);

  const send = () => {
    if (empty) return;
    onSend(text.trim());
    setText('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (attachment) {
      if (attachment.kind === 'voice') onSendVoice?.(attachment.blob, attachment.seconds);
      else onSendPhoto?.(attachment.blob);
      setDraft(null);
      setNotice(null);
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

  const record = async () => {
    if (asking.current) return;
    asking.current = true;
    setNotice(null);
    try {
      if (!onMicRequest || (await onMicRequest())) await recorder.start();
    } catch {
      setNotice(c.voiceConsentFailed);
    } finally {
      asking.current = false;
    }
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setNotice(null);
    const blob = await compressImage(file);
    if (!blob) return setNotice(c.photoUnreadable);
    setDraft({ kind: 'photo', blob });
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
    <form ref={bar} onSubmit={submit} className={shell}>
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
      {/* Une pièce jointe part sans citation : la réponse attend le prochain message écrit. */}
      {reply && !edit && !attachment && (
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
          {attachment ? (
            <DraftPreview
              draft={attachment}
              onRemove={() => {
                setDraft(null);
                setNotice(null);
              }}
            />
          ) : (
            <>
              {onSendPhoto && !edit && (
                <button
                  type="button"
                  aria-label={c.attachPhoto}
                  onClick={() => photoInput.current?.click()}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
                >
                  <ImageIcon aria-hidden="true" className="size-6" />
                </button>
              )}
              {onSendSticker && (
                <button
                  ref={toggle}
                  type="button"
                  aria-label={stickers ? c.keyboard : desktop ? c.emojiStickers : c.stickers}
                  aria-pressed={stickers}
                  onClick={toggleStickers}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text"
                >
                  {stickers ? (
                    <Keyboard aria-hidden="true" className="size-6" />
                  ) : (
                    <StickerIcon aria-hidden="true" className="size-6" />
                  )}
                </button>
              )}
              <label htmlFor="composer" className="sr-only">
                {c.composerLabel}
              </label>
              <textarea
                id="composer"
                ref={field}
                rows={1}
                value={text}
                maxLength={2000}
                autoComplete="off"
                enterKeyHint="send"
                placeholder={c.composerPlaceholder}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                // Sur téléphone, le clavier qui s'ouvre prend la place du panneau.
                onFocus={() => !desktop && setStickers(false)}
                className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 pr-4 text-base leading-snug [field-sizing:content] placeholder:text-text-muted outline-none"
              />
            </>
          )}
        </div>
        {empty && !attachment && !edit ? (
          <button
            type="button"
            aria-label={c.record}
            onClick={() => void record()}
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
      {stickers && onSendSticker && (
        <div className="mt-2 h-[min(40dvh,320px)]">
          {desktop ? (
            <Tabs defaultValue="emojis" className="flex h-full flex-col gap-2">
              <TabsList className="self-start">
                {/* Le panneau vient après le bouton d'envoi : on y amène le focus à l'ouverture. */}
                <TabsTrigger value="emojis" autoFocus>
                  {c.emojis}
                </TabsTrigger>
                <TabsTrigger value="stickers">{c.stickers}</TabsTrigger>
              </TabsList>
              <TabsContent value="emojis" className="mt-0 min-h-0 flex-1">
                <EmojiPanel onPick={(emoji) => setText((t) => t + emoji)} />
              </TabsContent>
              <TabsContent value="stickers" className="mt-0 min-h-0 flex-1">
                <StickerPanel onPick={onSendSticker} />
              </TabsContent>
            </Tabs>
          ) : (
            <StickerPanel onPick={onSendSticker} />
          )}
        </div>
      )}
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        hidden
        data-testid="photo-input"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </form>
  );
}

function DraftPreview({ draft, onRemove }: { draft: Draft; onRemove: () => void }) {
  return (
    <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 py-1 pl-3">
      {draft.kind === 'voice' ? (
        <audio
          controls
          src={draft.url}
          aria-label={c.draftVoice.replace('{duration}', formatDuration(draft.seconds))}
          className="h-9 min-w-0 flex-1"
        />
      ) : (
        <>
          <LocalPhoto blob={draft.blob} alt="" className="size-11 shrink-0 rounded-xl" />
          <span className="min-w-0 flex-1 truncate text-base">{c.draftPhoto}</span>
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
