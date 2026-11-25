'use client';

import { Button, cn } from '@newstart/ui';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ensureSession } from '../auth/session';
import fr from '../i18n/fr.json';
import { fetchUnreadCount } from './unread-count';

const t = fr.nav;

/** Session ouverte ou non, et nombre de notifications non lues (0 tant qu'il n'est pas connu). */
function useUnread() {
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

  return { signedIn, unread: count ?? 0 };
}

function labelFor(unread: number): string {
  if (unread === 0) return t.bell;
  if (unread === 1) return t.bellUnreadOne;
  return t.bellUnreadMany.replace('{count}', String(unread));
}

function Dot({ className }: Readonly<{ className: string }>) {
  return (
    <span
      aria-hidden="true"
      data-testid="unread-dot"
      className={cn('absolute rounded-full bg-text ring-2 ring-bg', className)}
    />
  );
}

/**
 * Cloche de l'en-tête d'un écran, sur mobile : elle suit le titre au lieu de flotter (NS-044).
 * Dès 1024 px, la cloche est dans le rail de gauche. Rien n'est affiché sans session.
 */
export function NotificationsBell({ className }: Readonly<{ className?: string }>) {
  const pathname = usePathname();
  const { signedIn, unread } = useUnread();
  if (!signedIn || pathname === '/notifications') return null;
  return (
    <Button asChild variant="outline" size="icon" className={cn('relative lg:hidden', className)}>
      <Link href="/notifications" aria-label={labelFor(unread)}>
        <Bell aria-hidden="true" className="size-5" />
        {unread > 0 && <Dot className="top-2 right-2.5 size-2.5" />}
      </Link>
    </Button>
  );
}

/** Entrée du rail de gauche (dès 1024 px), en bas avec Profil. */
export function NotificationsRailItem() {
  const pathname = usePathname();
  const { unread } = useUnread();
  const active = pathname === '/notifications';
  return (
    <li className="hidden lg:mt-auto lg:flex lg:justify-center">
      <Link
        href="/notifications"
        aria-current={active ? 'page' : undefined}
        className="flex min-h-11 min-w-14 flex-col items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-accent-text"
      >
        <span
          className={cn(
            'relative flex h-8 w-14 items-center justify-center rounded-full',
            active ? 'bg-accent text-on-accent' : 'text-text-muted',
          )}
        >
          <Bell aria-hidden="true" className="size-5" />
          {unread > 0 && <Dot className="top-1 right-4 size-2.5" />}
        </span>
        <span className={cn('text-xs font-semibold', active ? 'text-text' : 'text-text-muted')}>
          {t.bellShort}
          {unread > 0 && (
            <span className="sr-only">
              {unread === 1 ? t.bellSuffixOne : t.bellSuffixMany.replace('{count}', String(unread))}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
