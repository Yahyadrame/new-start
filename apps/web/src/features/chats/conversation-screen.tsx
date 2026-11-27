'use client';

import {
  STICKERS,
  type ChatBackground,
  type ConversationItem,
  type MessageItem,
} from '@newstart/shared';
import { Badge, Button, Skeleton } from '@newstart/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ContactAvatar } from '../../shared/avatar/contact-avatar';
import { loadContactAvatars } from '../../shared/avatar/contact-avatars';
import { ensureSession } from '../../shared/auth/session';
import { ChatBackdrop, getChatBackground } from '../../shared/chat-background';
import fr from '../../shared/i18n/fr.json';
import {
  addToNotebook,
  deleteMessage,
  editMessage,
  translateMessage,
  listConversations,
  listMessages,
  markConversationRead,
  reactToMessage,
  sendMedia,
  sendMessage,
} from './chats-api';
import { dayLabel, previewText } from './chats-format';
import {
  CHATS_CHANGED,
  isAwaiting,
  isFresh,
  mergeLatest,
  POLL_LIMIT,
  POLL_MS,
  repliesAfter,
} from './chats-merge';
import { Composer } from './composer';
import { ForwardDialog } from './forward-dialog';
import { useKeyboardInset } from './use-keyboard-inset';
import { useVoiceAvailability } from './use-voice-availability';
import { useVoiceConsent } from './use-voice-consent';
import { MessageBubble } from './message-bubble';
import { PendingBubble, type PendingMessage } from './pending-bubble';
import { TypingBubble } from './typing-bubble';

const t = fr.chats;
const c = fr.conversation;

/** Pages plus anciennes qu'on charge au plus pour retrouver un message de la recherche (30 messages chacune). */
const MAX_SEEK_PAGES = 20;
/** Durée pendant laquelle le message retrouvé reste entouré. */
const FLASH_MS = 3000;

/** Un refus que réessayer ne changera pas : le texte à montrer à la place de la bulle. */
function refusalOf(code: string | undefined, { photo, voice }: PendingMessage) {
  const c = fr.conversation;
  if (code === 'VOICE_UNAVAILABLE') return c.voiceSendUnavailable;
  if (code === 'VOICE_CONSENT_REQUIRED') return c.voiceConsentRequired;
  if (code === 'MEDIA_UNAVAILABLE') {
    return voice ? c.voiceSendUnavailable : c.photoSendUnavailable;
  }
  if (code !== 'USAGE_LIMIT') return null;
  if (voice) return c.voiceLimit;
  return photo ? c.photoLimit : c.limitReached;
}

/** Envoie le message par la bonne route : un fichier (photo ou vocal) ou du texte. */
function transmit(token: string, conversationId: string, message: PendingMessage) {
  const { clientId, text, replyToId, sticker, photo, voice } = message;
  if (photo) return sendMedia(token, conversationId, clientId, photo);
  if (voice) return sendMedia(token, conversationId, clientId, voice.blob, voice.seconds);
  return sendMessage(token, conversationId, {
    clientId,
    text,
    ...(replyToId && { replyToId }),
    ...(sticker && { sticker }),
  });
}

/**
 * Écran 4 : l'en-tête du contact, l'historique du plus ancien au plus récent, et le champ d'écriture.
 * `focusMessageId` (venu de la recherche) ouvre la conversation sur ce message au lieu du plus récent.
 */
