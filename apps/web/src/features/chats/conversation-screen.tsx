'use client';

import type { ConversationItem } from '@newstart/shared';
import { Avatar, AvatarFallback, Badge, Button, Skeleton } from '@newstart/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { listConversations } from './chats-api';

const t = fr.chats;
const c = fr.conversation;

/** Écran 4, coquille : l'en-tête du contact. Les bulles et l'envoi viennent avec NS-204. */
export function ConversationScreen({ agentSlug }: { agentSlug: string }) {
  const router = useRouter();
  const [item, setItem] = useState<ConversationItem | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        const items = await listConversations(session.accessToken);
        setItem(items.find((i) => i.agent.slug === agentSlug) ?? null);
      } catch {
        setError(true);
      }
    })();
  }, [router, agentSlug]);

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
        <p role="alert" className="rounded-2xl bg-surface-1 px-4 py-3 text-[15px] text-danger">
          {t.error}
        </p>
      )}
      {item === undefined && !error && <Skeleton aria-busy="true" className="h-16 w-full" />}
      {item === null && <p className="text-text-muted">{c.notFound}</p>}
      {item && <p className="text-text-muted">{c.soon}</p>}
    </main>
  );
}
