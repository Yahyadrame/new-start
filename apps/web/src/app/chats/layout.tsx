'use client';

import { cn } from '@newstart/ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ChatsScreen } from '../../features/chats';

/**
 * Discussions (NS-034) : la liste reste affichée à gauche dès 1024 px et la conversation s'ouvre à droite.
 * Sur mobile, on voit l'un ou l'autre : la liste sur /chats, la conversation sur /chats/[contact].
 */
export default function ChatsLayout({ children }: { children: ReactNode }) {
  const inConversation = usePathname() !== '/chats';
  return (
    <div className="lg:grid lg:grid-cols-[400px_minmax(0,1fr)]">
      <div className={cn('lg:block lg:border-r lg:border-line', inConversation && 'hidden')}>
        <ChatsScreen />
      </div>
      <div className={cn(!inConversation && 'hidden lg:block')}>{children}</div>
    </div>
  );
}
