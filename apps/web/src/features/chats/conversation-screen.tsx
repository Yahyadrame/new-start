'use client';

import type { ConversationItem, MessageItem } from '@newstart/shared';
import { Avatar, AvatarFallback, Badge, Button, Skeleton } from '@newstart/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { listConversations, listMessages } from './chats-api';
import { MessageBubble } from './message-bubble';

const t = fr.chats;
const c = fr.conversation;

/** Écran 4 : l'en-tête du contact et l'historique, du plus ancien au plus récent. L'envoi vient ensuite. */
export function ConversationScreen({ agentSlug }: { agentSlug: string }) {
  const router = useRouter();
  const [item, setItem] = useState<ConversationItem | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [messages, setMessages] = useState<MessageItem[] | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [older, setOlder] = useState<'idle' | 'loading' | 'error'>('idle');
  const [attempt, setAttempt] = useState(0);
  const token = useRef('');
  const end = useRef<HTMLDivElement>(null);
  const loaded = messages !== undefined;

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
        const page = await listMessages(token.current, found.id);
        setMessages([...page.items].reverse());
        setNextCursor(page.nextCursor);
      } catch {
        setError(true);
      }
    })();
  }, [router, agentSlug, attempt]);

  // Au premier affichage, on arrive sur le message le plus récent.
  useEffect(() => {
    if (loaded) end.current?.scrollIntoView({ block: 'end' });
  }, [loaded]);

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
          {messages.length === 0 ? (
            <p className="text-text-muted">{c.empty}</p>
          ) : (
            <ol aria-label={c.messagesLabel} className="flex flex-col gap-3">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </ol>
          )}
          <div ref={end} />
        </>
      )}
    </main>
  );
}
