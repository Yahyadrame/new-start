'use client';

import { cn } from '@newstart/ui';
import { ChartNoAxesColumn, Clapperboard, Gamepad2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import fr from '../i18n/fr.json';

const t = fr.nav;

const TABS = [
  { href: '/chats', label: t.chats, Icon: MessageCircle },
  { href: '/series', label: t.series, Icon: Clapperboard },
  { href: '/games', label: t.games, Icon: Gamepad2 },
  { href: '/progress', label: t.progress, Icon: ChartNoAxesColumn },
] as const;

/** Barre d'onglets du bas (écrans 3, 6, 7, 9) : l'onglet actif a une pilule verte derrière l'icône. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={t.label}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md justify-around px-2 pt-2 pb-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-11 min-w-16 flex-col items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-accent-text"
              >
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-full',
                    active ? 'bg-accent text-on-accent' : 'text-text-muted',
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span
                  className={cn('text-xs font-semibold', active ? 'text-text' : 'text-text-muted')}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
