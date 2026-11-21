'use client';

import { Button } from '@newstart/ui';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ensureSession } from '../auth/session';
import fr from '../i18n/fr.json';
import { fetchUnreadCount } from './unread-count';

const t = fr.nav;

/** Cloche vers l'écran Notifications, avec un point quand il reste du non-lu. Rien n'est affiché sans session. */
export function NotificationsBell() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const session = await ensureSession();
        if (!alive || !session) return;
        setSignedIn(true);
        const n = await fetchUnreadCount(session.accessToken);
        if (alive) setCount(n);
      } catch {
        // Le point est un confort : sans lui, la cloche reste utilisable.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!signedIn || pathname === '/notifications') return null;
  const unread = count ?? 0;
  const label =
    unread === 0
      ? t.bell
      : unread === 1
        ? t.bellUnreadOne
        : t.bellUnreadMany.replace('{count}', String(unread));

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1 z-10">
      <div className="mx-auto flex max-w-md justify-end px-6">
        <Button asChild variant="outline" size="icon" className="pointer-events-auto relative">
          <Link href="/notifications" aria-label={label}>
            <Bell aria-hidden="true" className="size-5" />
            {unread > 0 && (
              <span
                aria-hidden="true"
                data-testid="unread-dot"
                className="absolute top-2 right-2.5 size-2.5 rounded-full bg-text ring-2 ring-bg"
              />
            )}
          </Link>
        </Button>
      </div>
    </div>
  );
}
