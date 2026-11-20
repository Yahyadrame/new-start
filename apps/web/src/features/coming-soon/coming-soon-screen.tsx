import Link from 'next/link';
import fr from '../../shared/i18n/fr.json';
import { BottomNav } from '../../shared/navigation';

const t = fr.comingSoon;

/** Écran provisoire des onglets Série, Jeux et Progrès : la barre du bas ne mène plus à une page introuvable. */
export function ComingSoonScreen({ title }: Readonly<{ title: string }>) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-6 pt-10 pb-28">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
          {title}
        </h1>
        <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-text-muted">
          {t.badge}
        </span>
      </header>
      <p className="text-text-muted">{t.body}</p>
      <Link
        href="/chats"
        className="inline-flex min-h-11 items-center justify-center self-start rounded-full bg-accent px-5 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-accent-text"
      >
        {t.toChats}
      </Link>
      <BottomNav />
    </main>
  );
}
