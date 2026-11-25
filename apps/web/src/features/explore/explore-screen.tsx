'use client';

import { recommendedTopics, type AgentCard, type TopicItem } from '@newstart/shared';
import { Avatar, AvatarFallback, Badge, Button, Input, Skeleton } from '@newstart/ui';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav } from '../../shared/navigation';
import { ExploreError, getTastes, listAgents, listTopics, startConversation } from './explore-api';

const t = fr.explore;
const SEARCH_DELAY_MS = 300;

/** Écran 12 des maquettes : chercher un contact ou parcourir les thèmes, puis lui écrire. */
export function ExploreScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicItem[] | null>(null);
  const [agents, setAgents] = useState<AgentCard[] | null>(null);
  const [forYou, setForYou] = useState<string[]>([]);
  const [topic, setTopic] = useState<TopicItem | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState<string | null>(null);

  const q = query.trim();
  const suggested = (topics ?? []).filter((x) => x.agentCount > 0 && forYou.includes(x.slug));
  const browsing = topic !== null || q !== '';

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        setTopics(await listTopics(session.accessToken));
      } catch {
        setError(t.error);
      }
      // Les propositions sont un plus : sans elles, la liste des thèmes reste complète.
      try {
        const { goal, interests } = await getTastes(session.accessToken);
        setForYou(recommendedTopics(goal, interests));
      } catch {
        setForYou([]);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!browsing) return setAgents(null);
    let stale = false;
    setAgents(null);
    const timer = setTimeout(
      () =>
        void (async () => {
          const session = await ensureSession();
          if (!session) return router.replace('/');
          try {
            const found = await listAgents(session.accessToken, { topic: topic?.slug, q });
            if (!stale) setAgents(found);
          } catch {
            if (!stale) setError(t.error);
          }
        })(),
      q ? SEARCH_DELAY_MS : 0,
    );
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [browsing, topic, q, router]);

  async function write(slug: string) {
    setWriting(slug);
    setError(null);
    try {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      await startConversation(session.accessToken, slug);
      router.push(`/chats/${slug}`);
    } catch (e) {
      setError(e instanceof ExploreError && e.status === 403 ? t.adultOnly : t.writeError);
      setWriting(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-14 pb-28">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
          {t.title}
        </h1>
        <Input
          type="search"
          aria-label={t.searchLabel}
          placeholder={t.searchPlaceholder}
          value={query}
          maxLength={50}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      {error && (
        <p role="alert" className="rounded-2xl bg-surface-1 px-4 py-3 text-[15px] text-danger">
          {error}
        </p>
      )}

      {topic && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label={t.back} onClick={() => setTopic(null)}>
            <ArrowLeft aria-hidden="true" />
          </Button>
          <h2 className="font-display text-xl font-bold">{topic.nameFr}</h2>
        </div>
      )}

      {!browsing && !topics && !error && (
        <div aria-busy="true" className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!browsing && suggested.length > 0 && (
        <section aria-labelledby="for-you" className="flex flex-col gap-3">
          <h2
            id="for-you"
            className="text-sm font-semibold tracking-[0.08em] text-text-muted uppercase"
          >
            {t.forYou}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {suggested.map((item) => (
              <li key={item.slug}>
                <Button variant="outline" onClick={() => setTopic(item)}>
                  {item.nameFr}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!browsing && topics && (
        <ul aria-label={t.topicsLabel} className="grid grid-cols-2 gap-3">
          {topics.map((item) => {
            const soon = item.agentCount === 0;
            return (
              <li key={item.slug}>
                <button
                  type="button"
                  disabled={soon}
                  onClick={() => setTopic(item)}
                  className="flex min-h-24 w-full flex-col items-start justify-between gap-2 rounded-2xl border border-line bg-surface-1 p-4 text-left focus-visible:outline-2 focus-visible:outline-accent-text enabled:hover:bg-surface-2 disabled:opacity-60"
                >
                  <span className="font-semibold">{item.nameFr}</span>
                  {soon ? (
                    <Badge variant="neutral">{t.soon}</Badge>
                  ) : (
                    <span className="text-sm text-text-muted">
                      {item.agentCount === 1
                        ? t.contactOne
                        : t.contactCount.replace('{n}', String(item.agentCount))}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {browsing && !agents && !error && (
        <div aria-busy="true" className="flex flex-col gap-4">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-16 w-full" />
          ))}
        </div>
      )}

      {browsing && agents && agents.length === 0 && (
        <p className="text-text-muted">{q ? t.noResult : t.emptyTopic}</p>
      )}

      {browsing && agents && agents.length > 0 && (
        <ul aria-label={t.contactsLabel} className="flex flex-col divide-y divide-line">
          {agents.map((a) => (
            <li key={a.slug} className="flex min-h-16 items-center gap-3 py-3">
              <Avatar>
                <AvatarFallback>{a.initials}</AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold">{a.name}</span>
                  <Badge variant="neutral">{t.aiBadge}</Badge>
                </span>
                <span className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
                  {a.roleFr}
                </span>
              </span>
              <Button
                variant="outline"
                disabled={writing !== null}
                aria-label={t.writeTo.replace('{name}', a.name)}
                onClick={() => void write(a.slug)}
              >
                {t.write}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <BottomNav />
    </main>
  );
}
