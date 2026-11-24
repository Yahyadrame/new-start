'use client';

import { cn } from '@newstart/ui';
import { ChartNoAxesColumn, Clapperboard, Gamepad2, MessageCircle, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import fr from '../i18n/fr.json';
import { NotificationsBell } from './notifications-bell';

const t = fr.nav;

const TABS = [
  { href: '/chats', label: t.chats, Icon: MessageCircle },
  { href: '/series', label: t.series, Icon: Clapperboard },
  { href: '/games', label: t.games, Icon: Gamepad2 },
  { href: '/progress', label: t.progress, Icon: ChartNoAxesColumn },
  { href: '/profile', label: t.profile, Icon: UserRound },
] as const;

/**
 * Navigation principale : barre d'onglets en bas sur mobile, rail à gauche dès 1024 px (NS-034).
 * L'onglet actif a une pilule verte derrière l'icône ; Profil se place en bas du rail.
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <>
      <NotificationsBell />
      <nav
        aria-label={t.label}
        data-shell-nav=""
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] lg:inset-y-0 lg:right-auto lg:w-[72px] lg:border-t-0 lg:border-r lg:pb-0"
      >
        <ul className="mx-auto flex max-w-md justify-around px-2 pt-2 pb-2 lg:h-full lg:max-w-none lg:flex-col lg:justify-start lg:gap-3 lg:px-0 lg:py-4">
          <li aria-hidden="true" className="hidden lg:mb-2 lg:flex lg:justify-center">
            <img src="/logo-icon.svg" alt="" width={36} height={36} />
          </li>
          {TABS.map(({ href, label, Icon }, index) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li
                key={href}
                className={cn(
                  'lg:flex lg:justify-center',
                  index === TABS.length - 1 && 'lg:mt-auto',
                )}
              >
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="flex min-h-11 min-w-14 flex-col items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-accent-text"
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
                    className={cn(
                      'text-xs font-semibold',
                      active ? 'text-text' : 'text-text-muted',
                    )}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
