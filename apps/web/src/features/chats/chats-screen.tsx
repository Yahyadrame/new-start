'use client';

import { AGENT_STATUSES, type ConversationItem } from '@newstart/shared';
import { Avatar, AvatarFallback, Badge, Button, Skeleton } from '@newstart/ui';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav } from '../../shared/navigation';
import { listConversations } from './chats-api';
import { applyFilter, FILTERS, formatWhen, type Filter } from './chats-format';

const t = fr.chats;

/** Écran 3 des maquettes : les statuts, les filtres, puis la liste des contacts. */
export function ChatsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ConversationItem[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        setItems(await listConversations(session.accessToken));
      } catch {
        setError(true);
      }
    })();
  }, [router]);

  const shown = items ? applyFilter(items, filter) : [];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-14 pb-28">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
          {t.title}
        </h1>
        <Button asChild variant="outline" size="icon">
          <Link href="/explore" aria-label={t.explore}>
            <Plus aria-hidden="true" />
          </Link>
        </Button>
      </header>

      {error && (
        <p role="alert" className="rounded-2xl bg-surface-1 px-4 py-3 text-[15px] text-danger">
          {t.error}
        </p>
      )}

      {items && items.length > 0 && (
        <>
          <ul aria-label={t.statusesLabel} className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-1">
            {items.map(({ id, agent }) => (
              <li key={id} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
                <Avatar>
                  <AvatarFallback>{agent.initials}</AvatarFallback>
                </Avatar>
                <span className="w-full truncate text-[13px] font-semibold">{agent.name}</span>
                <span className="line-clamp-2 text-xs leading-tight text-text-muted">
                  {AGENT_STATUSES[agent.slug]}
                </span>
              </li>
            ))}
          </ul>

          <div
            role="group"
            aria-label={t.filtersLabel}
            className="-mx-6 flex gap-2 overflow-x-auto px-6"
          >
            {FILTERS.map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'outline'}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className="shrink-0"
              >
                {f === 'all' ? t.filters.all : f === 'unread' ? t.filters.unread : f}
              </Button>
            ))}
          </div>
        </>
      )}

      {!items && !error && (
        <div aria-busy="true" className="flex flex-col gap-4">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-16 w-full" />
          ))}
        </div>
      )}

      {items && items.length === 0 && <p className="text-text-muted">{t.empty}</p>}
      {items && items.length > 0 && shown.length === 0 && (
        <p className="text-text-muted">{t.emptyFilter}</p>
      )}

      <ul className="flex flex-col divide-y divide-line">
        {shown.map((c) => (
          <li key={c.id}>
            <Link
              href={`/chats/${c.agent.slug}`}
              className="flex min-h-16 items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-accent-text"
            >
              <span className="relative">
                <Avatar>
                  <AvatarFallback>{c.agent.initials}</AvatarFallback>
                </Avatar>
                <span
                  role="img"
                  aria-label={t.online}
                  className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-bg bg-accent"
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold">{c.agent.name}</span>
                  <Badge variant="neutral">{t.aiBadge}</Badge>
                </span>
                <span className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
                  {c.agent.roleFr}
                </span>
                <span className="truncate text-sm text-text-muted">
                  {c.lastMessage
                    ? `${c.lastMessage.author === 'USER' ? t.you : ''}${c.lastMessage.text}`
                    : t.noMessage}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1.5">
                <time dateTime={c.lastMessageAt} className="text-xs text-text-muted">
                  {formatWhen(c.lastMessageAt)}
                </time>
                {c.unreadCount > 0 && (
                  <Badge aria-label={t.unread.replace('{n}', String(c.unreadCount))}>
                    {c.unreadCount}
                  </Badge>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <BottomNav />
    </main>
  );
}
