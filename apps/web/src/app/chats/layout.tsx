'use client';

import { cn } from '@newstart/ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ChatsScreen } from '../../features/chats';

/**
 * Discussions (NS-034) : la liste reste affichée à gauche dès 1024 px et la conversation s'ouvre à droite.
 * La liste reste en place quand on fait défiler les messages (elle défile seule si elle est longue).
 * Sur mobile, on voit l'un ou l'autre : la liste sur /chats, la conversation sur /chats/[contact].
 */
export default function ChatsLayout({ children }: { children: ReactNode }) {
  const inConversation = usePathname() !== '/chats';
  return (
    <div className="lg:grid lg:grid-cols-[400px_minmax(0,1fr)]">
      <div
        className={cn(
          'lg:sticky lg:top-0 lg:block lg:h-dvh lg:self-start lg:overflow-y-auto lg:border-r lg:border-line',
          inConversation && 'hidden',
        )}
      >
        <ChatsScreen />
      </div>
      <div className={cn(!inConversation && 'hidden lg:block')}>{children}</div>
    </div>
  );
}
