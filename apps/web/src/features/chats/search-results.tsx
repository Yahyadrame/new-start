'use client';

import type { SearchHit } from '@newstart/shared';
import { Avatar, AvatarFallback, Skeleton } from '@newstart/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import fr from '../../shared/i18n/fr.json';
import { searchMessages } from './chats-api';
import { formatWhen, splitMatch } from './chats-format';

const t = fr.chats;

/** On attend la fin de la frappe avant d'interroger l'API. */
const DEBOUNCE_MS = 300;
/** En dessous, l'API refuse la recherche (400). */
export const MIN_QUERY = 2;

type State = { status: 'loading' } | { status: 'error' } | { status: 'done'; items: SearchHit[] };

/** Sous la liste des contacts : les messages qui contiennent la recherche, avec le mot surligné. */
export function SearchResults({ token, query }: { token: string; query: string }) {
  const q = query.trim();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (q.length < MIN_QUERY) return;
    let stale = false;
    setState({ status: 'loading' });
    const timer = setTimeout(() => {
      searchMessages(token, q).then(
        (items) => !stale && setState({ status: 'done', items }),
        () => !stale && setState({ status: 'error' }),
      );
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [token, q]);

  if (q.length < MIN_QUERY) return null;
  return (
    <section aria-label={t.searchMessages} className="flex flex-col pt-2">
      <h2 className="px-4 pb-1 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
        {t.searchMessages}
      </h2>
      {state.status === 'loading' && (
        <div aria-busy="true" aria-label={t.searchLoading} className="flex flex-col gap-3 px-4">
          <Skeleton className="h-14 w-full" />
        </div>
      )}
      {state.status === 'error' && (
        <p role="alert" className="px-4 text-[15px] text-danger">
          {t.searchError}
        </p>
      )}
      {state.status === 'done' && state.items.length === 0 && (
        <p className="px-4 text-text-muted">{t.searchNone.replace('{q}', q)}</p>
      )}
      {state.status === 'done' && state.items.length > 0 && (
        <ul className="flex flex-col">
          {state.items.map((hit) => (
            <li key={hit.messageId}>
              <Link
                href={`/chats/${hit.agent.slug}?message=${hit.messageId}`}
                className="flex min-h-[72px] items-center gap-3 px-4 py-3 hover:bg-surface-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-text"
              >
                <Avatar className="size-[44px]">
                  <AvatarFallback>{hit.agent.initials}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-base font-semibold">{hit.agent.name}</span>
                    <time dateTime={hit.createdAt} className="shrink-0 text-xs text-text-muted">
                      {formatWhen(hit.createdAt)}
                    </time>
                  </span>
                  <span className="line-clamp-2 text-sm break-words text-text-muted">
                    {hit.author === 'USER' && t.you}
                    {splitMatch(hit.excerpt, q).map((part, i) =>
                      part.match ? (
                        <mark key={i} className="rounded-sm bg-accent px-0.5 text-on-accent">
                          {part.text}
                        </mark>
                      ) : (
                        part.text
                      ),
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
