'use client';

import { Button } from '@newstart/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AvatarPicker } from '../../shared/avatar/avatar-picker';
import { CONTACT_STYLE } from '../../shared/avatar/config';
import { contactAvatarId } from '../../shared/avatar/contact-avatar';
import {
  chooseContactAvatar,
  loadContactAvatars,
  useContactChoice,
} from '../../shared/avatar/contact-avatars';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { listConversations } from './chats-api';

const t = fr.avatar;

/** Choisir la silhouette d'un contact, ou revenir à l'originale. On y arrive en touchant son avatar dans la conversation. */
export function ContactAvatarScreen({ agentSlug }: Readonly<{ agentSlug: string }>) {
  const router = useRouter();
  const token = useRef('');
  const choice = useContactChoice(agentSlug);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const back = `/chats/${agentSlug}`;

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      token.current = session.accessToken;
      try {
        const [items] = await Promise.all([
          listConversations(token.current),
          loadContactAvatars(token.current),
        ]);
        const found = items.find((i) => i.agent.slug === agentSlug);
        if (found) setName(found.agent.name);
        else setError(true);
      } catch {
        setError(true);
      }
    })();
  }, [router, agentSlug]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 px-4 pt-3 pb-8">
      <header className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href={back} aria-label={fr.conversation.back}>
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="font-display text-lg font-bold">
          {name ? t.contactTitle.replace('{name}', name) : ''}
        </h1>
      </header>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {fr.chats.error}
        </p>
      )}
      {name && (
        <AvatarPicker
          // Le sélecteur se remonte quand le choix chargé arrive, pour partir de la bonne silhouette.
          key={choice?.id ?? 'origine'}
          value={choice}
          name={name}
          original={{
            id: contactAvatarId(agentSlug),
            style: CONTACT_STYLE === 'vert' ? 'duo' : CONTACT_STYLE,
          }}
          onSave={(next) => chooseContactAvatar(token.current, agentSlug, next)}
          onClose={() => router.push(back)}
        />
      )}
    </main>
  );
}
