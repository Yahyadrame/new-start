import Link from 'next/link';
import fr from '../../shared/i18n/fr.json';
import { SignupForm } from './signup-form';

const t = fr.signup;

/** Écran 11 des maquettes : on demande le prénom avant tout, le reste suit. */
export function SignupScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pt-8 pb-9">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-[15px] font-medium text-text-muted"
        >
          {t.back}
        </Link>
        <div role="img" aria-label={t.stepLabel} className="flex flex-1 gap-1.5">
          <span className="h-1 flex-1 rounded-full bg-accent" />
          <span className="h-1 flex-1 rounded-full bg-surface-2" />
          <span className="h-1 flex-1 rounded-full bg-surface-2" />
        </div>
      </div>
      <h1 className="font-display text-[32px] leading-[1.1] font-bold tracking-[-0.02em]">
        {t.title}
      </h1>
      <SignupForm />
    </main>
  );
}
