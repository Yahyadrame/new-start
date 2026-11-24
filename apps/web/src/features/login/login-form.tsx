'use client';

import { Button, Input } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';
import { LoginError, requestLoginCode, verifyLoginCode } from './login-api';

const t = fr.login;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function failure(err: unknown): string {
  const status = err instanceof LoginError ? err.status : 0;
  if (status === 429) return t.errors.rateLimited;
  if (status === 404) return t.errors.notFound;
  if (status === 400) return t.errors.invalid;
  return t.errors.server;
}

/** Connexion par code : l'adresse e-mail, puis le code reçu. */
export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(failure(err));
    }
    setBusy(false);
  }

  function onEmail(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setError(t.errors.email);
    return run(async () => {
      await requestLoginCode(email.trim());
      setStep('code');
    });
  }

  function onCode(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError(t.errors.format);
    return run(async () => {
      setSession(await verifyLoginCode(email.trim(), code));
      router.push('/chats');
    });
  }

  const message = error && (
    <p id="login-error" role="alert" className="text-[13px] text-danger">
      {error}
    </p>
  );

  if (step === 'email') {
    return (
      <form noValidate onSubmit={onEmail} className="flex flex-col gap-5">
        <p className="text-[15px] text-text-muted">{t.emailStep}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-[15px] font-semibold">
            {t.email}
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby="login-error"
          />
          {message}
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? t.sending : t.sendCode}
        </Button>
      </form>
    );
  }

  return (
    <form noValidate onSubmit={onCode} className="flex flex-col gap-5">
      <p className="text-[15px] text-text-muted">{t.sentTo.replace('{email}', email.trim())}</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-code" className="text-[15px] font-semibold">
          {t.code}
        </label>
        <Input
          id="login-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          aria-invalid={error ? true : undefined}
          aria-describedby="login-error"
          className="text-center text-[24px] tracking-[0.4em]"
        />
        {message}
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? t.verifying : t.submit}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setStep('email');
          setCode('');
          setError(null);
        }}
      >
        {t.changeEmail}
      </Button>
    </form>
  );
}
