'use client';

import type { ConversationItem } from '@newstart/shared';
import {
  Badge,
  Button,
  cn,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from '@newstart/ui';
import { ChevronDown, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ContactAvatar } from '../../shared/avatar/contact-avatar';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav, NotificationsBell } from '../../shared/navigation';
import { listConversations } from './chats-api';
import { SearchResults } from './search-results';
import {
  applyFilter,
  formatWhen,
  MAIN_FILTERS,
  matchesQuery,
  MORE_FILTERS,
  type Filter,
} from './chats-format';

const t = fr.chats;

/** Écran 3 (maquettes NS-033) : recherche, filtres, puis la liste des contacts façon messagerie. */
export function ChatsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ConversationItem[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      setToken(session.accessToken);
      try {
        setItems(await listConversations(session.accessToken));
      } catch {
        setError(true);
      }
    })();
  }, [router]);

  const isMore = (MORE_FILTERS as readonly string[]).includes(filter);
  const filtered = items ? applyFilter(items, filter) : [];
  const shown = matchesQuery(filtered, query);

  return (
    <main className="flex min-h-dvh w-full flex-col gap-3 pt-12 pb-28 lg:pt-0 lg:pb-6">
      <header className="flex items-center justify-between px-4 lg:h-16">
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-[-0.02em]">
          {t.title}
        </h1>
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <Link
            href="/explore"
            aria-label={t.explore}
            className="fixed right-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-10 flex size-14 items-center justify-center rounded-full border border-line bg-surface-1 text-text shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text lg:static lg:size-11 lg:border-0 lg:bg-accent lg:text-on-accent lg:shadow-none"
          >
            <Plus aria-hidden="true" />
          </Link>
        </div>
      </header>

      {error && (
        <p role="alert" className="mx-4 rounded-2xl bg-surface-1 px-4 py-3 text-[15px] text-danger">
          {t.error}
        </p>
      )}

      {items && items.length > 0 && (
        <>
          <div className="relative px-4">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-8 size-4 -translate-y-1/2 text-text-muted"
            />
            <Input
              type="search"
              className="pl-10"
              aria-label={t.searchLabel}
              placeholder={t.searchPlaceholder}
              value={query}
              maxLength={50}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div
            role="group"
            aria-label={t.filtersLabel}
            className="flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {MAIN_FILTERS.map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'outline'}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className="shrink-0 px-3"
              >
                {f === 'all' ? t.filters.all : f === 'unread' ? t.filters.unread : f}
              </Button>
            ))}
            <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={isMore ? 'primary' : 'outline'}
                  aria-label={isMore ? undefined : t.filters.moreLabel}
                  className="shrink-0 px-3"
                >
                  {isMore ? filter : t.filters.more}
                  <ChevronDown aria-hidden="true" className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44">
                {MORE_FILTERS.map((f) => (
                  <Button
                    key={f}
                    variant="ghost"
                    aria-pressed={filter === f}
                    onClick={() => {
                      setFilter(f);
                      setMoreOpen(false);
                    }}
                    className={cn('w-full justify-start', filter === f && 'font-bold')}
                  >
                    {f}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      {!items && !error && (
        <div aria-busy="true" className="flex flex-col gap-4 px-4">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-16 w-full" />
          ))}
        </div>
      )}

      {items && items.length === 0 && <p className="px-4 text-text-muted">{t.empty}</p>}
      {items && items.length > 0 && shown.length === 0 && (
        <p className="px-4 text-text-muted">{query.trim() ? t.noMatch : t.emptyFilter}</p>
      )}

      <ul className="flex flex-col">
        {shown.map((c) => (
          <li
            key={c.id}
            className="after:mr-4 after:ml-[76px] after:block after:border-b after:border-line last:after:hidden"
          >
            <Link
              href={`/chats/${c.agent.slug}`}
              className="flex min-h-[72px] items-center gap-3 px-4 py-3 hover:bg-surface-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-text"
            >
              <ContactAvatar slug={c.agent.slug} name={c.agent.name} className="size-[52px]" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="truncate text-base font-semibold">{c.agent.name}</span>
                  <Badge variant="neutral">{t.aiBadge}</Badge>
                </span>
                <span className="truncate text-sm text-text-muted">
                  {c.lastMessage
                    ? `${c.lastMessage.author === 'USER' ? t.you : ''}${c.lastMessage.text}`
                    : t.noMessage}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1.5 self-start pt-1">
                <time
                  dateTime={c.lastMessageAt}
                  className={cn('text-xs', c.unreadCount > 0 ? 'font-semibold' : 'text-text-muted')}
                >
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
      {token && items && items.length > 0 && <SearchResults token={token} query={query} />}
      <BottomNav />
    </main>
  );
}
