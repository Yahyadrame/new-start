'use client';

import type { ConversationItem, MessageItem } from '@newstart/shared';
import { Avatar, AvatarFallback, Badge, Button, Skeleton } from '@newstart/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import {
  addToNotebook,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from './chats-api';
import { hasReplyAfter, isFresh, mergeLatest, POLL_LIMIT, POLL_MS } from './chats-merge';
import { Composer } from './composer';
import { MessageBubble } from './message-bubble';
import { PendingBubble, type PendingMessage } from './pending-bubble';
import { TypingBubble } from './typing-bubble';

const t = fr.chats;
const c = fr.conversation;

/** Écran 4 : l'en-tête du contact, l'historique du plus ancien au plus récent, et le champ d'écriture. */
export function ConversationScreen({ agentSlug }: { agentSlug: string }) {
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
      } catch {
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

  // On arrive sur le plus récent, et un nouveau message ramène en bas. Charger des messages plus anciens ne bouge rien.
  const newest = messages?.at(-1)?.id;
  useEffect(() => {
    if (loaded) end.current?.scrollIntoView({ block: 'end' });
  }, [loaded, newest, pending.length, awaiting !== null]);

  const retry = () => {
    setError(false);
    setAttempt((n) => n + 1);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-10 pb-10">
      <header className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon">
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
              <h1 className="flex items-center gap-2 font-display text-xl font-bold">
                <span className="truncate">{item.agent.name}</span>
                <Badge variant="neutral">{t.aiBadge}</Badge>
              </h1>
              <p className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
                {item.agent.roleFr}
              </p>
            </div>
          </>
        )}
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl bg-surface-1 px-4 py-3"
        >
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
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onAddToNotebook={(id) => addToNotebook(token.current, id)}
                />
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
      {loaded && <Composer onSend={send} />}
    </main>
  );
}
