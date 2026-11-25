'use client';

import type { ConversationItem } from '@newstart/shared';
import { Badge, Button } from '@newstart/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ContactAvatar } from '../../shared/avatar/contact-avatar';
import { loadContactAvatars } from '../../shared/avatar/contact-avatars';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { listConversations } from './chats-api';

const t = fr.contact;
const accents: Record<string, string> = fr.profile.learning.accents;

/** Fiche d'un contact (NS-051, partie 1) : qui il est et comment il parle. On y arrive depuis l'en-tête de la conversation. */
export function ContactProfileScreen({ agentSlug }: Readonly<{ agentSlug: string }>) {
  const router = useRouter();
  const [agent, setAgent] = useState<ConversationItem['agent'] | null>(null);
  const [error, setError] = useState(false);
  const back = `/chats/${agentSlug}`;

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      void loadContactAvatars(session.accessToken);
      try {
        const found = (await listConversations(session.accessToken)).find(
          (i) => i.agent.slug === agentSlug,
        );
        if (found) setAgent(found.agent);
        else setError(true);
      } catch {
        setError(true);
      }
    })();
  }, [router, agentSlug]);

  const rows = agent
    ? [
        [t.accent, accents[agent.accent] ?? agent.accent],
        [t.topic, agent.category],
      ]
    : [];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 px-4 pt-3 pb-8">
      <header className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href={back} aria-label={fr.conversation.back}>
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="font-display text-lg font-bold">{t.title}</h1>
      </header>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {t.error}
        </p>
      )}
      {agent && (
        <>
          <section className="flex flex-col items-center gap-1.5 pt-4">
            <ContactAvatar slug={agent.slug} name="" className="size-30" />
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
              {agent.name}
              <Badge variant="neutral">{fr.chats.aiBadge}</Badge>
            </h2>
            <p className="text-sm text-text-muted">{agent.roleFr}</p>
          </section>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={back}>{t.write}</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`${back}/avatar`}>{t.changeAvatar}</Link>
            </Button>
          </div>
          <section
            aria-labelledby="contact-speech"
            className="rounded-2xl border border-line bg-surface-1 px-4 py-1"
          >
            <h3
              id="contact-speech"
              className="pt-3.5 pb-1.5 text-xs font-semibold tracking-wide text-text-muted uppercase"
            >
              {t.speech}
            </h3>
            <dl>
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex min-h-11 items-center justify-between gap-3 border-t border-line first:border-t-0"
                >
                  <dt className="text-text-muted">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="text-[13px] text-text-muted">{t.aiNote.replace('{name}', agent.name)}</p>
        </>
      )}
    </main>
  );
}
