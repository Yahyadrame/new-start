import Link from 'next/link';
import fr from '../../shared/i18n/fr.json';
import { LoginForm } from './login-form';

const t = fr.login;

/** Retour d'une personne qui a déjà un compte : adresse e-mail, puis code. */
export function LoginScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pt-8 pb-9">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center self-start text-[15px] font-medium text-text-muted"
      >
        {t.back}
      </Link>
      <h1 className="font-display text-[32px] leading-[1.1] font-bold tracking-[-0.02em]">
        {t.title}
      </h1>
      <LoginForm />
      <p className="text-[15px] text-text-muted">
        {t.noAccount}{' '}
        <Link href="/signup" className="inline-flex min-h-11 items-center font-semibold underline">
          {t.signupLink}
        </Link>
      </p>
    </main>
  );
}
