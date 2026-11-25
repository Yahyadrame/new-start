'use client';

import type { ChatBackground, ConversationItem, MessageItem } from '@newstart/shared';
import { Avatar, AvatarFallback, Badge, Button, Skeleton } from '@newstart/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import { ChatBackdrop, getChatBackground } from '../../shared/chat-background';
import fr from '../../shared/i18n/fr.json';
import {
  addToNotebook,
  deleteMessage,
  translateMessage,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from './chats-api';
import { dayLabel } from './chats-format';
import { hasReplyAfter, isFresh, mergeLatest, POLL_LIMIT, POLL_MS } from './chats-merge';
import { Composer } from './composer';
import { MessageBubble } from './message-bubble';
import { PendingBubble, type PendingMessage } from './pending-bubble';
import { TypingBubble } from './typing-bubble';

const t = fr.chats;
const c = fr.conversation;

/** Pages plus anciennes qu'on charge au plus pour retrouver un message de la recherche (30 messages chacune). */
const MAX_SEEK_PAGES = 20;
/** Durée pendant laquelle le message retrouvé reste entouré. */
const FLASH_MS = 3000;

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
  // Date du dernier message envoyé tant que le contact n'a pas répondu ; null sinon.
  const [awaiting, setAwaiting] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // La limite du jour est atteinte : le message n'est pas parti et réessayer ne sert à rien avant demain.
  const [limited, setLimited] = useState(false);
  const [background, setBackground] = useState<ChatBackground>('NONE');
  // `seeking` : on charge des pages plus anciennes jusqu'à trouver le message.
  const [focus, setFocus] = useState<'seeking' | 'found' | 'missing' | null>(
    focusMessageId ? 'seeking' : null,
  );
  const [flash, setFlash] = useState<string | null>(null);
  const seekedPages = useRef(0);
  const skipBottom = useRef(false);
  const token = useRef('');
  const end = useRef<HTMLDivElement>(null);
  const loaded = messages !== undefined;

  // Lire n'est pas bloquant : si l'appel échoue, le badge reste, il sera remis à zéro à la prochaine ouverture.
  const markRead = useCallback((conversationId: string) => {
    void markConversationRead(token.current, conversationId).catch(() => undefined);
  }, []);

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      token.current = session.accessToken;
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
        const last = page.items[0];
        if (last?.author === 'USER' && isFresh(last.createdAt)) setAwaiting(last.createdAt);
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
    async (conversationId: string, { clientId, text }: PendingMessage) => {
      const mark = (status: PendingMessage['status']) =>
        setPending((prev) => prev.map((p) => (p.clientId === clientId ? { ...p, status } : p)));
      mark('sending');
      try {
        const sent = await sendMessage(token.current, conversationId, { clientId, text });
        setMessages((prev) => [...(prev ?? []), sent]);
        setPending((prev) => prev.filter((p) => p.clientId !== clientId));
        setAwaiting(sent.createdAt);
      } catch (e) {
        if ((e as { code?: string }).code === 'USAGE_LIMIT') {
          setPending((prev) => prev.filter((p) => p.clientId !== clientId));
          setLimited(true);
          return;
        }
        mark('failed');
      }
    },
    [],
  );

  const send = (text: string) => {
    if (!item) return;
    const message: PendingMessage = { clientId: crypto.randomUUID(), text, status: 'sending' };
    setPending((prev) => [...prev, message]);
    void deliver(item.id, message);
  };

  // Tant que le contact n'a pas répondu, on relit les derniers messages (la correction arrive avec la réponse).
  useEffect(() => {
    if (!awaiting || !item) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tries >= POLL_LIMIT) setAwaiting(null);
      void listMessages(token.current, item.id)
        .then((page) => {
          setMessages((prev) => mergeLatest(prev ?? [], page.items));
          if (hasReplyAfter(page.items, awaiting)) {
            setAwaiting(null);
            markRead(item.id);
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

  const retry = () => {
    setError(false);
    setAttempt((n) => n + 1);
  };

  return (
    <main className="flex min-h-dvh w-full min-w-0 flex-col overflow-x-hidden bg-surface-1">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-bg px-4 py-3 lg:h-16 lg:py-0">
        <Button asChild variant="outline" size="icon" className="lg:hidden">
          <Link href="/chats" aria-label={c.back}>
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        {item && (
          <>
            <Avatar>
              <AvatarFallback>{item.agent.initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <h1 className="flex items-center gap-2 font-display text-lg font-bold">
                <span className="truncate">{item.agent.name}</span>
                <Badge variant="neutral">{t.aiBadge}</Badge>
              </h1>
              <p className="text-xs text-text-muted">{c.online}</p>
            </div>
          </>
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
        {limited && item && (
          <p role="status" className="rounded-2xl bg-bg px-4 py-3 text-[15px]">
            {c.limitReached.replace('{name}', item.agent.name)}
          </p>
        )}
      </div>
      {loaded && <Composer onSend={send} />}
    </main>
  );
}
