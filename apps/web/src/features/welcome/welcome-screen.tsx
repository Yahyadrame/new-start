import { Button } from '@newstart/ui';
import Link from 'next/link';
import fr from '../../shared/i18n/fr.json';

const t = fr.welcome;

/** Écran 1 des maquettes : déconnecté, on montre une vraie conversation avant de demander quoi que ce soit. */
export function WelcomeScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-7 px-6 pt-14 pb-9">
      <div className="flex items-center gap-2.5">
        <img src="/logo-icon.svg" alt={t.logoAlt} width={36} height={36} />
        <span className="font-display text-xl font-bold tracking-[-0.02em]">{t.brand}</span>
      </div>

      <ul aria-label={t.bubblesLabel} className="flex flex-1 flex-col justify-center">
        <li className="w-75 rounded-full bg-accent px-7 pt-5.5 pb-10 text-base font-semibold text-on-accent">
          {t.bubbles.first}
        </li>
        <li className="-mt-6.5 ml-10 w-75 rounded-full bg-surface-2 px-7 pt-5.5 pb-10 text-base font-medium">
          {t.bubbles.second}
        </li>
        <li className="-mt-6.5 flex w-75 items-center gap-2.5 rounded-full border border-line bg-surface-1 px-7 py-5.5 text-base font-medium">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-accent" />
          <span>
            {t.bubbles.meLabel} : {t.bubbles.me}
          </span>
        </li>
      </ul>

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[44px] leading-[1.02] font-bold tracking-[-0.03em]">
          {t.title}
        </h1>
        <p className="text-base leading-normal text-text-muted">{t.subtitle}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button asChild size="lg">
          <Link href="/signup">{t.start}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">{t.login}</Link>
        </Button>
        <p className="mt-1 text-center text-[13px] text-text-muted">{t.note}</p>
      </div>
    </main>
  );
}
