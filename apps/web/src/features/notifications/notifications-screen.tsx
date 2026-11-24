'use client';

import type { NotificationItem } from '@newstart/shared';
import { Skeleton } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ensureSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { BottomNav } from '../../shared/navigation';
import { groupNotifications } from './group-notifications';
import { fetchNotifications, markAllRead } from './notifications-api';
import { PushBanner } from './push-banner';

const t = fr.notifications;

const hour = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const weekday = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long' });

function Group({
  title,
  items,
  label,
}: {
  title: string;
  items: NotificationItem[];
  label: (iso: string) => string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-muted">{title}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((n) => (
          <li key={n.id} className="flex flex-col gap-1 rounded-2xl bg-surface-1 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className={n.read ? 'font-medium' : 'font-bold'}>{n.title}</p>
              <time dateTime={n.createdAt} className="text-sm text-text-muted">
                {label(n.createdAt)}
              </time>
            </div>
            <p className="text-text-muted">{n.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Écran 15 : les rappels reçus, « Aujourd'hui » puis « Cette semaine ». */
export function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void (async () => {
      const session = await ensureSession();
      if (!session) return router.replace('/');
      try {
        setItems(await fetchNotifications(session.accessToken));
        // Les titres restent en gras pour cette visite ; la prochaine les verra lus.
        void markAllRead(session.accessToken).catch(() => undefined);
      } catch {
        setError(true);
      }
    })();
  }, [router]);

  const { today, week } = groupNotifications(items ?? [], new Date());

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-10 pb-28">
      <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
        {t.title}
      </h1>
      <PushBanner />
      {error && <p role="alert">{t.error}</p>}
      {!error && !items && <Skeleton className="h-40 w-full" />}
      {items && today.length === 0 && week.length === 0 && <p>{t.empty}</p>}
      <Group title={t.today} items={today} label={hour} />
      <Group title={t.week} items={week} label={weekday} />
      <BottomNav />
    </main>
  );
}