export function ConversationScreen({
  agentSlug,
  focusMessageId,
}: {
  agentSlug: string;
  focusMessageId?: string | undefined;
}) {
  const router = useRouter();
  const [item, setItem] = useState<ConversationItem | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [messages, setMessages] = useState<MessageItem[] | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [older, setOlder] = useState<'idle' | 'loading' | 'error'>('idle');
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
  const [editing, setEditing] = useState<MessageItem | null>(null);
  const [editFailed, setEditFailed] = useState(false);
  const [forwarding, setForwarding] = useState<MessageItem | null>(null);
  const [targets, setTargets] = useState<ConversationItem[] | undefined>(undefined);
  // Compte les modifications : chacune relance la relecture qui ramène la nouvelle correction.
  const [edits, setEdits] = useState(0);
  // Date du plus ancien message encore sans réponse ; null quand le contact a répondu à tout.
  // Un nouvel objet à chaque envoi relance les 60 s de relecture.
  const [awaiting, setAwaiting] = useState<{ since: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // L'API a refusé le dernier envoi (limite du jour, fichiers indisponibles) : on dit pourquoi.
  const [refusal, setRefusal] = useState<string | null>(null);
  const [background, setBackground] = useState<ChatBackground>('NONE');
  // `seeking` : on charge des pages plus anciennes jusqu'à trouver le message.
  const [focus, setFocus] = useState<'seeking' | 'found' | 'missing' | null>(
    focusMessageId ? 'seeking' : null,
  );
  const [flash, setFlash] = useState<string | null>(null);
  const seekedPages = useRef(0);
  const skipBottom = useRef(false);
  const token = useRef('');
  const consent = useVoiceConsent(() => token.current, item?.agent.name ?? '');
  const forgetConsent = consent.forget;
  const { blocked: micBlocked, refresh: refreshMic } = useVoiceAvailability(token, Boolean(item));
  const end = useRef<HTMLDivElement>(null);
  const loaded = messages !== undefined;

  const onScreen = useRef(true);
  // Conversation reçue pendant que l'appli était en arrière-plan : elle sera marquée lue au retour.
  const unseen = useRef<string | null>(null);

  // Un message n'est lu que si la conversation est sous les yeux de la personne.
  // Lire n'est pas bloquant : si l'appel échoue, le badge reste, il sera remis à zéro à la prochaine ouverture.
  const markRead = useCallback((conversationId: string) => {
    if (!onScreen.current) return;
    if (document.visibilityState === 'hidden') {
      unseen.current = conversationId;
      return;
    }
    unseen.current = null;
    void markConversationRead(token.current, conversationId)
      .then(() => window.dispatchEvent(new Event(CHATS_CHANGED)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    onScreen.current = true;
    const back = () => {
      if (unseen.current && document.visibilityState !== 'hidden') markRead(unseen.current);
    };
    document.addEventListener('visibilitychange', back);
    return () => {
      onScreen.current = false;
      document.removeEventListener('visibilitychange', back);
    };
  }, [markRead]);

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      token.current = session.accessToken;
      void loadContactAvatars(token.current);
      // Le fond est un confort : s'il ne vient pas, la conversation reste sur le fond uni.
      void getChatBackground(token.current)
        .then(setBackground)
        .catch(() => undefined);
      try {
        const items = await listConversations(token.current);
        const found = items.find((i) => i.agent.slug === agentSlug) ?? null;
        setItem(found);
        if (!found) return;
        if (found.unreadCount > 0) markRead(found.id);
        const page = await listMessages(token.current, found.id);
        setMessages([...page.items].reverse());
        setNextCursor(page.nextCursor);
        // La page va du plus récent au plus ancien : le dernier trouvé est le plus ancien.
        const since = page.items
          .filter((m) => m.author === 'USER' && !m.correction && isFresh(m.createdAt))
          .at(-1)?.createdAt;
        if (since && isAwaiting(page.items, since)) setAwaiting({ since });
      } catch {
        setError(true);
      }
    })();
  }, [router, agentSlug, attempt, markRead]);

  const loadOlder = useCallback(async () => {
    if (!item || !nextCursor) return;
    setOlder('loading');
    try {
      const page = await listMessages(token.current, item.id, nextCursor);
      setMessages((prev) => [...[...page.items].reverse(), ...(prev ?? [])]);
      setNextCursor(page.nextCursor);
      setOlder('idle');
    } catch {
      setOlder('error');
    }
  }, [item, nextCursor]);

  // Le clientId reste le même à chaque nouvel essai : l'API ne crée jamais deux fois le message.
  const deliver = useCallback(
    async (conversationId: string, message: PendingMessage) => {
      const { clientId } = message;
      const mark = (status: PendingMessage['status']) =>
        setPending((prev) => prev.map((p) => (p.clientId === clientId ? { ...p, status } : p)));
      mark('sending');
      try {
        const sent = await transmit(token.current, conversationId, message);
        setRefusal(null);
        setMessages((prev) => [...(prev ?? []), sent]);
        setPending((prev) => prev.filter((p) => p.clientId !== clientId));
        setAwaiting((prev) => ({
          since: prev && prev.since < sent.createdAt ? prev.since : sent.createdAt,
        }));
      } catch (e) {
        const { code } = e as { code?: string };
        if (code === 'VOICE_CONSENT_REQUIRED') forgetConsent();
        const refused = refusalOf(code, message);
        if (refused) setRefusal(refused);
        // Un vocal coûte à refaire : quand un service manque, on le garde pour un nouvel essai.
        const kept = message.voice && code?.endsWith('_UNAVAILABLE');
        if (!refused || kept) return mark('failed');
        setPending((prev) => prev.filter((p) => p.clientId !== clientId));
      } finally {
        // Un vocal peut avoir épuisé la limite du jour : le micro le montre tout de suite.
        if (message.voice) void refreshMic();
      }
    },
    [forgetConsent, refreshMic],
  );

  /** Montre le message en cours d'envoi, puis le confie à `deliver`. */
  const post = (content: Omit<PendingMessage, 'clientId' | 'status'>) => {
    if (!item) return;
    const message: PendingMessage = {
      ...content,
      clientId: crypto.randomUUID(),
      status: 'sending',
    };
    setPending((prev) => [...prev, message]);
    void deliver(item.id, message);
  };

  const send = (text: string) => {
    if (editing) return void saveEdit(editing, text);
    post({ text, ...(replyTo && { replyToId: replyTo.id }) });
    setReplyTo(null);
  };

  const sendSticker = (stickerId: string) => {
    const known = STICKERS.find((x) => x.id === stickerId);
    if (known) post({ text: known.text, sticker: known.id });
  };

  const saveEdit = async (message: MessageItem, text: string) => {
    setEditFailed(false);
    if (text === message.text) return setEditing(null);
    try {
      const saved = await editMessage(token.current, message.id, text);
      setMessages((prev) => prev?.map((m) => (m.id === saved.id ? saved : m)));
      setEditing(null);
      setEdits((n) => n + 1);
    } catch {
      setEditFailed(true);
    }
  };

  // La correction est refaite en arrière-plan : on relit quelques fois pour la montrer quand elle arrive.
  useEffect(() => {
    if (edits === 0 || !item) return;
    // Après une réponse en attente, la nouvelle correction peut prendre plus de temps.
    const timers = [3000, 8000, 15000, 30000].map((ms) =>
      setTimeout(() => {
        void listMessages(token.current, item.id)
          .then((page) => setMessages((prev) => mergeLatest(prev ?? [], page.items)))
          .catch(() => undefined);
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [edits, item]);

  // Tant que le contact n'a pas répondu, on relit les derniers messages (la correction arrive avec la réponse).
  useEffect(() => {
    if (!awaiting || !item) return;
    let tries = 0;
    let replies = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tries >= POLL_LIMIT) setAwaiting(null);
      void listMessages(token.current, item.id)
        .then((page) => {
          setMessages((prev) => mergeLatest(prev ?? [], page.items));
          const count = repliesAfter(page.items, awaiting.since);
          if (count > replies) {
            replies = count;
            tries = 0;
            markRead(item.id);
          }
          // Une relecture partie avant le dernier envoi ne dit rien de lui.
          if (!isAwaiting(page.items, awaiting.since)) {
            setAwaiting((current) => (current === awaiting ? null : current));
          }
        })
        .catch(() => undefined); // le tour suivant réessaie
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [awaiting, item, markRead]);

  // Venu de la recherche : on remonte page par page jusqu'au message, sans dépasser MAX_SEEK_PAGES.
  useEffect(() => {
    if (!messages || focus !== 'seeking' || older === 'loading') return;
    if (messages.some((m) => m.id === focusMessageId)) {
      skipBottom.current = true;
      setFocus('found');
      setFlash(focusMessageId ?? null);
    } else if (!nextCursor || older === 'error' || seekedPages.current >= MAX_SEEK_PAGES) {
      setFocus('missing');
    } else {
      seekedPages.current += 1;
      void loadOlder();
    }
  }, [messages, focus, focusMessageId, nextCursor, older, loadOlder]);

  useEffect(() => {
    if (focus !== 'found' || !focusMessageId) return;
    document.getElementById(`message-${focusMessageId}`)?.scrollIntoView({ block: 'center' });
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [focus, focusMessageId]);

  // On arrive sur le plus récent, et un nouveau message ramène en bas. Charger des messages plus anciens ne bouge rien.
  const newest = messages?.at(-1)?.id;
  useEffect(() => {
    if (!loaded || focus === 'seeking') return;
    if (skipBottom.current) {
      skipBottom.current = false;
      return;
    }
    end.current?.scrollIntoView({ block: 'end' });
  }, [loaded, focus, newest, pending.length, awaiting !== null]);

  // Quand le clavier s'ouvre, la zone visible rétrécit : on garde les derniers messages au-dessus de la barre.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const stick = () => {
      if (document.activeElement?.id === 'composer') end.current?.scrollIntoView({ block: 'end' });
    };
    viewport.addEventListener('resize', stick);
    return () => viewport.removeEventListener('resize', stick);
  }, []);

  useKeyboardInset();

  const retry = () => {
    setError(false);
    setAttempt((n) => n + 1);
  };

  return (
    <main className="flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip bg-surface-1">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-bg px-4 py-3 lg:h-16 lg:py-0">
        <Button asChild variant="outline" size="icon" className="lg:hidden">
          <Link href="/chats" aria-label={c.back}>
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        {item && (
          <Link
            href={`/chats/${item.agent.slug}/profile`}
            className="flex min-h-11 min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
          >
            <ContactAvatar slug={item.agent.slug} name="" />
            <div className="flex min-w-0 flex-col">
              <h1 className="flex items-center gap-2 font-display text-lg font-bold">
                <span className="truncate">{item.agent.name}</span>
                <Badge variant="neutral">{t.aiBadge}</Badge>
              </h1>
              <p className="text-xs text-text-muted">{c.online}</p>
            </div>
          </Link>
        )}
      </header>

      <div className="relative isolate flex min-w-0 flex-1 flex-col gap-3 px-3 py-4 sm:px-4">
        <ChatBackdrop value={background} />
        {error && (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-bg px-4 py-3">
            <p className="text-[15px] text-danger">{item ? c.messagesError : t.error}</p>
            <Button variant="outline" onClick={retry}>
              {c.retry}
            </Button>
          </div>
        )}
        {item === undefined && !error && <Skeleton aria-busy="true" className="h-16 w-full" />}
        {item === null && <p className="text-text-muted">{c.notFound}</p>}
        {item && !error && !loaded && <Skeleton aria-busy="true" className="h-32 w-full" />}
        {loaded && (
          <>
            {nextCursor && (
              <Button
                variant="outline"
                disabled={older === 'loading'}
                onClick={() => void loadOlder()}
              >
                {older === 'loading' ? c.olderLoading : c.older}
              </Button>
            )}
            {older === 'error' && (
              <p role="alert" className="text-[13px] text-danger">
                {c.olderError}
              </p>
            )}
            {messages.length === 0 && pending.length === 0 && !awaiting ? (
              <p className="text-text-muted">{c.empty}</p>
            ) : (
              <ol aria-label={c.messagesLabel} className="flex flex-col gap-3">
                {messages.map((m, i) => (
                  <Fragment key={m.id}>
                    {(i === 0 ||
                      new Date(m.createdAt).toDateString() !==
                        new Date(messages[i - 1]?.createdAt ?? m.createdAt).toDateString()) && (
                      <li className="self-center rounded-full bg-bg px-3 py-1 text-xs font-semibold text-text-muted">
                        {dayLabel(m.createdAt)}
                      </li>
                    )}
                    <MessageBubble
                      message={m}
                      highlighted={m.id === flash}
                      agentName={item?.agent.name ?? ''}
                      onReply={(m) => {
                        setEditing(null);
                        setReplyTo(m);
                      }}
                      onEdit={(m) => {
                        setReplyTo(null);
                        setEditFailed(false);
                        setEditing(m);
                      }}
                      onReact={async (m, emoji) => {
                        try {
                          const saved = await reactToMessage(token.current, m.id, emoji);
                          setMessages((prev) =>
                            prev?.map((x) =>
                              x.id === m.id ? { ...x, reaction: saved.reaction } : x,
                            ),
                          );
                        } catch {
                          // La pastille ne change pas : la personne peut réessayer.
                        }
                      }}
                      onForward={(m) => {
                        setTargets(undefined);
                        setForwarding(m);
                        listConversations(token.current).then(
                          (all) => setTargets(all.filter((x) => x.id !== item?.id)),
                          () => setTargets([]),
                        );
                      }}
                      onAddToNotebook={(id) => addToNotebook(token.current, id)}
                      onTranslate={(id) => translateMessage(token.current, id)}
                      onDelete={async (id) => {
                        await deleteMessage(token.current, id);
                        setMessages((prev) =>
                          prev?.map((x) =>
                            x.id === id
                              ? {
                                  ...x,
                                  text: '',
                                  translationFr: null,
                                  correction: null,
                                  deleted: true,
                                }
                              : x,
                          ),
                        );
                      }}
                    />
                  </Fragment>
                ))}
                {pending.map((p) => (
                  <PendingBubble
                    key={p.clientId}
                    message={p}
                    onRetry={() => item && void deliver(item.id, p)}
                  />
                ))}
                {awaiting && item && <TypingBubble name={item.agent.name} />}
              </ol>
            )}
            <div ref={end} />
          </>
        )}
        {focus === 'missing' && (
          <p role="status" className="rounded-2xl bg-bg px-4 py-3 text-[15px]">
            {c.messageNotFound}
          </p>
        )}
        {editFailed && (
          <p role="alert" className="rounded-2xl bg-bg px-4 py-3 text-[15px] text-danger">
            {c.editFailed}
          </p>
        )}
        {refusal && item && (
          <p role="status" className="rounded-2xl bg-bg px-4 py-3 text-[15px]">
            {refusal.replace('{name}', item.agent.name)}
          </p>
        )}
      </div>
      {forwarding && (
        <ForwardDialog
          text={previewText(forwarding.text, forwarding.media?.kind)}
          media={forwarding.media?.kind}
          targets={targets}
          onClose={() => setForwarding(null)}
          onPick={async (target, clientId) => {
            // Un vocal ou une photo : l'API reprend le fichier et le texte du message d'origine.
            const copy = forwarding.media
              ? { text: '', mediaFromId: forwarding.id }
              : {
                  text: forwarding.text,
                  forwarded: true,
                  ...(forwarding.sticker ? { sticker: forwarding.sticker } : {}),
                };
            await sendMessage(token.current, target.id, { clientId, ...copy });
            if (forwarding.media?.kind === 'AUDIO') void refreshMic();
          }}
        />
      )}
      {loaded && (
        <Composer
          onSend={send}
          onSendSticker={sendSticker}
          onSendPhoto={(photo) => post({ text: '', photo })}
          onSendVoice={(blob, seconds) => post({ text: '', voice: { blob, seconds } })}
          onMicRequest={consent.ensure}
          micBlocked={micBlocked}
          reply={
            replyTo && {
              name: replyTo.author === 'USER' ? fr.conversation.quoteYou : (item?.agent.name ?? ''),
              text: previewText(replyTo.text, replyTo.media?.kind),
            }
          }
          onCancelReply={() => setReplyTo(null)}
          edit={editing && { id: editing.id, text: editing.text }}
          onCancelEdit={() => {
            setEditing(null);
            setEditFailed(false);
          }}
        />
      )}
      {consent.dialog}
    </main>
  );
}
